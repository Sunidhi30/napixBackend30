const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    name: String,
    mobileNumber: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'driver' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'LogisticsHead' },
    passwordResetRequired: { type: Boolean, default: true },
    image: {
        type: String,
        default: 'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg', // Default image URL
        required: false
    }
});

module.exports = mongoose.model('Driver', DriverSchema);

