const mongoose = require('mongoose');
// Schema for keeping track of all assigned trucks
const AssignedTrucksSchema = new mongoose.Schema({
    vehicleNumber: { type: String, required: true }, 
    driverEmail: { type: String, required: true }
});

module.exports = mongoose.model('AssignedTrucks', AssignedTrucksSchema);