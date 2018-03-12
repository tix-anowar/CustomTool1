//region Import
const fs = require('fs');
const split = require('split');
let mysql = require('mysql');
const config = require('../../config.json');
let con;
const dateTime = require('date-time');
//endregion

module.exports = class Database {
    constructor() {
        con = mysql.createConnection(config.DATABASE.DB_CONFIG);
        con.connect(function (err) {
            if (err) throw err;
            //console.log("Database Connected!");
        });
    }

    add(field, actual, expected, status, type) {
        const sql = "INSERT INTO test_report (field, actual, expected, status, type) VALUES ('" + field + "', '" + actual + "', '" + expected + "', '" + status + "', '" + type + "')";
        con.query(sql, function (err, result) {
            if (err) throw err;
        });
    }

    getTestReport(callback) {
        con.query("SELECT * FROM test_report", function (err, result) {
            if (err) {
                callback({status: false, data: result, message: err});
            }
            if (result.length > 0) {
                callback({status: true, data: result});
            } else {
                callback({status: false, data: result, message: 'No Data Found!'});
            }
        });
    }

    insertCsvData(path, res) {
        fs.createReadStream(path, 'utf8').pipe(split())
            .on('data', function (line) {
                if (line.length > 0) {
                    const value = line.split(",");
                    const sql = "INSERT INTO employee (name, email, age, salary, dept) VALUES ('" + value[0] + "', '" + value[1] + "', '" + value[2] + "', '" + value[3] + "', '" + value[4] + "')";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                    });
                }
            }).on('end', function () {
            const sql = "INSERT INTO csv (name, created) VALUES ('" + path.substr(path.lastIndexOf("/")+1) + "', '" + dateTime() + "')";
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
            res.redirect("/managecsv");
        });
    }

    getCsvData(callback) {
        con.query("SELECT * FROM employee", function (err, result) {
            if (err) {
                callback({status: false, data: result, message: err});
            }
            if (result.length > 0) {
                callback({status: true, data: result});
            } else {
                callback({status: false, data: result, message: 'No Data Found!'});
            }
        });
    }

    getCsvList(callback) {
        con.query("SELECT * FROM csv ORDER BY id DESC", function (err, result) {
            if (err) {
                callback({status: false, data: result, message: err});
            }
            if (result.length > 0) {
                callback({status: true, data: result});
            } else {
                callback({status: false, data: result, message: 'No Data Found!'});
            }
        });
    }

    deleteCsv(callback) {
        con.query("SELECT * FROM csv ORDER BY id DESC", function (err, result) {
            if (err) {
                callback({status: false, data: result, message: err});
            }
            if (result.length > 0) {
                callback({status: true, data: result});
            } else {
                callback({status: false, data: result, message: 'No Data Found!'});
            }
        });
    }

};