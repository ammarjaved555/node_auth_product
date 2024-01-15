require("dotenv").config()
const express = require('express');
const User = require('./modal/user');
const bcrypt = require('bcrypt');
const connectDb = require("./db/connect")
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET; 
const REFRESH_SECRET = process.env.REFRESH_SECRET; 
const MONGODB_URI = process.env.MONGODB_URI;
const refreshTokens = [];
// middleware
app.use(express.json())

// Middleware to verify the access token
const verifyAccessToken = (req, res, next) => {
    const token = req.headers.authorization;
console.log("this is protected token",token)
    if (!token) {
        return res.status(401).send('Access token is missing');
    }

    jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Invalid access token');
        }
        req.user = decoded;
        next();
    });
};
// Function to check password strength
const isStrongPassword=(password)=> {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasMinLength = password.length > 7;
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUpperCase && hasMinLength && hasSymbol;
}

// register
app.post('/register', async(req, res) => {
    const {firstName,lastName, userName, password, phone} = req.body;    

// Check password strength
if (!isStrongPassword(password)) {
  return res.status(400).send('Weak password. password should contain minimum 8 characters, atleast one upper case and symbol ');
}

    console.log( firstName,lastName, userName, password, phone)
    const hashPassword = await bcrypt.hash(password, saltRounds);
      
    try {
      
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
          return res.status(402).send('Email already exists');
        }
        const newUser = await User.create({ firstName,lastName, userName, password: hashPassword, phone });
        console.log('User registered:', newUser._id);
        const accessToken = jwt.sign({ userId: newUser._id, userName: newUser.userName }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: newUser._id, userName: newUser.userName}, REFRESH_SECRET);
        refreshTokens.push(refreshToken);
console.log(refreshTokens)
        res.json({ accessToken, refreshToken });


      } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).send('Internal Server Error');
      }
});



// login
app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
console.log(userName)
    try {
      const userExist = await User.findOne({ userName });
  
      if (!userExist) {
        return res.status(401).send('Invalid username or password');
      }
  
      const passwordMatch = await bcrypt.compare(password, userExist.password);
  console.log(passwordMatch , userExist)
      if (passwordMatch) {
        const accessToken = jwt.sign({ userId: userExist._id, userName: userExist.userName }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: userExist._id, userName: userExist.userName}, REFRESH_SECRET);
        refreshTokens.push(refreshToken);
console.log(refreshTokens)
        res.json({ accessToken, refreshToken });
      } else {
        res.status(401).send('Invalid username or password');
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });
// refresh token
app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
console.log(refreshToken)
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).send('Invalid refresh token');
    }

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid refresh token');
        }
console.log(decoded)
        const accessToken = jwt.sign( {userId: decoded.userId, userName: decoded.userName }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    });
});

// protected route
app.get('/protected', verifyAccessToken, (req, res) => {
    // Access token is valid, and the user information is attached to req.user
    res.send('This is a protected route' );
});


// listen


app.listen(port, () => {
  connectDb(MONGODB_URI)
    console.log(`Server is running on http://localhost:${port}`);
});
