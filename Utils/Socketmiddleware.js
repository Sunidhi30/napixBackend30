
const jwt = require('jsonwebtoken');
const AssignedTrucks = require('../Models/AssignedTrucks');
const Route = require('../Models/Route');
const { JWT_SECRET } = process.env;

// Track active rooms
const activeRooms = {};

const authenticate = (socket, next) => {
    const token = socket.handshake.headers['authorization']?.replace('Bearer ', '');
    if (!token) return next(new Error('No token provided. Authentication required.'));
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Invalid token. Authentication failed.'));
        socket.user = decoded;
        next();
    });
};

const handleConnection = (io) => (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', async (vehicleNumber) => {
        // console.log('Join Room event triggered');
        if (!vehicleNumber) {
            return socket.emit('message', 'Invalid vehicle number');
        }

        // Check if the vehicle is already in a room
        if (activeRooms[vehicleNumber]) {
            return socket.emit('message', `Vehicle ${vehicleNumber} is already connected to another driver.`);
        }

        try {
            // Validate vehicle assignment
            const assignedTruck = await AssignedTrucks.findOne({
                vehicleNumber,
                driverEmail: socket.user.email
            });

            if (!assignedTruck) {
                return socket.emit('message', 'You are not assigned to this vehicle');
            }

            // Create and join room
            const roomName = `${vehicleNumber}-${socket.user.email}`;
            socket.join(roomName);
            activeRooms[vehicleNumber] = socket.user.email; // Mark the vehicle as occupied
            const updateRoute = await  Route.findOne({vehicleNumber});
            console.log(updateRoute)
            updateRoute.status='driving Safely'

            await updateRoute.save();
            console.log(updateRoute)
            // console.log(`User successfully joined room: ${roomName}`);
            socket.emit('message', `Successfully joined the room for vehicle ${vehicleNumber}`);
        } catch (error) {
            console.error(`[ERROR] [Vehicle: ${vehicleNumber}] [Driver: ${socket.user.email}] ${error.message}`);
            socket.emit('message', 'An error occurred while joining the room');
        }
    });

    socket.on('endRoute', async (vehicleNumber) => {
        try {
            const roomName = `${vehicleNumber}-${socket.user.email}`;
            if (!socket.rooms.has(roomName)) {
                return socket.emit('message', 'You are not in the room for this vehicle.');
            }

            socket.leave(roomName);
            delete activeRooms[vehicleNumber]; // Release the room

            const latestRoute = await Route.findOne({
                vehicleNumber,
                status: { $ne: 'ended' }
            }).sort({ assignmentTime: -1 });

            if (latestRoute) {
                latestRoute.status = 'ended'; // Mark route as ended
                await latestRoute.save();
                socket.emit('message', `Route has ended for vehicle ${vehicleNumber}.`);
                notifyLogisticsHeads(io, vehicleNumber, `Route has ended for vehicle ${vehicleNumber}.`);
            } else {
                socket.emit('message', `No active route found for vehicle ${vehicleNumber} that is not ended.`);
            }

            // Instead of using global state, consider updating the DB or an in-memory cache.
            // global.connectedTrucks = global.connectedTrucks.filter(truck => truck !== vehicleNumber);
        } catch (error) {
            console.error(`[ERROR] [Vehicle: ${vehicleNumber}] [Driver: ${socket.user.email}] ${error.message}`);
            socket.emit('message', 'An error occurred while ending the route.');
        }
    });
   
    

    // socket.on('disconnect', () => {
    //     console.log(`User disconnected: ${socket.id}`);

    //     // Check if user was assigned to a vehicle and clean up activeRooms
    //     Object.keys(activeRooms).forEach(vehicleNumber => {
    //         if (activeRooms[vehicleNumber] === socket.user.email) {
    //             delete activeRooms[vehicleNumber];
    //             console.log(`Vehicle ${vehicleNumber} released.`);
    //         }
    //     });
    // });
    socket.on('sendMessage', async (vehicleNumber, message) => {
        try {
            const roomName = `${vehicleNumber}-${socket.user.email}`;
            if (!socket.rooms.has(roomName)) {
                return socket.emit('message', 'You are not allowed to send messages from this room.');
            }
    
            const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
            if (!latestRoute) {
                return socket.emit('message', 'No active route found for this vehicle.');
            }
    
            // Add the new message to the route
            latestRoute.messages.push({ message, timestamp: new Date() });
            await latestRoute.save();
    
            // Emit the message to all clients in the room
            io.to(roomName).emit('messageUpdate', { vehicleNumber, message, timestamp: new Date() });
    
            // Notify logistics heads
            notifyLogisticsHeads(io, vehicleNumber, message);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('message', 'An error occurred while sending the message.');
        }
    });
    

    
};

const notifyLogisticsHeads = (io, vehicleNumber, message) => {
    // Keep track of logistics head sockets and emit only to them.
    io.sockets.sockets.forEach(client => {
        if (client.user && client.user.role === 'logistics_head') {
            client.emit('statusUpdate', { vehicleNumber, message });
        }
    });
};

module.exports = { authenticate, handleConnection };
