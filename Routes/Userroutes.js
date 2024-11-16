const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { hashPassword } = require('../Utils/password');
const router = express.Router();
const upload = require('../Config/uploadConfig')
const {authenticateLogisticsHead} = require('../Utils/authmiddleware');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// const cloudinary = require('../Config/cloudinaryConfig'); // Adjust the path as necessary
// import { v2 as cloudinary } from 'cloudinary';
const cloudinary = require('cloudinary').v2;


const fs = require('fs');
const path = require('path');

require('dotenv').config();

// router.post('/signup/logistics-head', [
//     body('email').isEmail().withMessage('Invalid email address'), // Validate email
//     body('phoneNumber').isNumeric().withMessage('Phone number must be numeric'), // Validate phone number
//     body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long') // Validate password length
// ], async (req, res) => {

//     const { name, email, phoneNumber, password, companyName } = req.body;

//     try {
//         // Ensure all required fields are present
//         if (!name || !email || !phoneNumber || !password || !companyName) {
//             return res.status(400).json({ error: "All fields are required." });
//         }

//         // Check if the email already exists in the database
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ error: "User with this email already exists." });
//         }

//         // Hash the password
//         const hashedPassword = await hashPassword(password);

//         // Create a new user
//         const newUser = new User({
//             name,
//             email,
//             phoneNumber,
//             password: hashedPassword,
//             role: 'logistics_head',
//             companyName,
//             profileImage: 
//         });
// /// send the image to cloudinary 
// // get the url path for the image 
// // then add the user path to the user field 
// //send post request to this route 
//         // Save the user to the database
//         await newUser.save();

//         // Generate a JWT token
//         const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
//         });

//         // Respond with the token and role
//         res.status(201).json({
//             message: 'LogisticsUser created',
//             token: token,
//             role: newUser.role
//         });
//     } catch (err) {
//         console.error(err); // Log the error for debugging
//         res.status(400).json({ error: err.message });
//     }
// });

// router.post('/signup/logistics-head', [
//     body('email').isEmail().withMessage('Invalid email address'),
//     body('phoneNumber').isNumeric().withMessage('Phone number must be numeric'),
//     body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
// ], async (req, res) => {
//  console.log(req.body)
//     const { name, email, phoneNumber, password, companyName, profileImageUrl } = req.body;
   
//     try {
//         // Check for required fields
//         if (!name || !email || !phoneNumber || !password || !companyName || !profileImageUrl) {
//             return res.status(400).json({ error: "All fields are required." });
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ error: "User with this email already exists." });
//         }

//         // Hash the password
//         const hashedPassword = await hashPassword(password);

//         // Create a new user
//         const newUser = new User({
//             name,
//             email,
//             phoneNumber,
//             password: hashedPassword,
//             role: 'logistics_head',
//             companyName,
//             profileImage: profileImageUrl // Store the Cloudinary URL here
//         });

//         await newUser.save();

//         // Create a token
//         const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET);

//         // Return success response
//         res.status(201).json({
//             message: 'LogisticsUser Created', // Match the expected format
//             token: token,
//             role: newUser.role
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(400).json({ error: err.message });
//     }
// });
// const { body, validationResult } = require('express-validator');

router.post('/signup/logistics-head', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('phoneNumber').isNumeric().withMessage('Phone number must be numeric'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req, res) => {
    // Log the request body to inspect the data being sent
    console.log("Received request body:", req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phoneNumber, password, companyName, profileImageUrl } = req.body;

    try {
        // Check for required fields
        if (!name || !email || !phoneNumber || !password || !companyName || !profileImageUrl) {
            console.error("Missing required fields");
            return res.status(400).json({ error: "All fields are required." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.error("User already exists with email:", email);
            return res.status(400).json({ error: "User with this email already exists." });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create a new user
        const newUser = new User({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            role: 'logistics_head',
            companyName,
            profileImage: profileImageUrl // Store the Cloudinary URL here
        });

        await newUser.save();

        // Create a token
        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET);

        // Return success response
        res.status(201).json({
            message: 'LogisticsUser Created', // Match the expected format
            token: token,
            role: newUser.role
        });
    } catch (err) {
        // console.error("Error occurred:", err);
        res.status(400).json({ error: err.message });
    }
});


router.put('/edit-user/:id', authenticateLogisticsHead, async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, companyName } = req.body;

    try {
        // Find the user by ID and update their details
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email, phoneNumber, companyName },
            { new: true, runValidators: true } // Return the updated document and run validation
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond to the client with the updated user details
        res.status(200).json({ message: 'User details updated successfully', user: updatedUser });

    } catch (err) {
        // console.error(err); // Log the error for debugging
        res.status(400).json({ error: err.message });
    }
});


