const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const pg = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydb',
    password: '1234',
    port: 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Database connected successfully:', result.rows[0].now);
    }
});

app.use(express.static('wwwroot'));
app.use(express.json());

// User registration
app.post('/api/users', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const isAdmin = username.toLowerCase() === 'admin';

        const result = await pool.query(
            'INSERT INTO Users (Username, Password, IsAdmin) VALUES ($1, $2, $3) RETURNING UserID',
            [username, hashedPassword, isAdmin]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.rows[0].userid });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await pool.query(
            'SELECT UserID, Password, IsAdmin FROM Users WHERE Username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({
            message: 'Login successful',
            isAdmin: user.isadmin,
            username: username,
            userId: user.userid,
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// Get all books (no filtering for lent status)
// Get all books (filter out lent books)
app.get('/api/books', async (req, res) => {
    try {
        // Use a LEFT JOIN to include books even if they don't have a match in LentBooks
        const result = await pool.query(`
            SELECT b.* 
            FROM Books b
            LEFT JOIN LentBooks lb ON b.bookId = lb.bookId
            WHERE lb.bookId IS NULL  -- Filter out books that are currently lent
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Add a book (admin only)
app.post('/api/books', async (req, res) => {
    const { title, author } = req.body;
    const userId = req.header('userId'); // Get userId from the request header

    try {
        // Validate input
        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }

        // Check if the user is an admin (you should have middleware for this)
        const isAdminResult = await pool.query('SELECT IsAdmin FROM Users WHERE UserID = $1', [userId]);
        if (isAdminResult.rows.length === 0 || !isAdminResult.rows[0].isadmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await pool.query(
            'INSERT INTO Books (Title, Author) VALUES ($1, $2) RETURNING BookID',
            [title, author]
        );
        //const newBookId = result.rows[0].book_id;

        //// Update the bookId field with the generated book_id
        //await pool.query(
        //    'UPDATE Books SET bookId = $1 WHERE book_id = $1', // Set bookId = book_id
        //    [newBookId]
        //);

        res.status(201).json({ message: 'Book added successfully', bookId: result.rows[0].bookid });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});


// Get book details by ID
app.get('/api/books/:id', async (req, res) => {
    const bookId = parseInt(req.params.id);

    try {
        const result = await pool.query('SELECT * FROM Books WHERE BookID = $1', [bookId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).json({ error: 'Failed to fetch book details' });
    }
});

// Get reviews for a book by ID
app.get('/api/books/:id/reviews', async (req, res) => {
    const bookId = parseInt(req.params.id);

    try {
        const result = await pool.query(
            `SELECT r.ReviewText, u.Username 
              FROM Reviews r
              JOIN Users u ON r.UserID = u.UserID
              WHERE r.BookID = $1`,
            [bookId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching book reviews:', error);
        res.status(500).json({ error: 'Failed to fetch book reviews' });
    }
});

// Add a review for a book
app.post('/api/books/:id/reviews', async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { text } = req.body;
    const userId = req.header('userId'); // Get userId from the request header

    try {
        // Validate input
        if (!text) {
            return res.status(400).json({ error: 'Review text is required' });
        }

        await pool.query(
            'INSERT INTO Reviews (BookID, UserID, ReviewText) VALUES ($1, $2, $3)',
            [bookId, userId, text]
        );
        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// Get lent books (using LentBooks table)
app.get('/api/lent-books', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.Title, b.Author, u.Username, lb.LentAt
FROM LentBooks lb, Users u, Books b
WHERE u.userid = lb.userid AND lb.bookId = b.bookId`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lent books:', error);
        res.status(500).json({ error: 'Failed to fetch lent books' });
    }
});

app.post('/api/books/:id/lent', async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { username } = req.body;

    try {
        // Check if the book exists
        const bookExistsResult = await pool.query('SELECT 1 FROM Books WHERE bookId = $1', [bookId]);
        if (bookExistsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if the book is already lent out
        const isLentResult = await pool.query('SELECT 1 FROM LentBooks WHERE bookId = $1', [bookId]);
        if (isLentResult.rows.length > 0) {
            return res.status(400).json({ error: 'Book is already lent out' });
        }

        // Get the UserID based on the provided username
        const userIdResult = await pool.query('SELECT UserID FROM Users WHERE Username = $1', [username]);
        if (userIdResult.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }
        const userId = userIdResult.rows[0].userid;

        // Now you have the UserID, insert into LentBooks
        await pool.query(
            'INSERT INTO LentBooks (BookID, UserID) VALUES ($1, $2)',
            [bookId, userId]
        );

        res.json({ message: 'Book marked as lent' });
    } catch (error) {
        console.error('Error marking book as lent:', error.message);
        res.status(500).json({ error: 'Failed to mark book as lent' });
    }
});

// Mark a book as returned
app.post('/api/books/:id/returned', async (req, res) => {
    const bookId = parseInt(req.params.id);
    const userId = req.header('userId'); // Get userId from the request header

    try {
        await pool.query(
            'DELETE FROM LentBooks WHERE BookID = $1',
            [bookId]
        );

        res.json({ message: 'Book marked as returned' });
    } catch (error) {
        console.error('Error marking book as returned:', error);
        res.status(500).json({ error: 'Failed to mark book as returned' });
    }
});

// Route for the main/home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/wwwroot/index.html');
});

// Route for the book lending page
app.get('/book-lending', (req, res) => {
    res.sendFile(__dirname + '/wwwroot/book-lending.html');
});

// Route for the admin page
app.get('/admin.html', (req, res) => {
    res.sendFile(__dirname + '/wwwroot/admin.html');
});

// Route for the new admin options page
//app.get('/admin-options', (req, res) => {
//    res.sendFile(__dirname + '/wwwroot/admin-options.html');
//});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Trying another port...`);
    } else {
        console.error('Server error:', err);
    }
});