//region Import
const config = require('./../config.json');
let TradeCSV = require("./modules/tradecsv/TradeCSV");
let RepurchaseSettlement = require("./modules/repurchase_settlement/RepurchaseSettlement");
let DailyFunding = require("./modules/daily_funding/DailyFunding");
let DailyReconciliation = require("./modules/daily_reconciliation/DailyReconciliation");
let CashSettlement = require("./modules/cashsettlement/CashSettlement");
let DailySettlement = require("./modules/daily_settlement/DailySettlement");
let DilutionSettlement = require("./modules/dilution/DilutionSettlement");
let ExceptionReport = require("./modules/exception_report/ExceptionReport");

let _self;
let tradecsv;
let repurchaseSettlement;
let dailyFunding;
let dailyReconciliation;
let cashSettlement;
let dailySettlement;
let dilutionSettlement;
let exceptionReport;
//endregion

module.exports = class ValidationController {
    constructor() {
        _self = this;
        tradecsv = new TradeCSV();
        repurchaseSettlement = new RepurchaseSettlement();
        dailyFunding = new DailyFunding();
        dailyReconciliation = new DailyReconciliation();
        cashSettlement = new CashSettlement();
        dailySettlement = new DailySettlement();
        dilutionSettlement = new DilutionSettlement();
        exceptionReport = new ExceptionReport();
    }

    validate(accessToken, NIUID) {
        tradecsv.test(accessToken, NIUID);
        repurchaseSettlement.test(accessToken, NIUID);
        dailyFunding.test(accessToken, NIUID);
        dailyReconciliation.test(accessToken, NIUID);
        cashSettlement.test(accessToken, NIUID);
        dailySettlement.test(accessToken, NIUID);
        dilutionSettlement.test(accessToken, NIUID);
        exceptionReport.test(accessToken, NIUID);
    }

};