const multer = require('multer');
const path = require('path');

// Set up storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the destination folder for uploads
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        // Set the filename for the uploaded file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;
