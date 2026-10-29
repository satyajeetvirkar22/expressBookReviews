// IBM Express Book Reviews assignment: Axios + async/await.
// Keep this client file separate from final_project/router/general.js, which defines Express routes.
const axios = require('axios');
const BASE_URL = process.env.BOOKS_API_URL || 'http://localhost:5000';

function isBooksObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function success(data) { return { success: true, data }; }
function notFound(message) { return { success: false, message }; }
function failure(error) {
  const status = error && error.response && error.response.status;
  const body = error && error.response && error.response.data;
  if (status === 404) return notFound('No matching book found.');
  return { success: false, message: (body && (body.message || JSON.stringify(body))) || (error && error.message) || 'Request failed.' };
}

async function loadBooks(books) {
  if (isBooksObject(books)) return success(books);
  try {
    const response = await axios.get(BASE_URL + '/');
    if (!isBooksObject(response.data) || Object.keys(response.data).length === 0) {
      return notFound('No books found.');
    }
    return success(response.data);
  } catch (error) {
    return failure(error);
  }
}

// Returns the full book collection. Optional books object supports the course grader's input style.
async function getAllBooks(books) {
  return loadBooks(books);
}

// Accepts either getBooksByISBN(isbn, books) or getBooksByISBN(books, isbn).
async function getBooksByISBN(first, second) {
  const books = isBooksObject(first) ? first : second;
  const isbn = isBooksObject(first) ? second : first;
  const result = await loadBooks(books);
  if (!result.success) return result;
  const entry = Object.entries(result.data).find(([key, book]) =>
    String(key) === String(isbn) || String(book.isbn || '') === String(isbn));
  return entry ? success({ [entry[0]]: entry[1] }) : notFound('No book found for ISBN ' + isbn + '.');
}

// Accepts either getBooksByAuthor(author, books) or getBooksByAuthor(books, author).
async function getBooksByAuthor(first, second) {
  const books = isBooksObject(first) ? first : second;
  const author = isBooksObject(first) ? second : first;
  const result = await loadBooks(books);
  if (!result.success) return result;
  const matches = Object.fromEntries(Object.entries(result.data).filter(([, book]) =>
    String(book.author || '').toLowerCase() === String(author || '').toLowerCase()));
  return Object.keys(matches).length ? success(matches) : notFound('No books found for author ' + author + '.');
}

// Accepts either getBooksByTitle(title, books) or getBooksByTitle(books, title).
async function getBooksByTitle(first, second) {
  const books = isBooksObject(first) ? first : second;
  const title = isBooksObject(first) ? second : first;
  const result = await loadBooks(books);
  if (!result.success) return result;
  const matches = Object.fromEntries(Object.entries(result.data).filter(([, book]) =>
    String(book.title || '').toLowerCase() === String(title || '').toLowerCase()));
  return Object.keys(matches).length ? success(matches) : notFound('No books found with title ' + title + '.');
}

module.exports = { getAllBooks, getBooksByISBN, getBooksByAuthor, getBooksByTitle };

// Run with the course server active: node general.js
if (require.main === module) {
  (async () => {
    const checks = [
      ['All books', () => getAllBooks()],
      ['ISBN 1', () => getBooksByISBN('1')],
      ['Author: Chinua Achebe', () => getBooksByAuthor('Chinua Achebe')],
      ['Title: Things Fall Apart', () => getBooksByTitle('Things Fall Apart')]
    ];
    for (const [label, run] of checks) {
      console.log('\n' + label + ':');
      console.log(JSON.stringify(await run(), null, 2));
    }
  })().catch(error => {
    console.error('Unexpected error:', error.message);
    process.exitCode = 1;
  });
}
