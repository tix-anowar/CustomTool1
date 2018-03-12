//region Import
const fs = require('fs');
const parseXlsx = require('excel');
const sanitize = require("sanitize-filename");
const request = require('request');
const moment = require('moment');
const config = require('../../../config.json');
let Database = require('./../../utility/Database');
let db;

let _self;
const reconciliation_file_url = __dirname + "/../../actual_files/daily_reconsilation_report/Daily_Reconciliation_Report.csv";
//endregion

module.exports = class DailyReconciliation {
    constructor() {
        _self = this;
    }

    test(accessToken, NIUID) {
        let actual_file_data = fs.readFileSync(reconciliation_file_url).toString().split("\n");
        for (let i = 0; i < actual_file_data.length - 1; i++) {
            let line = actual_file_data[i];
            const actual_data = line.split(",");
            let invoiceNumber = actual_data[1];
            if (invoiceNumber == (NIUID.split("-")[1] + "-" + NIUID.split("-")[2])) {
                request({
                    url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + NIUID,
                    auth: {
                        'bearer': accessToken
                    }
                }, function (err, res) {
                    let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
                    if (invoiceLedgers.length) {
                        let invoice = invoiceLedgers[0];
                        let lastInvoice = invoiceLedgers[(invoiceLedgers.length - 1)];
                        let invoiceValue = invoice.invoiceValue;
                        let invoiceNumber = NIUID.split("-")[1] + "-" + NIUID.split("-")[2];
                        let cashApplied = _self.cashApplied(invoiceLedgers);
                        let dilutionApplied = _self.dilutionApplied(invoiceLedgers);
                        let remainingBalance = invoiceValue - (cashApplied + dilutionApplied + _self.repurchaseApplied(invoiceLedgers));
                        console.log("Invoice Number: Actual,  Expected : " + actual_data[1] + ", " + invoiceNumber + " == " + ((actual_data[1] == invoiceNumber) ? "Passed" : "Failed"));
                        console.log("TradeIX Ref Number: Actual,  Expected : " + actual_data[2] + ", " + invoice.originationNetwork +"|" + NIUID + "|" + invoiceNumber + " == " + ((actual_data[2] == (invoice.originationNetwork +"|" + NIUID + "|" + invoiceNumber)) ? "Passed" : "Failed"));
                        console.log("Supplier Ref: Actual,  Expected : " + actual_data[3] + ", " + config.CONSTANT.SenderId + " == " + ((actual_data[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"));
                        console.log("Buyer Ref: Actual,  Expected : " + actual_data[4] + ", " + config.CONSTANT.BuyerId + " == " + ((actual_data[4] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"));
                        console.log("Funder Ref: Actual,  Expected : " + actual_data[5] + ", " + config.CONSTANT.Funder + " == " + ((actual_data[5] == config.CONSTANT.Funder) ? "Passed" : "Failed"));
                        console.log("Invoice Date: Actual,  Expected : " + actual_data[6] + ", " + invoice.invoiceDate + " == " + ((actual_data[6] == invoice.invoiceDate) ? "Passed" : "Failed"));
                        console.log("Invoice Currency: Actual,  Expected : " + actual_data[7] + ", " + config.CONSTANT.Currency + " == " + ((actual_data[7] == config.CONSTANT.Currency) ? "Passed" : "Failed"));
                        console.log("Invoice Amount: Actual,  Expected : " + actual_data[8] + ", " + invoiceValue + " == " + ((actual_data[8] == invoiceValue) ? "Passed" : "Failed"));
                        console.log("Cash Applied: Actual,  Expected : " + actual_data[9] + ", " + cashApplied + " == " + ((actual_data[9] == cashApplied) ? "Passed" : "Failed"));
                        console.log("Dilutions Applied: Actual,  Expected : " + actual_data[10] + ", " + dilutionApplied + " == " + ((actual_data[10] == dilutionApplied)  ? "Passed" : "Failed"));
                        console.log("Remaining Balance: Actual,  Expected : " + actual_data[11] + ", " + remainingBalance + " == " + ((actual_data[11] == remainingBalance)  ? "Passed" : "Failed"));
                        console.log("Insurable Amount: Actual,  Expected : " + actual_data[12] + ", " + lastInvoice.eligibleValue  + " == " + ((actual_data[12] == lastInvoice.eligibleValue)  ? "Passed" : "Failed"));
                        //console.log("Funding Requested Amount: Actual,  Expected : " + actual_data[13] + ", " + fundingCharge.insurerVat(invoiceValue) + " == " + ((actual_data[12] - fundingCharge.insurerVat(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        //console.log("Funding Confirmed Amount: Actual,  Expected : " + actual_data[14] + ", " + fundingCharge.servicerGrossFee(invoiceValue) + " == " + ((actual_data[13] - fundingCharge.servicerGrossFee(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        //console.log("Funded Date: Actual,  Expected : " + actual_data[15] + ", " + fundingCharge.servicerNetFee(invoiceValue) + " == " + ((actual_data[14] - fundingCharge.servicerNetFee(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        //console.log("Settlement Requested Amount: Actual,  Expected : " + actual_data[16] + ", " + fundingCharge.servicerVat(invoiceValue) + " == " + ((actual_data[15] - fundingCharge.servicerVat(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        //console.log("Settlement Confirmed Amount: Actual,  Expected : " + actual_data[17] + ", " + fundingCharge.networkGrossFee(invoiceValue) + " == " + ((actual_data[16] - fundingCharge.networkGrossFee(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        //console.log("Funded Remaining: Actual,  Expected : " + actual_data[18] + ", " + fundingCharge.networkNetFee(invoiceValue) + " == " + ((actual_data[17] - fundingCharge.networkNetFee(invoiceValue)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Due Date: Actual,  Expected : " + actual_data[19] + ", " + invoice.paymentDueDate + " == " + ((actual_data[18] == invoice.paymentDueDate) ? "Passed" : "Failed"));
                        console.log("Funding Status: Actual,  Expected : " + actual_data[20] + ", " + invoiceLedgers[(invoiceLedgers.length - 1)].status + " == " + ((actual_data[19] == invoiceLedgers[(invoiceLedgers.length - 1)].status) ? "Passed" : "Failed"));
                        console.log("Forecast Settlement Date: Actual,  Expected : " + actual_data[21] + ", " + invoice.settlementDate + " == " + ((actual_data[21] == invoice.settlementDate) ? "Passed" : "Failed"));
                        console.log("Insurer: Actual,  Expected : " + actual_data[22] + ", " + config.CONSTANT.REFERENCE + " == " + ((actual_data[22] == config.CONSTANT.REFERENCE) ? "Passed" : "Failed"));

                        db = new Database();
                        db.add("Invoice Number", actual_data[1], invoiceNumber, ((actual_data[1] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("TradeIX Ref Number", actual_data[2], invoice.originationNetwork +"|" + NIUID + "|" + invoiceNumber, ((actual_data[2] == (invoice.originationNetwork +"|" + NIUID + "|" + invoiceNumber)) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Supplier Ref", actual_data[3], config.CONSTANT.SenderId, ((actual_data[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Buyer Ref", actual_data[4], config.CONSTANT.BuyerId, ((actual_data[4] == config.CONSTANT.BuyerId) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Funder Ref", actual_data[5], config.CONSTANT.FunderRef, ((actual_data[5] == config.CONSTANT.FunderRef) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Invoice Date", actual_data[6].split(".")[0], invoice.invoiceDate.split(".")[0], ((actual_data[6].split(".")[0] == invoice.invoiceDate.split(".")[0]) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Invoice Currency", actual_data[7], config.CONSTANT.Currency, ((actual_data[7] == config.CONSTANT.Currency) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Invoice Amount", actual_data[8], invoiceValue, ((actual_data[8] == invoiceValue) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Cash Applied", actual_data[9], cashApplied, ((actual_data[9] == cashApplied) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Dilutions Applied", actual_data[10], dilutionApplied, ((actual_data[10] == dilutionApplied)  ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Remaining Balance", actual_data[11], remainingBalance, ((actual_data[11] == remainingBalance)  ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Insurable Amount", actual_data[12], lastInvoice.eligibleValue, ((actual_data[12] == lastInvoice.eligibleValue) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Funding Requested Amount", actual_data[13], invoiceNumber, ((actual_data[13] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                       // db.add("Funding Confirmed Amount", actual_data[14], invoiceNumber, ((actual_data[14] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Funded Date", actual_data[15], invoiceNumber, ((actual_data[15] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Settlement Requested Amount", actual_data[16], invoiceNumber, ((actual_data[16] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Settlement Confirmed Amount", actual_data[17], invoiceNumber, ((actual_data[17] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Funded Remaining", actual_data[18], invoiceNumber, ((actual_data[18] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Due Date", actual_data[19].split(".")[0], invoice.paymentDueDate.split(".")[0], ((actual_data[19].split(".")[0] == invoice.paymentDueDate.split(".")[0]) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Funding Status", actual_data[20], invoiceLedgers[(invoiceLedgers.length - 1)].status, ((actual_data[20] == invoiceLedgers[(invoiceLedgers.length - 1)].status) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        db.add("Forecast Settlement Date", actual_data[21].split(".")[0], invoice.settlementDate.split(".")[0], ((actual_data[21].split(".")[0] == invoice.settlementDate.split(".")[0]) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);
                        //db.add("Insurer", actual_data[22], config.CONSTANT.REFERENCE, ((actual_data[22] == config.CONSTANT.REFERENCE) ? "Passed" : "Failed"), config.DATABASE.Daily_Reconciliation);

                    }
                });
            }
        }
    }

    dilutionApplied(invoiceLedgers) {
        let settledArray = invoiceLedgers.filter(object => (object.status === 'TradePaymentRequestAcknowledged')||(object.status === 'SettlementNotificationSent'));
        let dilutionApplied = [];
        for(let i=1; i<settledArray.length; i++) {
            if (((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions) != 0) && ((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments) == 0) && (settledArray[i].totalOutstanding != 0)) {
                dilutionApplied.push((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions));
            }
        }
        return dilutionApplied.reduce((a, b) => a + b, 0);
    }

    cashApplied(invoiceLedgers) {
        let settledArray = invoiceLedgers.filter(object => (object.status === 'TradePaymentRequestAcknowledged')||(object.status === 'SettlementNotificationSent'));
        let cashApplied = [];
        for(let i=1; i<settledArray.length; i++) {
            if (((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions) == 0) && ((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments) != 0) && (settledArray[i].totalOutstanding != 0)) {
                cashApplied.push((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments));
            }
        }
        return cashApplied.reduce((a, b) => a + b, 0);
    }

    repurchaseApplied(invoiceLedgers) {
        let settledArray = invoiceLedgers.filter(object => (object.status === 'TradePaymentRequestAcknowledged')||(object.status === 'SettlementNotificationSent'));
        let repurchaseApplied = [];
        for(let i=1; i<settledArray.length; i++) {
            if (((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions) != 0) && ((settledArray[i].invoicePayments - settledArray[(i - 1)].invoicePayments) == 0) && (settledArray[i].totalOutstanding == 0)) {
                repurchaseApplied.push((settledArray[i].invoiceDilutions - settledArray[(i - 1)].invoiceDilutions));
            }
        }
        return repurchaseApplied.reduce((a, b) => a + b, 0);
    }

};