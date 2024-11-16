const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    vehicleNumber: { type: String, unique: true, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'LogisticsHead', required: true },
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
