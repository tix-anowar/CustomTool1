//region Import
const fs = require('fs');
const sanitize = require("sanitize-filename");
const request = require('request');
const moment = require('moment');
let Database = require('./../../utility/Database');
const config = require('../../../config.json');
let FundingCharge = require("./../../utility/FundingCharge");
let _self;
let db;
let fundingCharge;
const exception_report_url = __dirname + "/../../actual_files/exception_report/Exception_Report.csv";
//endregion

module.exports = class ExceptionReport {
    constructor() {
        _self = this;
        fundingCharge = new FundingCharge();
    }

    test(accessToken, NIUID) {
        let csvArray = fs.readFileSync(exception_report_url).toString().split("\n");
        for (let i = 1; i < csvArray.length - 1; i++) {
            const value = csvArray[i].split(",");
            const actual_value = csvArray[(i + 1)].split(",");
            let networkInvoiceUUID = value[3].split("+")[1];
            if (networkInvoiceUUID == NIUID) {
                request({
                    url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + NIUID + '&filterField2=InvoiceVersion&filterOperator2=EQUALS&filterValue2=1.0',
                    auth: {
                        'bearer': accessToken
                    }
                }, function (err, res) {
                    let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
                    if (invoiceLedgers.length) {
                        let invoice = invoiceLedgers[0];
                        let ledger_niuid = (invoice.originationNetwork + "|" + invoice.networkInvoiceUid + "|" + invoice.invoiceNumber);
                        let chargeAmount = fundingCharge.chargeAmount(invoice.invoiceValue);
                        db = new Database();

                        if(actual_value[3].length != 0) {
                            console.log("Document Number: Actual,  Expected, Suggested : " + value[3] + ", " + ledger_niuid +  actual_value[3] + " == " + (((actual_value[3] != value[3]) && (actual_value[3] == ledger_niuid) ) ? "Passed" : "Failed"));
                            db.add("Document Number", value[3], ledger_niuid + "," + actual_value[3], (((actual_value[3] != value[3]) && (actual_value[3] == ledger_niuid) ) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[4].length != 0) {
                            console.log("Buyer Name: Actual,  Expected, Suggested : " + value[4] + ", " + invoice.buyerName +  actual_value[4] + " == " + (((actual_value[4] != value[4]) && (actual_value[4] == invoice.buyerName)) ? "Passed" : "Failed"));
                            db.add("Buyer Name", value[4], invoice.buyerName + "," + actual_value[4], (((actual_value[4] != value[4]) && (actual_value[4] == invoice.buyerName)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[5].length != 0) {
                            console.log("Currency: Actual,  Expected, Suggested : " + value[5] + ", " + invoice.currency +  actual_value[5] + " == " + (((actual_value[5] != value[5]) && (actual_value[5] == invoice.currency)) ? "Passed" : "Failed"));
                            db.add("Currency", value[5], invoice.currency + "," + actual_value[5], (((actual_value[5] != value[5]) && (actual_value[5] == invoice.currency)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[6].length != 0) {
                            console.log("Original Amount: Actual,  Expected, Suggested : " + value[6] + ", " + invoice.invoiceValue +  actual_value[6] + " == " + (((actual_value[6] != value[6]) && (actual_value[6] == invoice.invoiceValue)) ? "Passed" : "Failed"));
                            db.add("Original Amount", value[6], invoice.invoiceValue + "," + actual_value[6], (((actual_value[6] != value[6]) && (actual_value[6] == invoice.invoiceValue)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[11].length != 0) {
                            console.log("Original Amount: Actual,  Expected, Suggested : " + value[11] + ", " + invoice.totalOutstanding +  actual_value[11] + " == " + (((actual_value[11] != value[11]) && (value[11] == invoice.totalOutstanding)) ? "Passed" : "Failed"));
                            db.add("Outstanding", value[11], invoice.totalOutstanding + "," + actual_value[11], (((actual_value[11] != value[11]) && (actual_value[11] == invoice.totalOutstanding)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[15].length != 0) {
                            console.log("Prepay Currency: Actual,  Expected, Suggested : " + value[15] + ", " + invoice.currency +  actual_value[15] + " == " + (((actual_value[15] != value[15]) && (actual_value[15] == invoice.currency)) ? "Passed" : "Failed"));
                            db.add("Prepay Currency", value[15], invoice.currency + "," + actual_value[15], (((actual_value[15] != value[15]) && (actual_value[15] == invoice.currency)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[16].length != 0) {
                            console.log("Prepay Amount: Actual,  Expected, Suggested : " + value[16] + ", " + invoice.invoiceValue + actual_value[16] + " == " + (((actual_value[16] != value[16]) && (actual_value[16] == invoice.invoiceValue)) ? "Passed" : "Failed"));
                            db.add("Prepay Amount", value[16], invoice.invoiceValue + "," + actual_value[16], (((actual_value[16] != value[16]) && (actual_value[16] == invoice.invoiceValue)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                        if(actual_value[22].length != 0) {
                            console.log("ChargeAmount: Actual,  Expected, Suggested : " + value[22] + ", " + chargeAmount + ", " + actual_value[22] + " == " + (((actual_value[22] != value[22]) && (actual_value[22] == chargeAmount)) ? "Passed" : "Failed"));
                            db.add("ChargeAmount", value[22], chargeAmount + "," + actual_value[22], (((actual_value[22] != value[22]) && (actual_value[22] == chargeAmount)) ? "Passed" : "Failed"), config.DATABASE.Exception);
                        }
                    }
                });
            }
        }
    }

};