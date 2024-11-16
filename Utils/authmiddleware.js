// const jwt = require('jsonwebtoken');
// const Driver = require('../Models/Driver');
// const mongoose = require('mongoose');
// const LogisticsUser = require("../Models/User")
// // Middleware to authenticate logistics head
// const authenticateLogisticsHead = async (req, res, next) => {
//   // Check if Authorization header exists
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({ error: 'Authorization header missing' });
//   }

//   // Split the token and validate its presence
//   const token = authHeader.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ error: 'Token missing' });
//   }

//   try {
//     // Verify the token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;

//     // console.log('Decoded token:', decoded); // Log for debugging

//     // Ensure that the user has the correct role
//     if (req.user.role !== 'logistics_head') {
//       return res.status(403).json({ error: 'Access denied: Not a logistics head' });
//     }

//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     console.error('Token verification error:', error); // Log the error for debugging
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };

// // Middleware to authenticate driver
// // Middleware to authenticate driver
// const authenticateDriver = async (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');

//   if (!token) {
//       return res.status(401).json({ error: 'Authorization token missing' });
//   }

//   try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const driverId = new mongoose.Types.ObjectId(decoded._id);

//       console.log('Decoded Token:', decoded); // Debugging: Check the decoded token
//       console.log('Driver Email from Token:', decoded.email); // Log the email here

//       const driver = await Driver.findById(driverId);

//       if (!driver) {
//           console.error('Driver not found with ID:', driverId); // Log the ID that failed
//           throw new Error('Driver not found');
//       }

//       req.driver = driver;
//       req.role = driver.role;
//       req.email = decoded.email; // Access the email here if needed
//       next();
//   } catch (error) {
//       console.error('Authentication error:', error);
//       res.status(401).json({ error: 'Authentication failed' });
//   }
// };



// // Export both middleware functions
// module.exports = {
//   authenticateLogisticsHead,
//   authenticateDriver
// };

const jwt = require('jsonwebtoken');
const Driver = require('../Models/Driver');
const mongoose = require('mongoose');
const LogisticsUser = require('../Models/User');

// Middleware to authenticate logistics head

const authenticateLogisticsHead = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    const logisticsHeadId = new mongoose.Types.ObjectId(decoded._id);

     
    // console.log('Decoded Token for Logistics Head:', decoded);

    const logisticsHead = await LogisticsUser.findById(logisticsHeadId);
    if (!logisticsHead) {
      // console.error('Logistics Head not found with ID:', logisticsHeadId);
      return res.status(404).json({ error: 'Logistics head not found' });
    }

    if (logisticsHead.role !== 'logistics_head') {
      return res.status(403).json({ error: 'Access denied: Not a logistics head' });
    }

    req.user = logisticsHead;  // Attach user data to the request object
    req.role = logisticsHead.role;
    req.email = decoded.email;  // Use decoded email if needed
    next();
  } catch (error) {
    // console.error('Token verification error for logistics head:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to authenticate driver
const authenticateDriver = async (req, res, next) => {
  // console.log("this is token ")
  // console.log(req.header('Authorization'))
  const token = req.header('Authorization')?.replace('Bearer ', '');
  // console.log("this is stupidity")
  //  console.log(token)
  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const driverId = new mongoose.Types.ObjectId(decoded._id);
    
    // console.log('Decoded Token for Driver:', decoded);
    // console.log('Driver Email from Token:', decoded.email);

    const driver = await Driver.findById(driverId);
    if (!driver) {
      // console.error('Driver not found with ID:', driverId);
      return res.status(404).json({ error: 'Driver not found' });
    }

    req.driver = driver;  // Attach driver data to the request object
    req.role = driver.role;
    req.email = decoded.email;  // Use decoded email if needed
    next();
  } catch (error) {
    // console.error('Authentication error for driver:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateLogisticsHead,
  authenticateDriver
};
