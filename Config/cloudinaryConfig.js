const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: 'dq9ewa8hx',     // Replace with your Cloudinary cloud name
    api_key: '777755322941194',           // Replace with your Cloudinary API key
    api_secret: '2dtbF8g_SXRR7VvsLMEGzhrGh1k'      // Replace with your Cloudinary API secret
});

module.exports = cloudinary;
