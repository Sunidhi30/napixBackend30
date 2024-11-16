const express = require('express');
const Vehicle = require('../Models/Vehicle');
const Route = require('../Models/Route');
const {authenticateLogisticsHead} = require('../Utils/authmiddleware');
const router = express.Router();
const User =  require('../Models/User')

// Add Vehicle
router.post('/add', authenticateLogisticsHead, async (req, res) => {
    // console.log('Vehicle route hit');
    const { vehicleNumber } = req.body;
    try {
        const newVehicle = new Vehicle({ vehicleNumber, assignedBy: req.user._id }); // Assign vehicle to the logged-in user
        await newVehicle.save();

        res.status(201).json({ message: 'Vehicle added' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE vehicle endpoint
router.delete('/delete/:vehicleNumber', authenticateLogisticsHead, async (req, res) => {
    const { vehicleNumber } = req.params;

    try {
        // Ensure only logistics heads can delete vehicles
        if (req.user.role !== 'logistics_head') {
            return res.status(403).json({ message: 'Only logistics heads can delete vehicles' });
        }

        // Find and delete the vehicle by vehicleNumber
        const deletedVehicle = await Vehicle.findOneAndDelete({ vehicleNumber });

        if (!deletedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Optionally, clean up any related data, such as routes assigned to this vehicle
        await Route.deleteMany({ vehicleNumber });

        // Respond with success message
        res.status(200).json({ message: 'Vehicle and associated routes deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Failed to delete vehicle', details: err.message });
    }
});


// Route to get all vehicles
router.get('/getvehicles', authenticateLogisticsHead, async (req, res) => {
    // console.log("get vehicle route hit");
    try {
        // Ensure the user is a logistics head
        if (req.user.role !== 'logistics_head') {
            return res.status(403).json({ error: 'Access denied: Only logistics heads can view vehicles.' });
        }

        // Retrieve vehicles assigned to the logistics head
        const vehicles = await Vehicle.find({ assignedBy: req.user._id }); 
        res.status(200).json(vehicles);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


router.get('/messages/:vehicleNumber', async (req, res) => {
    const { vehicleNumber } = req.params;
    try {
        // Find the route document associated with the given vehicleNumber
        const route = await Route.findOne({ vehicleNumber });

        if (route) {
            // Return the messages from the route document
            res.status(200).json(route.messages);
        } else {
            // If no route found, return an empty array or a suitable message
            res.status(404).json({ message: 'No route found for this vehicle.' });
        }
    } catch (error) {
        // console.error('Error retrieving messages:', error);
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;
