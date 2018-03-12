//region Import
const fs = require('fs');
var parseXlsx = require('excel');
const sanitize = require("sanitize-filename");
const request = require('request');
const moment = require('moment');
const config = require('../../../config.json');
const FundingCharge = require('../../utility/FundingCharge');
let Database = require('./../../utility/Database');
let db;
let _self;
let fundingCharge;
const repurchase_file_url = __dirname + "/../../actual_files/daily_funding_report/Daily_Funding_Report.csv";
//endregion

module.exports = class DailyFunding {
    constructor() {
        _self = this;
        fundingCharge = new FundingCharge();
    }

    test(accessToken, NIUID) {
        let actual_file_data = fs.readFileSync(repurchase_file_url).toString().split("\n");
        for (let i = 0; i < actual_file_data.length - 1; i++) {
            let line = actual_file_data[i];
            const actual_data = sanitize(line).split(",");
            let invoiceNumber = actual_data[1];
            if (invoiceNumber == (NIUID.split("-")[1] + "-" + NIUID.split("-")[2])) {
                request({
                    url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + NIUID + '&filterField2=InvoiceVersion&filterOperator2=EQUALS&filterValue2=1.0',
                    auth: {
                        'bearer': accessToken
                    }
                }, function (err, res) {
                    let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
                    if (invoiceLedgers.length) {

                        let invoice = invoiceLedgers[0];
                        let invoiceValue = invoice.invoiceValue;
                        let tenor = moment(actual_data[20].split("T")[0]).diff(moment(actual_data[3].split("T")[0]), 'days');
                        let invoiceNumber = (NIUID.split("-")[1] + "-" + NIUID.split("-")[2]);
                        let calculatedBaseRate = fundingCharge.calculatedBaseRate(invoiceValue, tenor);
                        let calculatedMargin = fundingCharge.calculatedMargin(invoiceValue, tenor);
                        let insurerGrossFee = fundingCharge.insurerGrossFee(invoiceValue);
                        let insurerNetFee = fundingCharge.insurerNetFee(invoiceValue);
                        let insurerVat = fundingCharge.insurerVat(invoiceValue);
                        let servicerGrossFee = fundingCharge.servicerGrossFee(invoiceValue);
                        let servicerNetFee = fundingCharge.servicerNetFee(invoiceValue);
                        let servicerVat = fundingCharge.servicerVat(invoiceValue);
                        let networkGrossFee = fundingCharge.networkGrossFee(invoiceValue);
                        let networkNetFee = fundingCharge.networkNetFee(invoiceValue);
                        let networkVat = fundingCharge.networkVat(invoiceValue);
                        let totalFundingCost = fundingCharge.totalFundingCost(invoiceValue, tenor);

                        console.log("Invoice Number: Actual,  Expected : " + actual_data[1] + ", " + invoiceNumber + " == " + ((actual_data[1] == invoiceNumber) ? "Passed" : "Failed"));
                        console.log("Funder: Actual,  Expected : " + actual_data[2] + ", " + config.CONSTANT.Funder + " == " + ((actual_data[2] == config.CONSTANT.Funder) ? "Passed" : "Failed"));
                        //console.log("Funded Date: Actual,  Expected : " + actual_data[3] + ", " + config.CONSTANT.SenderId + " == " + ((actual_data[3] == config.CONSTANT.SenderId) ? "Passed" : "Failed"));
                        console.log("Funded Currency: Actual,  Expected : " + actual_data[4] + ", " + config.CONSTANT.Currency + " == " + ((actual_data[4] == config.CONSTANT.Currency) ? "Passed" : "Failed"));
                        console.log("Funded Amount: Actual,  Expected : " + actual_data[5] + ", " + invoiceValue + " == " + ((actual_data[5] == invoiceValue) ? "Passed" : "Failed"));
                        console.log("Base Rate: Actual,  Expected : " + actual_data[6] + ", " + config.CONSTANT.BaseRate + " == " + ((actual_data[6] == config.CONSTANT.BaseRate) ? "Passed" : "Failed"));
                        console.log("Calculated Base Rate: Actual,  Expected : " + actual_data[7] + ", " + calculatedBaseRate + " == " + ((actual_data[7] - calculatedBaseRate) < config.CONSTANT.Deviation ? "Passed" : "Failed"));
                        console.log("Margin: Actual,  Expected : " + actual_data[8] + ", " + config.CONSTANT.Margin + " == " + ((actual_data[8] == config.CONSTANT.Margin) ? "Passed" : "Failed"));
                        console.log("Calculated Margin: Actual,  Expected : " + actual_data[9] + ", " + calculatedMargin + " == " + ((actual_data[9] - calculatedMargin) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Insurer Gross Fee: Actual,  Expected : " + actual_data[10] + ", " + insurerGrossFee + " == " + ((actual_data[10] - insurerGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Insurer Net Fee: Actual,  Expected : " + actual_data[11] + ", " + insurerNetFee + " == " + ((actual_data[11] - insurerNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Insurer VAT/IPT: Actual,  Expected : " + actual_data[12] + ", " + insurerVat + " == " + ((actual_data[12] - insurerVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Servicer Gross Fee: Actual,  Expected : " + actual_data[13] + ", " + servicerGrossFee + " == " + ((actual_data[13] - servicerGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Servicer Net Fee: Actual,  Expected : " + actual_data[14] + ", " + servicerNetFee + " == " + ((actual_data[14] - servicerNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Servicer VAT/IPT: Actual,  Expected : " + actual_data[15] + ", " + servicerVat + " == " + ((actual_data[15] - servicerVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Network Provider Gross Fee: Actual,  Expected : " + actual_data[16] + ", " + networkGrossFee + " == " + ((actual_data[16] - networkGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Network Provider Net Fee: Actual,  Expected : " + actual_data[17] + ", " + networkNetFee + " == " + ((actual_data[17] - networkNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Network Provider VAT/IPT: Actual,  Expected : " + actual_data[18] + ", " + networkVat + " == " + ((actual_data[18] - networkVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log("Funding Days: Actual,  Expected : " + actual_data[19] + ", " + tenor + " == " + ((actual_data[19] == tenor) ? "Passed" : "Failed"));
                        //console.log("Forecast Settlement Date: Actual,  Expected : " + actual_data[20] + ", " + config.CONSTANT.SupplierName + " == " + ((actual_data[20] == config.CONSTANT.SupplierName) ? "Passed" : "Failed"));
                        console.log(" Total Funding Costs: Actual,  Expected : " + actual_data[21] + ", " + totalFundingCost + " == " + ((actual_data[21] - totalFundingCost) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));
                        console.log(" Funding Payment: Actual,  Expected : " + actual_data[22] + ", " + (invoiceValue - totalFundingCost) + " == " + ((actual_data[22] - (invoiceValue - totalFundingCost)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"));

                        db = new Database();
                        db.add("Invoice Number", actual_data[1], invoiceNumber, ((actual_data[1] == invoiceNumber) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Funder", actual_data[2], config.CONSTANT.Funder, ((actual_data[2] == config.CONSTANT.Funder) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Funded Currency", actual_data[4], config.CONSTANT.Currency, ((actual_data[4] == config.CONSTANT.Currency) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Funded Amount", actual_data[5], invoiceValue, ((actual_data[5] == invoiceValue) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Base Rate", actual_data[6], config.CONSTANT.BaseRate, ((actual_data[6] == config.CONSTANT.BaseRate) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Calculated Base Rate", actual_data[7], calculatedBaseRate, (Math.abs(actual_data[7] - calculatedBaseRate) < config.CONSTANT.Deviation ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Margin", actual_data[8], config.CONSTANT.Margin, ((actual_data[8] == config.CONSTANT.Margin) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Calculated Margin", actual_data[9], calculatedMargin, (Math.abs(actual_data[9] - calculatedMargin) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Insurer Gross Fee", actual_data[10], insurerGrossFee, (Math.abs(actual_data[10] - insurerGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Insurer Net Fee", actual_data[11], insurerNetFee, (Math.abs(actual_data[11] - insurerNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Insurer VAT/IPT", actual_data[12], insurerVat, (Math.abs(actual_data[12] - insurerVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Servicer Gross Fee", actual_data[13], servicerGrossFee, (Math.abs(actual_data[13] - servicerGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Servicer Net Fee", actual_data[14], servicerNetFee, (Math.abs(actual_data[14] - servicerNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Servicer VAT/IPT", actual_data[15], servicerVat, (Math.abs(actual_data[15] - servicerVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Network Provider Gross Fee", actual_data[16], networkGrossFee, (Math.abs(actual_data[16] - networkGrossFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Network Provider Net Fee", actual_data[17], networkNetFee, (Math.abs(actual_data[17] - networkNetFee) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Network Provider VAT/IPT", actual_data[18], networkVat, (Math.abs(actual_data[18] - networkVat) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Funding Days", actual_data[19], tenor, ((actual_data[19] == tenor) ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Total Funding Costs", actual_data[21], totalFundingCost, (Math.abs(actual_data[21] - totalFundingCost) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                        db.add("Funding Payment", actual_data[22], (invoiceValue - totalFundingCost), (Math.abs(actual_data[22] - (invoiceValue - totalFundingCost)) < config.CONSTANT.Deviation  ? "Passed" : "Failed"), config.DATABASE.Daily_Funding);
                    }
                });
            }
        }
    }
};