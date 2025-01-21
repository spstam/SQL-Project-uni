# Installation and Execution Instructions

This document describes the steps required to install and run the application.

## Prerequisites

* Node.js (Installation: [nodejs.org](https://nodejs.org/)) and npm (Node Package Manager)

## Steps

1. **Install PostgreSQL:**

   * Download PostgreSQL version 15 from the official website: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   * Follow the installer's instructions to complete the installation.
   * During installation, set a password for the "postgres" user and make a note of it.

2. **Create Database:**

   * Open psql by typing `psql -U postgres` in the terminal.
   * Enter the password you set.
   * Create a new database named "mydb" by running the command:

     ```sql
     CREATE DATABASE mydb;
     ```

   * Connect to the new database:

     ```sql
     \c mydb
     ```

   * Run the provided SQL script to create the tables (`schema.sql`).

     ```sql
     \i schema.sql
     ```

3. **(Install Node.js modules):**

   * If any npm library is missing,
   * Open a terminal in the project folder.
   * Run the command `npm install` to install the necessary libraries defined in `package.json`.

4. **Run the application:**

   * Make sure the database connection details in the `server.js` file are correct (see below).
   * Run the command `node server.js` to start the server.
   * Open a web browser and navigate to `http://localhost:3000`.

## Database Connection Details

The database connection details are located in the `server.js` file.  Confirm or modify the following:

* **User:** postgres
* **Password:** 1234  (Replace with your actual password)
* **Database Name:** mydb
* **Port:** 5432

## Notes

* The username "admin" is predefined to have more capabilities in the application.
* Make sure you have Node.js and npm (Node Package Manager) installed on your computer.
