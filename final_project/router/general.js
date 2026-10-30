const express = require('express');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');
const public_users = express.Router();

// Helper functions returning Promises for Tasks 10-13 (Promise / async-await)
const getAllBooksAsync = () => {
  return new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject({ status: 500, message: 'Unable to retrieve books.' });
    }
  });
};

const getBookByISBNAsync = (isbn) => {
  return new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject({ status: 404, message: 'Book not found.' });
    }
  });
};

const getBooksByAuthorAsync = (author) => {
  return new Promise((resolve, reject) => {
    const targetAuthor = decodeURIComponent(author).toLowerCase();
    const matches = Object.entries(books)
      .filter(([, book]) => String(book.author).toLowerCase() === targetAuthor)
      .map(([isbn, book]) => ({ isbn, author: book.author, title: book.title, reviews: book.reviews }));
    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject({ status: 404, message: 'No books found for this author.' });
    }
  });
};

const getBooksByTitleAsync = (title) => {
  return new Promise((resolve, reject) => {
    const targetTitle = decodeURIComponent(title).toLowerCase();
    const matches = Object.entries(books)
      .filter(([, book]) => String(book.title).toLowerCase() === targetTitle)
      .map(([isbn, book]) => ({ isbn, author: book.author, title: book.title, reviews: book.reviews }));
    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject({ status: 404, message: 'No books found with this title.' });
    }
  });
};

// Task 6: Register a new user
public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
  if (isValid(username)) return res.status(409).json({ message: 'Username already exists.' });
  users.push({ username, password });
  return res.status(200).json({ message: 'User successfully registered. Now you can login' });
});

// Task 1 / Task 10: Get the book list available in the shop using async/await and Promises
public_users.get('/', async (req, res) => {
  try {
    const bookList = await getAllBooksAsync();
    return res.status(200).json(bookList);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Error fetching books.' });
  }
});

// Task 2 / Task 11: Get book details based on ISBN using async/await and Promises
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBNAsync(req.params.isbn);
    return res.status(200).json(book);
  } catch (error) {
    return res.status(error.status || 404).json({ message: error.message || 'Book not found.' });
  }
});

// Task 3 / Task 12: Get book details based on author using async/await and Promises
public_users.get('/author/:author', async (req, res) => {
  try {
    const matchedBooks = await getBooksByAuthorAsync(req.params.author);
    return res.status(200).json(matchedBooks);
  } catch (error) {
    return res.status(error.status || 404).json({ message: error.message || 'No books found for this author.' });
  }
});

// Task 4 / Task 13: Get all books based on title using async/await and Promises
public_users.get('/title/:title', async (req, res) => {
  try {
    const matchedBooks = await getBooksByTitleAsync(req.params.title);
    return res.status(200).json(matchedBooks);
  } catch (error) {
    return res.status(error.status || 404).json({ message: error.message || 'No books found with this title.' });
  }
});

// Task 5: Get book reviews based on ISBN
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (!book.reviews || Object.keys(book.reviews).length === 0) {
    return res.status(200).json({});
  }
  return res.status(200).json({ reviews: book.reviews });
});

// Assignment-compatible review update endpoint
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

// Export helper Promise functions as well for direct testing if required
module.exports = {
  general: public_users,
  getAllBooks: getAllBooksAsync,
  getBooksByISBN: getBookByISBNAsync,
  getBooksByAuthor: getBooksByAuthorAsync,
  getBooksByTitle: getBooksByTitleAsync
};
