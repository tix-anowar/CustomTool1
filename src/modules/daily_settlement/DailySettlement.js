//region Import
const fs = require('fs');
const sanitize = require("sanitize-filename");
const request = require('request');
let Database = require('./../../utility/Database');
const config = require('../../../config.json');
let _self;
let db;
let dilutionArray = [];
let cashArray = [];
let settlementAmountArray = [];
const daily_settlement_report_url = __dirname + "/../../actual_files/daily_settlement_report/Daily_Settlement_Report.csv";
//endregion

module.exports = class DailySettlement {
    constructor() {
        _self = this;
    }

    test(accessToken, NIUID) {
        request({
            url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + NIUID,
            auth: {
                'bearer': accessToken
            }
        }, function (err, res) {
            let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
            cashArray = [];
            dilutionArray = [];
            settlementAmountArray = [];

            if (invoiceLedgers.length) {
                let csvArray = fs.readFileSync(daily_settlement_report_url).toString().split("\n");
                let settledArray = _self.filterSettlement(invoiceLedgers);
                let j = 1;
                for (let i = 1; i < csvArray.length - 1; i++) {
                    let line = csvArray[i];
                    const value = sanitize(line).split(",");
                    let invoiceNumber = NIUID.split("-")[1] + "-" + NIUID.split("-")[2];
                    if (value[1] == invoiceNumber) {
                        let invoice = invoiceLedgers[0];
                        let settlementType = _self.getSettlementType(settledArray, j);
                        let settlementAmount = _self.getSettlementAmount(settledArray, j);
                        let fundedRemaining = _self.getFundedRemaining(settledArray, j);

                        //region Log
                        console.log("Invoice Number: Actual,  Expected : " + value[1] + ", " + invoiceNumber + " == " + ((value[1] == invoiceNumber) ? "Passed" : "Failed"));
                        //console.log("Settlement Date: Actual,  Expected : " + value[3].split(".")[0] + ", " + settledArray[j].documentConfirmed.split(".")[0] + " == " + ((value[3].split(".")[0] == settledArray[j].documentConfirmed.split(".")[0]) ? "Passed" : "Failed"));
                        console.log("Settlement From: Actual,  Expected : " + value[4] + ", " + config.CONSTANT.SettlementFrom + " == " + ((value[4] == config.CONSTANT.SettlementFrom) ? "Passed" : "Failed"));
                        console.log("Settlement To: Actual,  Expected : " + value[5] + ", " + config.CONSTANT.SettlementTo + " == " + ((value[5] == config.CONSTANT.SettlementTo) ? "Passed" : "Failed"));
                        console.log("Settlement Currency: Actual,  Expected : " + value[6] + ", " + config.CONSTANT.Currency + " == " + ((value[6] == config.CONSTANT.Currency) ? "Passed" : "Failed"));
                        console.log("Settlement Type: Actual,  Expected : " + value[7] + ", " + settlementType + " == " + ((value[7] == settlementType) ? "Passed" : "Failed"));
                        console.log("Settlement Amount: Actual,  Expected : " + value[8] + ", " + settlementAmount + " == " + ((value[8] == settlementAmount) ? "Passed" : "Failed"));
                        //console.log(" Funded Remaining: Actual,  Expected : " + value[9] + ", " + fundedRemaining + " == " + ((value[9] == fundedRemaining) ? "Passed" : "Failed"));
                        //endregion
                        //region DB Entry
                        db = new Database();
                        db.add("Invoice Number "+j, value[1], invoiceNumber, ((value[1] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        //need to confirmed db.add("Settlement Date "+j, value[3].split(".")[0], settledArray[j].documentConfirmed.split(".")[0], ((value[3].split(".")[0] == settledArray[j].documentConfirmed.split(".")[0]) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        db.add("Settlement From "+j, value[4], config.CONSTANT.SettlementFrom, ((value[4] == config.CONSTANT.SettlementFrom) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        db.add("Settlement To "+j, value[5], config.CONSTANT.SettlementTo, ((value[5] == config.CONSTANT.SettlementTo) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        db.add("Settlement Currency "+j, value[6], config.CONSTANT.Currency, ((value[6] == config.CONSTANT.Currency) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        db.add("Settlement Type "+j, value[7], settlementType, ((value[7] == settlementType) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        db.add("Settlement Amount "+j, value[8], settlementAmount, ((value[8] == settlementAmount) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        // need yo confirm db.add("Funded Remaining "+j, value[9], fundedRemaining, ((value[9] == fundedRemaining) ? "Passed" : "Failed"), config.DATABASE.Daily_Settlement);
                        //endregion
                        j++;
                    }
                }
                j = 1;
            }
        });
    }

    filterSettlement(ledger) {
        return ledger.filter(object => (object.status === 'TradePaymentRequestAcknowledged')||(object.status === 'SettlementNotificationSent'));
    }

    getSettlementType(settledArray, index) {
        if (((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions) != 0) && ((settledArray[index].invoicePayments - settledArray[(index - 1)].invoicePayments) == 0) && (settledArray[index].totalOutstanding != 0)) {
            dilutionArray.push((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions));
            settlementAmountArray.push((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions));
            return "Dilution"
        }
        if (((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions) == 0) && ((settledArray[index].invoicePayments - settledArray[(index - 1)].invoicePayments) != 0) && (settledArray[index].totalOutstanding != 0)) {
            cashArray.push((settledArray[index].invoicePayments - settledArray[(index - 1)].invoicePayments));
            settlementAmountArray.push((settledArray[index].invoicePayments - settledArray[(index - 1)].invoicePayments));
            return "CashAppliction"
        }
        if (((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions) != 0) && ((settledArray[index].invoicePayments - settledArray[(index - 1)].invoicePayments) == 0) && (settledArray[index].totalOutstanding == 0)) {
            dilutionArray.push((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions));
            settlementAmountArray.push((settledArray[index].invoiceDilutions - settledArray[(index - 1)].invoiceDilutions));
            return "Repurchase"
        }
        return "None"
    }

    getSettlementAmount(settledArray, index) {
        return settlementAmountArray[index -1];
    }

    getFundedRemaining(settledArray, index) {
        return settledArray[1].invoiceValue - settlementAmountArray.reduce((a, b) => a + b, 0);
    }
};