/* global module */

//
//@Mendon Ashwini
//

var mysql = require('mysql');

// First you need to create a connection to the db
 var con = mysql.createConnection({
   host: "localhost",
   user: 'root',
     password: 'root',
     database: 'pingova'
 });
//var con = mysql.createConnection({
//  host: 'localhost',
//  user: 'pingova',
//    password: 'pNUNsGV8KRhPpEfM',
//    database: 'pingova'
//});

con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

// var pool = mysql.createPool({
//    connectionLimit: 100, //important
//    host: 'localhost',
//    user: 'root',
//    password: 'root',
//    database: 'pingova',
//    debug: false
//});
//
//var connection;
//pool.getConnection(function (err, connection) {
//    this.connection=connection;
//});

module.exports = con;

