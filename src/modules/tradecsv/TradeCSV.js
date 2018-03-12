//region Import
const fs = require('fs');
const sanitize = require("sanitize-filename");
const request = require('request');
let Database = require('./../../utility/Database');
const config = require('../../../config.json');
let _self;
let db;
const csv_url = __dirname + "/../../actual_files/trade_csv/TradePayment_SCB.csv";
//endregion

module.exports = class TradeCSV {
    constructor() {
        _self = this;
    }

    test(accessToken, NIUID) {
        let csvArray = fs.readFileSync(csv_url).toString().split("\n");
        for (let i = 0; i < csvArray.length - 1; i++) {
            let line = csvArray[i];
            const value = sanitize(line).split(",");
            let networkInvoiceUUID = value[1].split("+")[1];
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
                        let expected_docno = (invoice.originationNetwork + "+" + invoice.networkInvoiceUid + "+" + invoice.invoiceNumber);
                        let docDate = invoice.documentConfirmed.split("T")[0].split("-").join("");
                        let paymentDueDate = invoice.paymentDueDate.split("T")[0].split("-").join("");
                        console.log("Record Type: Actual,  Expected : " + value[0] + ", " + config.CONSTANT.RecordType + " == " + ((value[0] == config.CONSTANT.RecordType) ? "Passed" : "Failed"));
                        console.log("Doc NO: Actual,  Expected : " + value[1] + ", " + expected_docno + " == " + ((value[1] == expected_docno) ? "Passed" : "Failed"));
                        console.log("Doc Type: Actual,  Expected : " + value[2] + ", " + config.CONSTANT.DocType + " == " + ((value[2] == config.CONSTANT.DocType) ? "Passed" : "Failed"));
                        console.log("SenderId: Actual,  Expected : " + value[3] + ", " + config.CONSTANT.SenderId + " == " + ((value[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"));
                        console.log("Doc Date: Actual,  Expected : " + value[4] + ", " + docDate + " == " + ((value[3] == docDate) ? "Passed" : "Failed"));
                        console.log("BuyerId: Actual,  Expected : " + value[5] + ", " + config.CONSTANT.BuyerId + " == " + ((value[5] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"));
                        console.log("SupplierId: Actual,  Expected : " + value[6] + ", " + config.CONSTANT.SenderId + " == " + ((value[6] == config.CONSTANT.SenderId) ? "Passed" : "Failed"));
                        console.log("Currency: Actual,  Expected : " + value[7] + ", " + config.CONSTANT.Currency + " == " + ((value[7] == config.CONSTANT.Currency) ? "Passed" : "Failed"));
                        console.log("TotalAmount: Actual,  Expected : " + value[8] + ", " + invoice.invoiceValue + " == " + ((value[8] == invoice.invoiceValue) ? "Passed" : "Failed"));
                        console.log("VenderId: Actual,  Expected : " + value[10] + ", " + config.CONSTANT.BuyerId + " == " + ((value[10] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"));
                        console.log("BuyerName: Actual,  Expected : " + value[12] + ", " + config.CONSTANT.BuyerName + " == " + ((value[12] == config.CONSTANT.BuyerName) ? "Passed" : "Failed"));
                        console.log("SupplierName: Actual,  Expected : " + value[13] + ", " + config.CONSTANT.SupplierName + " == " + ((value[13] == config.CONSTANT.SupplierName) ? "Passed" : "Failed"));
                        console.log("Payment Due Date: Actual,  Expected : " + value[15] + ", " + paymentDueDate + " == " + ((value[15] == paymentDueDate) ? "Passed" : "Failed"));

                        db = new Database();
                        db.add("Record Type", value[0], config.CONSTANT.RecordType, ((value[0] == config.CONSTANT.RecordType) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("Doc No", value[1], expected_docno, ((value[1] == expected_docno) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("Doc Type", value[2], config.CONSTANT.DocType, ((value[2] == config.CONSTANT.DocType) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("SenderId", value[3], config.CONSTANT.SenderId, ((value[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("Doc Date", value[4], docDate, ((value[4] == docDate) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("BuyerId", value[5], config.CONSTANT.BuyerId, ((value[5] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("SupplierId", value[6], config.CONSTANT.SenderId, ((value[6] == config.CONSTANT.SenderId) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("Currency", value[7], config.CONSTANT.Currency, ((value[7] == config.CONSTANT.Currency) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("TotalAmount", value[8], invoice.invoiceValue, ((value[8] == invoice.invoiceValue) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("VenderId", value[10], config.CONSTANT.BuyerId, ((value[10] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("BuyerName", value[12], config.CONSTANT.BuyerName, ((value[12] == config.CONSTANT.BuyerName) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("SupplierName", value[13], config.CONSTANT.SupplierName, ((value[13] == config.CONSTANT.SupplierName) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                        db.add("Payment Due Date", value[15], paymentDueDate, ((value[15] == paymentDueDate) ? "Passed" : "Failed"), config.DATABASE.Trade_Csv);
                    }
                });
            }
        }
    }

};