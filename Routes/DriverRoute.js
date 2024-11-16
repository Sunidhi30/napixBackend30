const express = require('express');
const bcrypt = require('bcryptjs');
const Driver = require('../Models/Driver');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../Utils/email');
const upload = require('../Config/uploadConfig');
const router = express.Router();
const { generatePassword, hashPassword } = require('../Utils/password');
const {authenticateLogisticsHead} = require('../Utils/authmiddleware');
const { authenticateDriver } = require('../Utils/authmiddleware');

// Add Driver

// router.post('/add-driver', upload.single('profileImage'),[
//     body('email').isEmail().withMessage('Invalid email address'), // Validate email
//     body('mobileNumber').isNumeric().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'), // Validate mobile number
//     body('name').notEmpty().withMessage('Name is required') // Validate name
// ],  authenticateLogisticsHead, async (req, res) => {
//     const { name, mobileNumber, email } = req.body;

//     try {
//         // Generate a passwor d and hash it
//         const password = generatePassword();
//         const hashedPassword = await hashPassword(password);

//         // Create a new driver instance
//         const newDriver = new Driver({
//             name,
//             mobileNumber,
//             email,
//             password: hashedPassword,
//             assignedBy: req.user._id,
//             profileImage: req.file ? req.file.path : null // Set the image if uploaded
//         });

//         // Attempt to send an email with the credentials
//         try {
//             await sendEmail(email, 'Your Napix Login Credentials', `Your password is: ${password}`);
//             console.log('Email sent successfully');

//             // Save the driver to the database only if the email is sent successfully
//             await newDriver.save();

//             // Respond to the client
//             return res.status(201).json({ message: 'Driver added' });
//         } catch (emailError) {
//             console.error('Failed to send email:', emailError.message);
//             // Respond with an error message indicating the email sending failure
//             return res.status(500).json({ error: 'Driver not added. Failed to send email.' });
//         }

//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });



