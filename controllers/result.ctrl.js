const router = require("express");
const mysql = require("mysql2");
const user = require("../models/users");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'diss'
  });
  db.connect();

const scanResult = async(req ,res) => {
    db.query('SELECT * FROM scan', function(err, result){
        var dataList = [];
        for (var diss of result){
            dataList.push(diss)
        };
    })
    return;
}


module.exports = {
    scanResult,
}
