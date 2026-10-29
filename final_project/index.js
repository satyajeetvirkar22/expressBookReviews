const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const JWT_SECRET = require('./router/auth_users.js').JWT_SECRET;

const app = express();
app.use(express.json());
app.use('/customer', session({
  secret: 'fingerprint_customer',
  resave: false,
  saveUninitialized: false
}));

// Protect authenticated review endpoints.
app.use('/customer/auth', (req, res, next) => {
  const authorization = req.session && req.session.authorization;
  if (!authorization || !authorization.accessToken) {
    return res.status(401).json({ message: 'Please log in to access this route.' });
  }
  try {
    const payload = jwt.verify(authorization.accessToken, JWT_SECRET);
    req.session.authorization.username = payload.username;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
});

const PORT = process.env.PORT || 5000;
app.use('/customer', customer_routes);
app.use('/', genl_routes);
app.listen(PORT, () => console.log('Server is running on port ' + PORT));