// Route to get user details after signup
// Route to get user details
router.get('/profile', authenticateLogisticsHead, async (req, res) => {
    if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    // console.log('User ID:', req.user._id);

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            // console.log(`No user found for ID: ${req.user._id} from request made by ${req.ip}`);
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Remove sensitive information
        const { password, ...userDetails } = user.toObject();

        // console.log('User data fetched:', userDetails);

        res.status(200).json({
            success: true,
            id: userDetails._id,
            image: userDetails.profileImage, 
            name: userDetails.name,
            email: userDetails.email,
            phoneNumber: userDetails.phoneNumber,
            companyName: userDetails.companyName,
        });
    } catch (err) {
        // console.error('Error fetching user with ID:', req.user._id, 'Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// router.put('/update-profile', authenticateLogisticsHead , upload.single('image'), async (req, res) => {
//     console.log(req.body);
//     const { name, mobileNumber, email } = req.body; // Use email if necessary for validation or future reference

//     try {
//         // Validate logistics ID or email (you can customize this based on your needs)
//         // if (!logisticsId) {
//         //     return res.status(400).json({ error: 'Logistics ID is required to update profile' });
//         // }

//         // Find the logistics user by theiremail
//         const logisticsUser = await User.findOne({ email: email }); // You can also find by ID if necessary
//         // const user = await User.findById(req.user._id);

//         if (!logisticsUser) {
//             return res.status(404).json({ error: 'Logistics user not found' });
//         }

//         // Update the profile details
//         if (name) logisticsUser.name = name;
//         if (mobileNumber) logisticsUser.mobileNumber = mobileNumber;

//         // Check if an image was uploaded and update the image field
//         if (req.file) {
//             logisticsUser.image = `/uploads/logistics/${req.file.filename}`; // Update the image path with the uploaded file
//         }

//         // Save the updated logistics user
//         const updatedLogisticsUser = await logisticsUser.save();

//         // Respond with the updated logistics user data
//         res.status(200).json({
//             message: 'Profile updated successfully',
//             logistics: {
//                 id: updatedLogisticsUser._id,
//                 name: updatedLogisticsUser.name,
//                 mobileNumber: updatedLogisticsUser.mobileNumber,
//                 email: updatedLogisticsUser.email,
//                 image: updatedLogisticsUser.image,
//             }
//         });
//     } catch (err) {
//         // Handle specific errors for debugging
//         console.error("Update Profile Error: ", err);
//         res.status(500).json({ error: 'An error occurred while updating the profile.' });
//     }
// });
// above code is running correctly 

// router.put('/update-profile', authenticateLogisticsHead, upload.single('file'), async (req, res) => {
//     console.log("welcome")
//     console.log(req.body)
//     const { name, mobileNumber, email, companyName } = req.body;

//     try {
//         // Retrieve the logistics user by their ID from the authenticated request
//         const logisticsUserId = req.user._id;  
//         const logisticsUser = await User.findById(logisticsUserId);

//         if (!logisticsUser) {
//             return res.status(404).json({ error: 'Logistics user not found' });
//         }

//         // Update profile details
//         if (name) logisticsUser.name = name;
//         if (mobileNumber) logisticsUser.phoneNumber = mobileNumber;
//         if (email) logisticsUser.email = email;
//         if (companyName) logisticsUser.companyName = companyName;

//         // Handle image upload if a file is included
//         console.log("hey")
        
//        if(req.body.image){
//         logisticsUser.image = req.body.image;
//        }
//         console.log(req.body.image)
//         // Save the updated logistics user
//         const updatedLogisticsUser = await logisticsUser.save();

//         // Respond with the updated logistics user data
//         res.status(200).json({
//             message: 'Profile updated successfully',
//             logistics: {
//                 id: updatedLogisticsUser._id,
//                 name: updatedLogisticsUser.name,
//                 mobileNumber: updatedLogisticsUser.phoneNumber,
//                 email: updatedLogisticsUser.email,
//                 image: updatedLogisticsUser.image // Include image in response
//             }
//         });
//     } catch (err) {
//         console.error("Update Profile Error: ", err);
//         res.status(500).json({ error: 'An error occurred while updating the profile.' });
//     }
// });

router.put('/update-profile', authenticateLogisticsHead, async (req, res) => {
    // console.log("welcome")
    //     console.log(req.body)
    const { name, mobileNumber, email, companyName, profileImage } = req.body; // Include profileImage in req.body

    try {
        const logisticsUserId = req.user._id;  
        const logisticsUser = await User.findById(logisticsUserId);

        if (!logisticsUser) {
            return res.status(404).json({ error: "User not found." });
        }

        // Update fields if provided
        logisticsUser.name = name || logisticsUser.name;
        logisticsUser.mobileNumber = mobileNumber || logisticsUser.mobileNumber;
        logisticsUser.email = email || logisticsUser.email;
        logisticsUser.companyName = companyName || logisticsUser.companyName;
        logisticsUser.profileImage = req.body.image || logisticsUser.profileImage; // Update the profile image URL
        // console.log("this is image")
        // console.log(logisticsUser.profileImage)
        // console.log("hey")
        
               if(req.body.image){
                logisticsUser.image = req.body.image;
               }
                // console.log(req.body.image)
        await logisticsUser.save();

        res.status(200).json({ message: "Profile updated successfully." });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Server error: Could not update profile." });
    }
});

	
// adidd3gq
router.put("/updateLogisticProfile", async (req, res) => {
    const { id, profileImage } = req.body;
  
    try {
      const driver = await DriverProfile.findById(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
  
      driver.profileImage = profileImage;
      await driver.save();
  
      res.json(driver); // Send the updated driver profile as response
    } catch (error) {
    //   console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  

router.put('/update-password', authenticateLogisticsHead, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Validate the new password
        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required.' });
        }

        // Retrieve the logistics head ID from the authenticated request
        // console.log(req.user);
        const logisticsHeadId = req.user._id;  // Use req.user._id, as set by the middleware
        const logisticsHead = await User.findById(logisticsHeadId);

        // Check if logistics head exists
        if (!logisticsHead) {
            return res.status(404).json({ error: 'Logistics head not found.' });
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, logisticsHead.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        // Hash and update the new password
        const hashedPassword = await hashPassword(newPassword);
        logisticsHead.password = hashedPassword;

        // Save the updated logistics head data
        await logisticsHead.save();

        // Respond with success message and logistics head ID
        res.status(200).json({
            message: 'Password updated successfully.',
            logisticsHeadId: logisticsHead._id
        });
    } catch (err) {
        // console.error('Error updating password:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the reset token before saving it to the database for security
        // const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set the reset token and expiration time on the user object
        user.passwordResetToken =resetToken;
        // user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // Token expires in 1 hour

        await user.save();
        // Create the reset password URL
        const resetURL = `http://localhost:5001/api/users/reset-password/${resetToken}`;

        // Setup Nodemailer to send the reset email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Define the email options
        const mailOptions = {
            from: process.env.EMAIL_USER, // sender address
            to: user.email, // receiver's email
            subject: 'Password Reset Request', // Subject line
            html: `
                <h1>Password Reset Request</h1>
                <p>You have requested a password reset. Please click on the link below to reset your password:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Error sending email' });
            }
            // console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Password reset email sent successfully' });
        });

    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Route for rendering the reset password form

router.put('/reset-password', async (req, res) => {
    const resetToken = req.body.resetToken;
    const newPassword= req.body.newPassword;

    // Hash the token to compare with the stored hashed token
    // const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//   console.log("heyyy i dont love you ")
//   console.log(newPassword)
//   console.log("heyyy i love you ")

  console.log(resetToken)

    try {
        // Find the user by the reset token and check if the token has not expired
        const user = await User.findOne({
            passwordResetToken: resetToken,
            // passwordResetExpires: { $gt: Date.now() }, // Check if the token is still valid (not expired)
        });
        // console.log(user)
        if (!user) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password reset successfull. now gand marao' });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route for actually resetting the password

// router.post('/reset-password/token', async (req, res) => {
//     const resetToken = req.params.token;
//     const { newPassword } = req.body;

//     // Hash the token to compare with the stored hashed token
//     const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

//     try {
//         // Find the user by the reset token and check if the token has not expired
//         const user = await User.findOne({
//             passwordResetToken: hashedToken,
//             passwordResetExpires: { $gt: Date.now() }, // Check if the token is still valid
//         });

//         if (!user) {
//             return res.status(400).json({ error: 'Token is invalid or has expired' });
//         }

//         // Update the user's password
//         user.password = await bcrypt.hash(newPassword, 12); // You can set a stronger hash round
//         user.passwordResetToken = undefined; // Clear the reset token
//         user.passwordResetExpires = undefined; // Clear the expiration time

//         await user.save();

//         // Optionally, you can send a confirmation email here

//         res.status(200).json({ message: 'Password reset successful' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// router.post('/reset-password/:token', async (req, res) => {
//     const { token } = req.params;
//     const { newPassword } = req.body;

//     try {
//         // Hash the token and find user by reset token
//         const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
//         const user = await User.findOne({
//             resetPasswordToken: hashedToken,
//             resetPasswordExpires: { $gt: Date.now() } // Ensure token is not expired
//         });

//         if (!user) {
//             return res.status(400).json({ error: 'Invalid or expired token.' });
//         }

//         // Update password and clear the reset token fields
//         const hashedPassword = await bcrypt.hash(newPassword, 12);
//         user.password = hashedPassword;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;

//         // Save updated user
//         await user.save();

//         res.status(200).json({ message: 'Password reset successful.' });
//     } catch (err) {
//         console.error('Error resetting password:', err);
//         res.status(500).json({ error: 'Server error.' });
//     }
// });
// router.get('/reset-password/:token', (req, res) => {
//     const { token } = req.params;
    
//     // You can either serve an HTML page, or redirect the user to the front-end page where they will input their new password.
//     // Assuming you're serving an HTML form:
//     res.send(`
//         <html>
//             <body>
//                 <h2>Reset Password</h2>
//                 <form action="/reset-password/${token}" method="POST">
//                     <input type="password" name="newPassword" placeholder="Enter new password" required />
//                     <button type="submit">Reset Password</button>
//                 </form>
//             </body>
//         </html>
//     `);
// });
// Serve a password reset form
// Step 1: Request a password reset

router.post("/reset-password", async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "No account found with that email." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
   
    await user.save();
    // console.log("this is token with user", user)

    // Send email with reset link
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "famousedit9304@gmail.com",
            pass: "fkgpgnavvpycxilt",
        },
    });
//    console.log("this is tooken thrpugh email", resetToken)
    const resetUrl = `http://localhost:5001/api/users/reset-password/${resetToken}`;

    const mailOptions = {
        to: user.email,
        from: "famousedit9304@gmail.com",
        subject: "Password Reset Request",
        text: `You are receiving this email because you (or someone else) have requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            return res.status(500).json({ message: "Failed to send reset email." });
        }
        res.status(200).json({ message: "Reset link sent." });
    });
});


router.get("/reset-password/:token" , async (req,res)=>{
    const{token} = req.params
    const user = await User.findOne({
        resetPasswordToken: token
    })
    if(!user){
        // console.log("there is no token")
        res.send("inivalid token")
        return 
    }
    res.render("reset", {
        token
    })
})
router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // console.log("This is body:", req.body);
    // console.log("Received token:", token);
    // console.log("Received password:", password);

    // Find the user with matching token
    const user = await User.findOne({
        resetPasswordToken: token 
    });

    // console.log("This is user:", user);

    if (!user) {
        // console.log("No user found or token expired"); // Log when no user is found
        return res.status(400).json({ message: "Invalid or expired token." });
    }

    // console.log("User found:", user); // Log the user found in the database

    // Hash the new password before saving
    user.password = bcrypt.hashSync(password, 10);

    // Clear the reset token (you can also reset the expiration if you have that field)
    user.resetPasswordToken = undefined;

    await user.save();

    // console.log("Password reset successful for user:", user.email); // Log after successful password reset
    res.status(200).json({ message: "Password reset successful." });
});


module.exports = router;