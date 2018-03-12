//region Import
const fs = require('fs');
var parseXlsx = require('excel');
const sanitize = require("sanitize-filename");
const request = require('request');
const config = require('../../../config.json');
let Database = require('./../../utility/Database');
let _self;
let db;
const cash_file_url = __dirname + "/../../actual_files/cash_settlement/CashSettlement.xlsx";
//endregion

module.exports = class CashSettlement {
    constructor() {
        _self = this;
    }

    test(accessToken, NIUID) {
        let files = fs.readdirSync(__dirname + "/../../actual_files/cash_settlement/");
        parseXlsx(cash_file_url, function (err, data) {
            if (err) throw err;
            // data is an array of arrays
            for (let i = 1; i < data.length > 0; i++) {
                if (data[i][0].split("+")[1] == NIUID) {
                    let actual_data = data[i];
                    request({
                        url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + NIUID ,
                        auth: {
                            'bearer': accessToken
                        }
                    }, function (err, res) {
                        let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
                        let allocationAmount = _self.getAllocationAmount(invoiceLedgers);
                        if (invoiceLedgers.length) {
                            let invoice = invoiceLedgers[0];
                            console.log("Document Number: Actual,  Expected : " + actual_data[0].split("+")[1] + ", " + invoice.networkInvoiceUid + " == " + ((actual_data[0].split("+")[1] == invoice.networkInvoiceUid) ? "Passed" : "Failed"));
                            console.log("Document CCY: Actual,  Expected : " + actual_data[1] + ", " + config.CONSTANT.Currency + " == " + ((actual_data[1] == config.CONSTANT.Currency) ? "Passed" : "Failed"));
                            console.log("Document Amt: Actual,  Expected : " + actual_data[2] + ", " + invoice.invoiceValue + " == " + ((actual_data[2] == invoice.invoiceValue) ? "Passed" : "Failed"));
                            console.log("Supplier Id: Actual,  Expected : " + actual_data[3] + ", " + config.CONSTANT.SenderId + " == " + ((actual_data[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"));
                            console.log("Supplier Name: Actual,  Expected : " + actual_data[4] + ", " + config.CONSTANT.SupplierName + " == " + ((actual_data[4] == config.CONSTANT.SupplierName) ? "Passed" : "Failed"));
                            console.log("Buyer Id: Actual,  Expected : " + actual_data[5] + ", " + config.CONSTANT.BuyerId + " == " + ((actual_data[5] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"));
                            console.log("Buyer Name: Actual,  Expected : " + actual_data[6] + ", " + config.CONSTANT.BuyerName + " == " + ((actual_data[6] == config.CONSTANT.BuyerName) ? "Passed" : "Failed"));
                            console.log("Product Code: Actual,  Expected : " + actual_data[7] + ", " + config.CONSTANT.ProductCode + " == " + ((actual_data[7] == config.CONSTANT.ProductCode) ? "Passed" : "Failed"));
                            console.log("Allocation Amount: Actual,  Expected : " + actual_data[8] + ", " + allocationAmount + " == " + ((actual_data[8] == allocationAmount) ? "Passed" : "Failed"));
                            console.log("Final Payment: Actual,  Expected : " + actual_data[9] + ", " + "N" + " == " + ((actual_data[9] == "N") ? "Passed" : "Failed"));

                            db = new Database();
                            db.add("Document Number", actual_data[0].split("+")[1], invoice.networkInvoiceUid, ((actual_data[0].split("+")[1] == invoice.networkInvoiceUid) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Document CCY", actual_data[1], config.CONSTANT.Currency, ((actual_data[1] == config.CONSTANT.Currency) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Document Amt", actual_data[2], invoice.invoiceValue, ((actual_data[2] == invoice.invoiceValue) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Supplier Id", actual_data[3], config.CONSTANT.SenderId, ((actual_data[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Supplier Name", actual_data[4], config.CONSTANT.SupplierName, ((actual_data[4] == config.CONSTANT.SupplierName) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Buyer Id", actual_data[5], config.CONSTANT.BuyerId, ((actual_data[5] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Buyer Name", actual_data[6], config.CONSTANT.BuyerName, ((actual_data[6] == config.CONSTANT.BuyerName) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Product Code", actual_data[7], config.CONSTANT.ProductCode, ((actual_data[7] == config.CONSTANT.ProductCode) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Allocation Amount", actual_data[8], allocationAmount, ((actual_data[8] == allocationAmount) ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);
                            db.add("Final Payment", actual_data[9], "N", ((actual_data[9] == "N") ? "Passed" : "Failed"), config.DATABASE.Buyer_Settlement);

                        }
                    });
                }
            }
        });
    }

    getAllocationAmount(invoiceLedgers) {
        /*let allocationAmount = 70000;
        return allocationAmount;*/
        let settledArray = invoiceLedgers.filter(object => (object.status === 'TradePaymentRequestAcknowledged')||(object.status === 'SettlementNotificationSent'));
        let cashApplied = [];
        for(let i=1; i<settledArray.length; i++) {
            if (((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions) == 0) && ((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments) != 0) && (settledArray[i].totalOutstanding != 0)) {
                cashApplied.push((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments));
            }
        }
        return cashApplied.reduce((a, b) => a + b, 0);
    }
};