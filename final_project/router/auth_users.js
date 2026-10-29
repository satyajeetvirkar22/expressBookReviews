const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');
const regd_users = express.Router();
const users = [];
const JWT_SECRET = 'express_book_reviews_assignment_secret';

const isValid = (username) => users.some((user) => user.username === username);
const authenticatedUser = (username, password) => users.some((user) => user.username === username && user.password === password);

// Log in registered users and create a session-bound JWT.
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || !authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: 'Login successful!' });
});

// Add or update a review for a book. Authentication is enforced in index.js.
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const review = req.query.review;
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'A non-empty review query parameter is required.' });
  }
  const username = req.session.authorization.username;
  book.reviews[username] = review;
  return res.status(200).json({ message: 'Review added/updated successfully', reviews: book.reviews });
});

// Delete the current user's review for a book.
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const username = req.session.authorization.username;
  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: 'No review found for this user and ISBN.' });
  }
  delete book.reviews[username];
  return res.status(200).json({ message: 'Review for ISBN ' + isbn + ' deleted.' });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
module.exports.JWT_SECRET = JWT_SECRET;
