const mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'users' // Change to test new environment
});
connection.connect();

module.exports = connection;