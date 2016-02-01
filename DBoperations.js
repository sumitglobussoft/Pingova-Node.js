//
//@Mendon Ashwini
//

var mysql = require('mysql');

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: 'root',
    password: '',
    database: 'pingova'
});

con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

module.exports = con;

