-- Table: Users
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Password TEXT NOT NULL, -- Changed to TEXT for potentially longer hashed passwords
    IsAdmin BOOLEAN DEFAULT FALSE
);

-- Table: Books
CREATE TABLE Books (
    BookID SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Author VARCHAR(255) NOT NULL,
    IsLent BOOLEAN DEFAULT FALSE
);

-- Table: Reviews
CREATE TABLE Reviews (
    ReviewID SERIAL PRIMARY KEY,
    BookID INT NOT NULL, -- Added NOT NULL constraint
    UserID INT NOT NULL, -- Added NOT NULL constraint 
    ReviewText TEXT,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Table: LentBooks 
CREATE TABLE LentBooks (
    LentBookID SERIAL PRIMARY KEY,
    BookID INT NOT NULL, -- Added NOT NULL constraint
    UserID INT NOT NULL, -- Added NOT NULL constraint
    LentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON Users (Username); -- Index for faster username lookups
CREATE INDEX idx_reviews_bookid ON Reviews (BookID); -- Index for faster book reviews retrieval
