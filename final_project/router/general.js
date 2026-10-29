const express = require('express');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');
const public_users = express.Router();

// Register a new user.
public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
  if (isValid(username)) return res.status(409).json({ message: 'Username already exists.' });
  users.push({ username, password });
  return res.status(200).json({ message: 'User successfully registered. Now you can login' });
});

// Get all books.
public_users.get('/', (req, res) => res.status(200).json(books));

// Get book by ISBN.
public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book);
});

// Get books by exact author name (case-insensitive).
public_users.get('/author/:author', (req, res) => {
  const author = decodeURIComponent(req.params.author).toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => String(book.author).toLowerCase() === author)
    .map(([isbn, book]) => ({ isbn, author: book.author, title: book.title, reviews: book.reviews }));
  if (!matches.length) return res.status(404).json({ message: 'No books found for this author.' });
  return res.status(200).json(matches);
});

// Get books by exact title (case-insensitive).
public_users.get('/title/:title', (req, res) => {
  const title = decodeURIComponent(req.params.title).toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => String(book.title).toLowerCase() === title)
    .map(([isbn, book]) => ({ isbn, author: book.author, title: book.title, reviews: book.reviews }));
  if (!matches.length) return res.status(404).json({ message: 'No books found with this title.' });
  return res.status(200).json(matches);
});

// Get reviews for a book.
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (!book.reviews || Object.keys(book.reviews).length === 0) {
    return res.status(200).json({});
  }
  return res.status(200).json({ reviews: book.reviews });
});

// Assignment-compatible review update endpoint. The course exercise sends username/review in JSON.
// In production, derive the username from authenticated session/JWT instead of trusting the request body.
public_users.put('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const { username, review } = req.body || {};
  if (!username || typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'Username and a non-empty review are required.' });
  }
  book.reviews[username] = review;
  return res.status(200).json({ message: 'Review added/updated successfully', reviews: book.reviews });
});

module.exports.general = public_users;
