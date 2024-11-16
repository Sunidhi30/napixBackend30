require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter using environment variables for sensitive data
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Get email from environment variable
        pass: process.env.EMAIL_PASS,  // Get password from environment variable
    },
});

// console.log('Email User:', process.env.EMAIL_USER);
// console.log('Email Pass:', process.env.EMAIL_PASS ? 'Loaded' : 'Not Loaded');


// Function to send email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Use the email from environment variable
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
//mail i working in local