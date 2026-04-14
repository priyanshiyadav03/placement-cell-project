const mysql = require('mysql2');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'priyansi03', // your MySQL password
  database: 'placement_cell'
});

db.connect((err) => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL Database');
  }
});

module.exports = db;
