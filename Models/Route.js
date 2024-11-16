const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    departureDetails: {
        departureTime: {
            type: Date,
            required: true,
        },
    },
    status: {
        type: String,
        default: 'scheduled', // Default status when the route is created
        // enum: ['scheduled', 'driving safely', 'active alerts', 'ended'], // Enum for possible statuses
    },
    // Embedding messages inside the Route schema
    messages: [{
        message: { 
            type: String, 
            required: true 
        },
        timestamp: { 
            type: Date, 
            default: Date.now 
        },
        isRead: { type: Boolean, default: false }
    }],
    logisticsHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Route', RouteSchema);