router.post('/add-driver', upload.single('profileImage'), [
    body('email').isEmail().withMessage('Invalid email address'), // Validate email
    body('mobileNumber').isNumeric().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'), // Validate mobile number
    body('name').notEmpty().withMessage('Name is required') // Validate name
], authenticateLogisticsHead, async (req, res) => {
    const { name, mobileNumber, email } = req.body;

    try {
        // Check if the email already exists in the database
        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Generate a password and hash it
        const password = generatePassword();
        const hashedPassword = await hashPassword(password);

        // Create a new driver instance
        const newDriver = new Driver({
            name,
            mobileNumber,
            email,
            password: hashedPassword,
            assignedBy: req.user._id,
            profileImage: req.file ? req.file.path : null // Set the image if uploaded
        });

        // Attempt to send an email with the credentials
        try {
            await sendEmail(email, 'Your Napix Login Credentials', `Your password is: ${password}`);
            console.log('Email sent successfully');

            // Save the driver to the database only if the email is sent successfully
            await newDriver.save();

            // Respond to the client
            return res.status(201).json({ message: 'Driver added' });
        } catch (emailError) {
            console.error('Failed to send email:', emailError.message);
            // Respond with an error message indicating the email sending failure
            return res.status(500).json({ error: 'Driver not added. Failed to send email.' });
        }

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


router.delete('/delete-driver/:id', authenticateLogisticsHead, async (req, res) => {
    const { id } = req.params;

    try {
        // Find the driver by _id and delete
        const deletedDriver = await Driver.findOneAndDelete({ _id: id });

        if (!deletedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Optionally, you can log the action or notify an admin here

        // Respond to the client
        res.status(200).json({ message: 'Driver deleted successfully' });

    } catch (err) {
        // console.error(err); // Log the error for debugging
        res.status(500).json({ error: 'Failed to delete driver' });
    }
});


router.put('/update-profile', authenticateDriver, async (req, res) => {
    // console.log("Updating driver profile...");
    // console.log(req.body)
    const { name, mobileNumber, email, profileImage } = req.body;

    try {
        // Find the driver by their email
        const driver = await Driver.findOne({ email });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Update profile details
        if (name) driver.name = name;
        if (mobileNumber) driver.mobileNumber = mobileNumber;

        // Update profile image if a new URL is provided
        if (profileImage) {
            driver.profileImage = profileImage;
        }
        // update fields if provided 
        driver.name = name || driver.name;
        driver.mobileNumber = mobileNumber || driver.mobileNumber;

        driver.email = email|| driver.email;
        driver.profileImage = req.body.image || driver.profileImage
        // console.log("this is driver image")
        // console.log(driver.profileImage)
        // console.log("hey this is updated  driver image")
        if(req.body.image){
            driver.image = req.body.image;
        }
        // console.log(req.body.image)
        // Save the updated driver
        const updatedDriver = await driver.save();

        // Respond with the updated driver data
        res.status(200).json({
            message: 'Profile updated successfully',
            driver: {
                id: updatedDriver._id,
                name: updatedDriver.name,
                mobileNumber: updatedDriver.mobileNumber,
                email: updatedDriver.email,
                profileImage: updatedDriver.profileImage,
            }
        });
    } catch (err) {
        // console.error("Update Profile Error: ", err);
        res.status(500).json({ error: 'An error occurred while updating the profile.' });
    }
});


// router.put('/update-profile', authenticateDriver, upload.single('image'), async (req, res) => {
//     console.log("this is driver profile ")
//     console.log(req.body)
//     const { name, mobileNumber, email } = req.body; // Use email if necessary for validation or future reference
 
//     try {
//         // Validate driver ID
//         // if (!driverId) {
//         //     return res.status(400).json({ error: 'Driver ID is required to update profile' });
//         // }

//         // Find the driver by their ID
//         const driver = await Driver.findOne({email : email}); // Find by ID instead of email

//         if (!driver) {
//             return res.status(404).json({ error: 'Driver not found' });
//         }

//         // Update the profile details
//         if (name) driver.name = name;
//         if (mobileNumber) driver.mobileNumber = mobileNumber;

//         // Check if an image was uploaded and update the image field
//         if (req.file) {
//             driver.image = `/uploads/drivers/${req.file.filename}`; // Update the image path with the uploaded file
//         }

//         // Save the updated driver
//         const updatedDriver = await driver.save();

//         // Respond with the updated driver data
//         res.status(200).json({
//             message: 'Profile updated successfully',
//             driver: {
//                 id: updatedDriver._id,
//                 name: updatedDriver.name,
//                 mobileNumber: updatedDriver.mobileNumber,
//                 email: updatedDriver.email,
//                 image: updatedDriver.image,
//             }
//         });
//     } catch (err) {
//         // Handle specific errors for debugging
//         console.error("Update Profile Error: ", err);
//         res.status(500).json({ error: 'An error occurred while updating the profile.' });
//     }
// });
// router.put('/upda

 

  router.put('/update-password', authenticateDriver, async (req, res) => {
    const { currentPassword, newPassword } = req.body; // Get the current and new password from the request

    try {
        // Ensure the new password is provided
        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required.' });
        }

        // Find the driver using the authenticated driver's ID
        // console.log(req.driver._id);
        const driver = await Driver.findById(req.driver._id);
        

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found.' });
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, driver.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);
        driver.password = hashedPassword; // Update the driver's password

        // Save the updated driver
        await driver.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        // console.error('Error updating password:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/driverdetail', authenticateDriver, async (req, res) => {
    const { email } = req.query; // For logistics head to access other driver details

    try {
        let driver;

        if (req.role === 'driver') {
            // If logged-in user is a driver, return their own details
            driver = req.driver; // Assuming req.driver contains the driver's details.
        } else if (req.role === 'logistics_head') {
            // If logged-in user is a logistics head, allow them to access any driver's details
            if (!email) {
                return res.status(400).json({ error: 'Email query parameter is required' });
            }

            // Find the driver by email
            driver = await Driver.findOne({ email });

            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }
        } else {
            // If user role is neither driver nor logistics head
            return res.status(403).json({ error: 'Access denied' });
        }

        // Return the complete driver details including required fields
        return res.status(200).json({
            _id: driver._id, // Add the _id field
            name: driver.name,
            mobileNumber: driver.mobileNumber,
            email: driver.email,
            role: driver.role, // Include the role if necessary
            image: driver.image // Ensure this matches your SwiftUI model
        });
    } catch (err) {
        // console.error('Error fetching driver details:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get all drivers
router.get('/getdrivers', authenticateLogisticsHead, async (req, res) => {
    try {
        if (req.user.role !== 'logistics_head') {
            return res.status(403).json({ error: 'Access denied: Only logistics heads can view vehicles.' });
        }

        // Find drivers assigned to the authenticated logistics head
        const drivers = await Driver.find({ assignedBy: req.user._id });

        // Respond with the found drivers
        res.status(200).json(drivers);
    } catch (err) {
        // console.error('Error fetching drivers:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
