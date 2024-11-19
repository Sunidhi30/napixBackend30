// const jwt = require('jsonwebtoken');
// const AssignedTrucks = require('../Models/AssignedTrucks');
// const Route = require('../Models/Route');
// const { JWT_SECRET } = process.env;
// const mongoose = require("mongoose");

// // Helper function to check if a truck is already connected
// const isTruckConnected = (vehicleNumber) => global.connectedTrucks.includes(vehicleNumber);

// const authenticate = (socket, next) => {
//     const token = socket.handshake.headers['authorization']?.replace('Bearer ', '');
//     console.log('Received token:', token);
//     if (!token) return next(new Error('Authentication error'));

//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) return next(new Error('Authentication error'));
//         socket.user = decoded;
//         next();
//     });
// };

// const handleConnection = (io) => (socket) => {
//     console.log('New client connected:', socket.id);

//     socket.on('getConnectedTrucks', () => {
//         if (socket.user.role !== 'logistics_head') {
//             return socket.emit('message', 'Unauthorized access');
//         }
//         socket.emit('connectedTrucks', global.connectedTrucks);
//     });

//     socket.on('joinRoom', async (vehicleNumber) => {
//         try {
//             if (socket.user.role !== 'driver') {
//                 return socket.emit('message', 'Invalid role');
//             }
    
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (socket.rooms.has(roomName)) {
//                 return socket.emit('message', `You are already connected to vehicle: ${vehicleNumber}`);
//             }
    
//             const assignedTruck = await AssignedTrucks.findOne({ vehicleNumber, driverEmail: socket.user.email });
//             if (!assignedTruck) {
//                 return socket.emit('message', 'You are not assigned to this vehicle. Access denied.');
//             }
    
//             const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
//             if (latestRoute) {
//                 latestRoute.status = 'driving safely'; // Update status to "driving safely"
//                 await latestRoute.save();
//                 io.to(roomName).emit('statusUpdate', latestRoute.status); // Emit status update
//             } else {
//                 socket.emit('message', 'No active route found for this vehicle.');
//                 return;
//             }
    
//             socket.join(roomName);
//             console.log(`Driver ${socket.user.email} joined room: ${roomName}`);
//             socket.emit('message', `Successfully joined the room for vehicle: ${vehicleNumber}`);
    
//         } catch (error) {
//             console.error('Error joining room:', error);
//             socket.emit('message', 'An error occurred while trying to join the room.');
//         }
//     });
    
    
//     socket.on('sendMessage', async (vehicleNumber, message) => {
//         try {
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (!socket.rooms.has(roomName)) {
//                 return socket.emit('message', 'You are not allowed to send messages from this room.');
//             }

//             const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
//             if (!latestRoute) {
//                 return socket.emit('message', 'No active route found for this vehicle.');
//             }

//             latestRoute.messages.push({ message, timestamp: new Date() });

//             // Update status based on the message
//             if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
//                 latestRoute.status = 'active alerts';
//             } else if (latestRoute.status !== 'driving safely') {
//                 latestRoute.status = 'driving safely';
//             }

//             await latestRoute.save();

//             // Emit status update
//             io.to(roomName).emit('statusUpdate', latestRoute.status);
//             io.to(roomName).emit('message', message);
//             notifyLogisticsHeads(io, vehicleNumber, message);
//         } catch (error) {
//             console.error('Error handling sendMessage:', error);
//             socket.emit('message', 'An error occurred while sending the message.');
//         }
//     });
    
    
//     socket.on('getMessages', async (vehicleNumber) => {
//         try {
//             const route = await Route.findOne({ vehicleNumber }).sort({ assignmentTime: -1 });
//             const messages = route?.messages || [];
//             socket.emit('chatMessages', messages);
//         } catch (error) {
//             console.error('Error retrieving messages:', error);
//             socket.emit('message', 'An error occurred while retrieving messages.');
//         }
//     });

//     socket.on('endRoute', async (vehicleNumber) => {
//         try {
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (!socket.rooms.has(roomName)) {
//                 return socket.emit('message', 'You are not in the room for this vehicle.');
//             }
    
//             console.log(`Ending route for vehicle: ${vehicleNumber}`);
//             socket.leave(roomName);
    
//             const truckResult = await AssignedTrucks.deleteOne({ vehicleNumber });
//             if (truckResult.deletedCount === 0) {
//                 console.log(`Vehicle ${vehicleNumber} was not found in the assigned list.`);
//                 return socket.emit('message', `Vehicle ${vehicleNumber} was not found in the assigned list.`);
//             }
    
//             const latestRoute = await Route.findOne({
//                 vehicleNumber,
//                 status: { $ne: 'ended' }
//             }).sort({ assignmentTime: -1 });
    
//             if (latestRoute) {
//                 latestRoute.status = 'ended';  // Update status to 'ended'
//                 await latestRoute.save();
//                 console.log(`Route for vehicle ${vehicleNumber} has been marked as ended.`);
//                 io.to(roomName).emit('message', `Route has ended for vehicle ${vehicleNumber}. The vehicle has left the room.`);
//                 io.to(roomName).emit('statusUpdate', latestRoute.status); // Emit final status update
//             } else {
//                 console.log(`No active route found for vehicle ${vehicleNumber} that is not ended.`);
//                 return socket.emit('message', `No active route found for vehicle ${vehicleNumber} that is not ended.`);
//             }
    
//             global.connectedTrucks = global.connectedTrucks.filter(truck => truck !== vehicleNumber);
//         } catch (error) {
//             console.error('Error ending route:', error);
//             socket.emit('message', 'An error occurred while ending the route.');
//         }
//     });
    
    
//     socket.on('disconnect', () => {
//         global.connectedTrucks.forEach(truckNumber => {
//             if (socket.rooms.has(truckNumber)) {
//                 global.connectedTrucks = global.connectedTrucks.filter(truck => truck !== truckNumber);
//             }
//         });
//         console.log(`Client disconnected: ${socket.id}`);
//     });
//     setInterval(async () => {
//         // Find and update routes from 'scheduled' to 'driving safely'
//         const scheduledRoutes = await Route.find({ status: 'scheduled' });
//         for (const route of scheduledRoutes) {
//             route.status = 'driving safely';
//             await route.save();
//             io.to(`${route.vehicleNumber}-${route.driverEmail}`).emit('statusUpdate', route.status);
//         }

//         // Find and update routes from 'driving safely' to 'active alerts'
//         const drivingSafelyRoutes = await Route.find({ status: 'driving safely' });
//         for (const route of drivingSafelyRoutes) {
//             // You might want to put a condition here to check when to change the status
//             route.status = 'active alerts';
//             await route.save();
//             io.to(`${route.vehicleNumber}-${route.driverEmail}`).emit('statusUpdate', route.status);
//         }
//     }, 60000); //
// };

// const notifyLogisticsHeads = (io, vehicleNumber, message) => {
//     io.sockets.sockets.forEach(client => {
//         if (client.user && client.user.role === 'logistics_head') {
//             client.emit('message', `New message for truck ${vehicleNumber}: ${message}`);
//         }
//     });
// };

// module.exports = { authenticate, handleConnection };
// //origina


//// second latest code 
// const jwt = require('jsonwebtoken');
// const AssignedTrucks = require('../Models/AssignedTrucks');
// const Route = require('../Models/Route');
// const { JWT_SECRET } = process.env;
// const mongoose = require("mongoose");

// // Helper function to check if a truck is already connected
// const isTruckConnected = (vehicleNumber) => global.connectedTrucks.includes(vehicleNumber);

// const authenticate = (socket, next) => {
//     const token = socket.handshake.headers['authorization']?.replace('Bearer ', '');
//     // console.log('Received token:', token);
//     if (!token) return next(new Error('Authentication error'));

//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) return next(new Error('Authentication error'));
//         socket.user = decoded;
//         next();
//     });
// };

// const handleConnection = (io) => (socket) => {
//     console.log('New client connected:', socket.id);

//     socket.on('getConnectedTrucks', () => {
//         if (socket.user.role !== 'logistics_head') {
//             return socket.emit('message', 'Unauthorized access');
//         }
//         socket.emit('connectedTrucks', global.connectedTrucks);
//     });

//     // socket.on('joinRoom', async (vehicleNumber) => {
//     //     console.log("bhai hoja abh")
//     //     try {
//     //         console.log("bhai hoja abh")

//     //         if (socket.user.role !== 'driver') {
//     //             return socket.emit('message', 'Invalid role');
//     //         }

//     //         const roomName = `${vehicleNumber}-${socket.user.email}`;
//     //         if (socket.rooms.has(roomName)) {
//     //             return socket.emit('message', `You are already connected to vehicle: ${vehicleNumber}`);

//     //         }

//     //         const assignedTruck = await AssignedTrucks.findOne({ vehicleNumber, driverEmail: socket.user.email });
//     //         console.log("this is trck assigned")
//     //         console.log(assignedTruck);
//     //         if (!assignedTruck) {
//     //             return socket.emit('message', 'You are not assigned to this vehicle. Access denied.');
//     //         }

//     //         const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
//     //         if (latestRoute) {
//     //             latestRoute.status = 'driving safely'; // Update status to "driving safely"
//     //             await latestRoute.save();
                
//     //             socket.join(roomName);
//     //             socket.emit('message', `Successfully joined the room for vehicle: ${vehicleNumber}`);
                
//     //             // Inform logistics heads about the status update
//     //             notifyLogisticsHeads(io, vehicleNumber, `Status updated to driving safely for vehicle ${vehicleNumber}.`);
//     //         } else {
//     //             socket.emit('message', 'No active route found for this vehicle.');
//     //             return;
//     //         }
            
//     //         // if (latestRoute) {
//     //         //     // latestRoute.status = 'driving safely'; // Update status to "driving safely"
//     //         //     await latestRoute.save();
                
//     //         // socket.join(roomName);
//     //         // // console.log(`Driver ${socket.user.email} joined room: ${roomName}`);
//     //         // socket.emit('message', `Successfully joined the room for vehicle: ${vehicleNumber}`);
//     //         //     // Removed emit logic here
//     //         // } else {
//     //         //     socket.emit('message', 'No active route found for this vehicle.');
//     //         //     return;
//     //         // }

//     //         // socket.join(roomName);
//     //         // // console.log(`Driver ${socket.user.email} joined room: ${roomName}`);
//     //         // socket.emit('message', `Successfully joined the room for vehicle: ${vehicleNumber}`);

//     //     } catch (error) {
//     //         // console.error('Error joining room:', error);
//     //         socket.emit('message', 'An error occurred while trying to join the room.');
//     //     }
//     // });
//     socket.on('joinRoom', async (vehicleNumber) => {
//         console.log('Join Room event triggered');
//         console.log(`Received Vehicle Number: ${vehicleNumber}`);

//         if (!vehicleNumber) {
//             console.log('Invalid vehicle number provided');
//             socket.emit('message', 'Invalid vehicle number');
//             return;
//         }

//         try {
//             // Check vehicle assignment (refactored from your example)
//             const assignedTruck = await AssignedTrucks.findOne({ vehicleNumber, driverEmail: socket.user.email });

//             if (!assignedTruck) {
//                 console.log(`User not assigned to vehicle: ${vehicleNumber}`);
//                 socket.emit('message', 'You are not assigned to this vehicle');
//                 return;
//             }

//             // Join room logic
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (!socket.rooms.has(roomName)) {
//                 socket.join(roomName);
//                 console.log(`User successfully joined room: ${roomName}`);
//                 socket.emit('message', 'Successfully joined the room');
//             } else {
//                 console.log(`User already in room: ${roomName}`);
//                 socket.emit('message', 'You are already in this room');
//             }
//         } catch (error) {
//             console.error('Error during joinRoom:', error);
//             socket.emit('message', 'An error occurred while joining the room');
//         }
//     });

//     socket.on('sendMessage', async (vehicleNumber, message) => {
//         const roomName = `${vehicleNumber}-${socket.user.email}`;
//         if (!socket.rooms.has(roomName)) {
//             return socket.emit('message', 'You are not in the room for this vehicle.');
//         }
    
//         try {
//             const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
//             if (!latestRoute) {
//                 return socket.emit('message', 'No active route found for this vehicle.');
//             }
    
//             latestRoute.messages.push({ message, timestamp: new Date() });
    
//             if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
//                 latestRoute.status = 'active alerts';
//             } else if (latestRoute.status !== 'driving safely') {
//                 latestRoute.status = 'driving safely';
//             }
    
//             await latestRoute.save();
//             notifyLogisticsHeads(io, vehicleNumber, `New message: ${message}`);
//         } catch (error) {
//             socket.emit('message', 'An error occurred while sending the message.');
//         }
//     });
    
//     // socket.on('sendMessage', async (vehicleNumber, message) => {
//     //     try {
//     //         const roomName = `${vehicleNumber}-${socket.user.email}`;
//     //         if (!socket.rooms.has(roomName)) {
//     //             return socket.emit('message', 'You are not allowed to send messages from this room.');
//     //         }

//     //         const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
//     //         if (!latestRoute) {
//     //             return socket.emit('message', 'No active route found for this vehicle.');
//     //         }

//     //         latestRoute.messages.push({ message, timestamp: new Date() });

//     //         // Update status based on the message
//     //         // if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
//     //         //     latestRoute.status = 'active alerts';
//     //         // } else if (latestRoute.status !== 'driving safely') {
//     //         //     latestRoute.status = 'active alerts';
//     //         // }
//     //         if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
//     //             latestRoute.status = 'active alerts'; // Update to "active alerts" if message indicates an alert
//     //         } else if (latestRoute.status !== 'driving safely') {
//     //             latestRoute.status = 'driving safely'; // Default to "driving safely"
//     //         }
//     //         await latestRoute.save();
            
//     //         // Notify logistics heads about the updated status
//     //         notifyLogisticsHeads(io, vehicleNumber, `Status updated for vehicle ${vehicleNumber}: ${latestRoute.status}`);
            

//     //         await latestRoute.save();

//     //         // Removed emit logic for status update here
//     //         socket.emit("message", message);
//     //         notifyLogisticsHeads(io, vehicleNumber, message);
//     //     } catch (error) {
//     //         // console.error('Error handling sendMessage:', error);
//     //         socket.emit('message', 'An error occurred while sending the message.');
//     //     }
//     // });

//     socket.on('getMessages', async (vehicleNumber) => {
//         try {
//             const route = await Route.findOne({ vehicleNumber }).sort({ assignmentTime: -1 });
//             const messages = route?.messages || [];
//             socket.emit('chatMessages', messages);
//         } catch (error) {
//             // console.error('Error retrieving messages:', error);
//             socket.emit('message', 'An error occurred while retrieving messages.');
//         }
//     });

//     socket.on('endRoute', async (vehicleNumber) => {
//         try {
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (!socket.rooms.has(roomName)) {
//                 return socket.emit('message', 'You are not in the room for this vehicle.');
//             }

//             // console.log(`Ending route for vehicle: ${vehicleNumber}`);
//             socket.leave(roomName);

//             const truckResult = await AssignedTrucks.deleteOne({ vehicleNumber });
//             if (truckResult.deletedCount === 0) {
//                 // console.log(`Vehicle ${vehicleNumber} was not found in the assigned list.`);
//                 return socket.emit('message', `Vehicle ${vehicleNumber} was not found in the assigned list.`);
//             }

//             const latestRoute = await Route.findOne({
//                 vehicleNumber,
//                 status: { $ne: 'ended' }
//             }).sort({ assignmentTime: -1 });

//             if (latestRoute) {
//                 latestRoute.status = 'ended';  // Update status to 'ended'
//                 await latestRoute.save();
//                 // console.log(`Route for vehicle ${vehicleNumber} has been marked as ended.`);
//                 // Removed emit logic for status update here
//                 socket.emit('message', `Route has ended for vehicle ${vehicleNumber}. The vehicle has left the room.`);
//                 notifyLogisticsHeads(io, vehicleNumber, `Route has ended for vehicle ${vehicleNumber}.`);

//             } else {
//                 // console.log(`No active route found for vehicle ${vehicleNumber} that is not ended.`);
//                 return socket.emit('message', `No active route found for vehicle ${vehicleNumber} that is not ended.`);
//             }

//             global.connectedTrucks = global.connectedTrucks.filter(truck => truck !== vehicleNumber);
//         } catch (error) {
//             // console.error('Error ending route:', error);
//             socket.emit('message', 'An error occurred while ending the route.');
//         }
//     });
   

//     socket.on('disconnect', () => {
//         console.log(`User disconnected: ${socket.id}`);

//         global.connectedTrucks.forEach(truckNumber => {
//             if (socket.rooms.has(truckNumber)) {
//                 global.connectedTrucks = global.connectedTrucks.filter(truck => truck !== truckNumber);
//             }
//         });
//         // console.log(`Client disconnected: ${socket.id}`);
//     });
// };

// // const notifyLogisticsHeads = (io, vehicleNumber, message) => {
// //     io.sockets.sockets.forEach(client => {
// //         if (client.user && client.user.role === 'logistics_head') {
// //             client.emit('message', `New message for truck ${vehicleNumber}: ${message}`);
// //         }
// //     });
// // };

// const notifyLogisticsHeads = (io, vehicleNumber, message) => {
//     io.sockets.sockets.forEach(client => {
//         if (client.user && client.user.role === 'logistics_head') {
//             client.emit('statusUpdate', { vehicleNumber, message });
//         }
//     });
// };

// module.exports = { authenticate, handleConnection };

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
        console.log('Join Room event triggered');
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
            console.log(`User successfully joined room: ${roomName}`);
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
    socket.on('alertMessage', async ({ vehicleNumber, alert }) => {
        try {
            const roomName = `${vehicleNumber}-${socket.user.email}`;
            if (!socket.rooms.has(roomName)) {
                return socket.emit('message', 'You are not allowed to send messages from this room.');
            }

            const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
            if (!latestRoute) {
                return socket.emit('message', 'No active route found for this vehicle.');
            }

            latestRoute.messages.push({ message, timestamp: new Date() });
       
           
    
            socket.emit('message', alert);
    
            // Notify logistics heads about the alert
                                notifyLogisticsHeads(io, vehicleNumber, message);

        } catch (error) {
              console.error('Error handling sendMessage:', error);
                    socket.emit('message', 'An error occurred while sending the message.');
        }
    });
    // socket.on('sendMessage', async (vehicleNumber, message) => {
    //             try {
    //                 const roomName = `${vehicleNumber}-${socket.user.email}`;
    //                 if (!socket.rooms.has(roomName)) {
    //                     return socket.emit('message', 'You are not allowed to send messages from this room.');
    //                 }
        
    //                 const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
    //                 if (!latestRoute) {
    //                     return socket.emit('message', 'No active route found for this vehicle.');
    //                 }
        
    //                 latestRoute.messages.push({ message, timestamp: new Date() });
        
    //                 // Update status based on the message
    //                 // if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
    //                 //     latestRoute.status = 'active alerts';
    //                 // } else if (latestRoute.status !== 'driving safely') {
    //                 //     latestRoute.status = 'active alerts';
    //                 // }
    //                 if (latestRoute.status !== 'active alerts' && message.startsWith('D')) {
    //                     latestRoute.status = 'active alerts'; // Update to "active alerts" if message indicates an alert
    //                 } else if (latestRoute.status !== 'driving safely') {
    //                     latestRoute.status = 'driving safely'; // Default to "driving safely"
    //                 }
    //                 console.log("this is updated ", latestRoute)
    //                 await latestRoute.save();
                    
    //                 // Notify logistics heads about the updated status
    //                 notifyLogisticsHeads(io, vehicleNumber, `Status updated for vehicle ${vehicleNumber}: ${latestRoute.status}`);
                    
        
    //                 await latestRoute.save();
        
    //                 // Removed emit logic for status update here
    //                 io.to(routeID).emit('message', message);

    //                 // socket.emit("message", message);
    //                 notifyLogisticsHeads(io, vehicleNumber, message);
    //             } catch (error) {
    //                 // console.error('Error handling sendMessage:', error);
    //                 socket.emit('message', 'An error occurred while sending the message.');
    //             }
    //         });
    // this was working 
    // socket.on('sendMessage', async (vehicleNumber, message) => {
    //     try {
    //         const roomName = `${vehicleNumber}-${socket.user.email}`;
    //         if (!socket.rooms.has(roomName)) {
    //             return socket.emit('message', 'You are not allowed to send messages from this room.');
    //         }
    
    //         const latestRoute = await Route.findOne({ vehicleNumber, status: { $ne: 'ended' } }).sort({ assignmentTime: -1 });
    //         if (!latestRoute) {
    //             return socket.emit('message', 'No active route found for this vehicle.');
    //         }
    
    //         latestRoute.messages.push({ message, timestamp: new Date() });
    //         await latestRoute.save();
    
    //         io.to(roomName).emit('message', message);  // Emit the message to the room
    //         notifyLogisticsHeads(io, vehicleNumber, message);
    //     } catch (error) {
    //         socket.emit('message', 'An error occurred while sending the message.');
    //     }
    // });
    

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
    
//     socket.on('alertMessage', async ({ vehicleNumber, alert }) => {
//         try {
//             if (!vehicleNumber || !alert) {
//                 return socket.emit('message', 'Invalid data. Vehicle number and alert message are required.');
//             }
    
//             const roomName = `${vehicleNumber}-${socket.user.email}`;
//             if (!socket.rooms.has(roomName)) {
//                 return socket.emit('message', 'You are not in the room for this vehicle.');
//             }
    
//             const currentRoute = await Route.findOne({
//                 vehicleNumber,
//                 status: { $ne: 'ended' }
//             }).sort({ assignmentTime: -1 });
    
//             if (!currentRoute) {
//                 return socket.emit('message', `No active route found for vehicle ${vehicleNumber}.`);
//             }
    
//             // Update the status based on the alert
//             currentRoute.status = alert === 'Fatigue' ? 'active alerts'  : 'driving safely';
//             await currentRoute.save();
    
//             console.log(`[ALERT] Vehicle: ${vehicleNumber}, Alert: ${alert}`);
//             socket.emit('message', `Route status updated to "${currentRoute.status}" for vehicle ${vehicleNumber}.`);
    
//             // Notify logistics heads about the alert
//             notifyLogisticsHeads(io, vehicleNumber, `Route status updated to "${currentRoute.status}" due to alert: ${alert}`);
//         } catch (error) {
//             console.error(`[ERROR] [Vehicle: ${vehicleNumber}] [Driver: ${socket.user.email}] ${error.message}`);
//             socket.emit('message', 'An error occurred while processing the alert.');
//         }
//     });
    
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
