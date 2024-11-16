// const express = require('express');
// const mongoose = require("mongoose")
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const path = require('path');
// const connectDB = require('./Config/db');
// const { JWT_SECRET } = process.env;
// const userRoutes = require('./Routes/Userroutes');
// const driverRoutes = require('./Routes/DriverRoute');
// const vehicleRoutes = require('./Routes/VehicleRoute');
// const routeRoutes = require('./Routes/routeRoute');
// const authRoutes = require('./Routes/authroutes');
// const socketEvents = require('./Utils/Socketmiddleware');
// const upload = require('./Config/uploadConfig');

// require('dotenv').config();
// const bodyParser = require('body-parser');

// const app = express();
// const server = http.createServer(app);
// // Socket.IO configuration with CORS support
// const io = socketIo(server, {
//     cors: {
//       origin: ['http://localhost:5501', 'https://napixbackend-2.onrender.com'],
//       methods: ['GET', 'POST'],
//       allowedHeaders: ['Content-Type', 'Authorization']
//     }
//   });

// // Serve static files (uploaded images)
// app.use('/uploads', express.static('uploads'));

// // Connect to the database
// connectDB();

// // Middleware
// app.use(cors({
//   origin: ['http://localhost:5501', 'https://napixbackend-2.onrender.com'],
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());

// app.use(express.static(path.join(__dirname, 'public')));

// app.use(bodyParser.json({ limit: '10mb' })); // Increase to 10MB or whatever size is suitable
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// // Test API
// app.get('/', (req, res) => {
//   res.send('Hello, Pandeyjii!');
// });

// // Routes
// app.use('/api/users', userRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/routes', routeRoutes);
// app.use('/api/auth', authRoutes);
// //upload image 
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// //jwt
// // Serve static files
// app.get('/head', (req, res) => res.sendFile(path.join(__dirname, 'public', 'head.html')));
// app.get('/driver', (req, res) => res.sendFile(path.join(__dirname, 'public', 'driver.html')));
// app.get('/logisticshead', (req, res) => res.sendFile(path.join(__dirname, 'public', 'logisticshead.html')));

// // Initialize global variables
// global.connectedTrucks = [];

// // Socket.IO configuration
// io.use(socketEvents.authenticate);
// io.on('connection', socketEvents.handleConnection(io));

// const PORT = process.env.PORT || 5001; // Use default port 5001 if not specified
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const mongoose = require("mongoose");
const http = require('http');
const socketIo = require('socket.io');
// const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./Config/db');
const { JWT_SECRET } = process.env;
const userRoutes = require('./Routes/Userroutes');
const driverRoutes = require('./Routes/DriverRoute');
const vehicleRoutes = require('./Routes/VehicleRoute');
const routeRoutes = require('./Routes/routeRoute');
const authRoutes = require('./Routes/authroutes');
const socketEvents = require('./Utils/Socketmiddleware');
const upload = require('./Config/uploadConfig');
const cloudinary = require('cloudinary').v2; // Import Cloudinary

require('dotenv').config();
const bodyParser = require('body-parser');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
// Socket.IO configuration with CORS support
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5501', 'https://napixbackend-2.onrender.com'],
        methods: ['GET', 'POST','PUT','PATCH','DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'hbs');


// Connect to the database
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:5501', 'https://napixbackend-2.onrender.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json({ limit: '10mb' })); // Increase to 10MB or whatever size is suitable
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Test API
app.get('/', (req, res) => {
    res.send('Hello, Pandeyjii!');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);
//upload image 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//jwt
// Serve static files
app.get('/head', (req, res) => res.sendFile(path.join(__dirname, 'public', 'head.html')));
app.get('/driver', (req, res) => res.sendFile(path.join(__dirname, 'public', 'driver.html')));
app.get('/logisticshead', (req, res) => res.sendFile(path.join(__dirname, 'public', 'logisticshead.html')));

// Initialize global variables
global.connectedTrucks = [];

// Socket.IO configuration
io.use(socketEvents.authenticate);
io.on('connection', socketEvents.handleConnection(io));

const PORT = process.env.PORT || 5001; // Use default port 5001 if not specified
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
