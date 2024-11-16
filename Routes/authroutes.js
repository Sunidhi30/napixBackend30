const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Driver = require('../Models/Driver');
const {hashPassword, comparePassword } = require('../Utils/password');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res) => {
//   console.log('Signin route hit');
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
      // Attempt to find the user
      let user = await User.findOne({ email });
      if (!user) user = await Driver.findOne({ email });
    //   console.log('User Found:', user);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    //   console.log('User Found:', user); // Log user object

      // Compare the password
      const match = await comparePassword(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      // Log token payload
    //   console.log('Token Payload:', { _id: user._id, role: user.role, email: user.email });

      // Generate a JWT token including email
      const token = jwt.sign(
          { _id: user._id, role: user.role, email: user.email },
          process.env.JWT_SECRET
      );

      // Respond with the token
      res.status(200).json({ token, role: user.role });
  } catch (error) {
    //   console.error('Login error:', error.message);
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;
