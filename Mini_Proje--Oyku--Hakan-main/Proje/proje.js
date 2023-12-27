const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  sanitizeInput(req.body);
  sanitizeInput(req.query);
  sanitizeInput(req.params);
  next();
});

function sanitizeInput(data) {
  for (const key in data) {
    if (typeof data[key] === 'object') {
      sanitizeInput(data[key]);
    } else if (typeof data[key] === 'string') {
      data[key] = data[key].replace(/['";]/g, ''); 
    }
  }
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many requests, please wait!"
});

const registerLimiter = slowDown({
  windowMs: 5 * 60 * 1000,
  delayAfter: 3,
  delayMs: 2000,
});

const users = [];

app.post('/register', apiLimiter, registerLimiter, (req, res) => {
  const { email, password, confirmPassword } = req.body;

  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }


  if (userExists(email)) {
    return res.status(400).json({ error: "Email address is already registered" });
  }


  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ email, password: hashedPassword });


  sendVerificationEmail(email);

  res.status(201).json({ message: "Registration successful, verification email sent" });
});

function userExists(email) {
  return users.some(user => user.email === email);
}

function sendVerificationEmail(email) {

  console.log(`Verification email sent to: ${email}`);
}

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


