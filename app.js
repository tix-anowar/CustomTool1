//region Import
const formidable = require('formidable');
const fs = require('fs');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf');
const moment = require('moment');

const request = require('request');
const config = require('./config.json');

let NineTab = require('./src/NineTab');
let ValidationController = require('./src/ValidationController');
let Database = require('./src/utility/Database');
let MailService = require('./src/utility/MailService');

const app = express();
let nineTab;
let validationController;
let db;
let mailService;
let _self;

//endregion

class App {
    constructor() {
        _self = this;
        nineTab = new NineTab();
        db = new Database();
        mailService = new MailService();
        validationController = new ValidationController();
        this.initViewEngine();
        this.initExpressMiddleware();
        this.initRoutes();
        this.start();
    }

    initViewEngine() {
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));
    }

    initExpressMiddleware() {
        app.use('/static', express.static(path.join(__dirname, 'public')));
        app.use('/reports', express.static(path.join(__dirname, 'reports')));
        app.use(expressLayouts);
        app.set('layout', 'layouts/layout');
        app.set('layout extractScripts', true)
        app.set('layout extractStyles', true)
    }

    initRoutes() {
        app.get('/', function (req, res) {
            res.render('home', {title: 'Home', pg: 'home'});
        });

        app.get('/importcsv', function (req, res) {
            res.render('uploadform', {title: 'Import CSV', pg: 'importcsv'});
        });

        app.get('/test', function (req, res) {
            res.render('test', {title: 'Test', pg: 'test'});
        });

        app.get('/artefacts', function (req, res) {
            let csvFiles = fs.readdirSync(__dirname + "/src/actual_files/trade_csv/");
            let exceptionReportFiles = fs.readdirSync(__dirname + "/src/actual_files/exception_report/");
            let dailyFundingReportFiles = fs.readdirSync(__dirname + "/src/actual_files/daily_funding_report/");
            let dailyReconciliationReportFiles = fs.readdirSync(__dirname + "/src/actual_files/daily_reconsilation_report/");
            let dailySettlementReportFiles = fs.readdirSync(__dirname + "/src/actual_files/daily_settlement_report/");
            let cashSettlementFiles = fs.readdirSync(__dirname + "/src/actual_files/cash_settlement/");
            let dilutionSettlementFiles = fs.readdirSync(__dirname + "/src/actual_files/dilution_settlement/");
            let repurchaseSettlementFiles = fs.readdirSync(__dirname + "/src/actual_files/repurchase_settlement/");

            res.render('artefacts', {
                title: 'Artefacts',
                pg: 'artefacts',
                csvFiles: csvFiles,
                exceptionReportFiles: exceptionReportFiles,
                dailyFundingReportFiles: dailyFundingReportFiles,
                dailyReconciliationReportFiles: dailyReconciliationReportFiles,
                dailySettlementReportFiles: dailySettlementReportFiles,
                cashSettlementFiles: cashSettlementFiles,
                dilutionSettlementFiles: dilutionSettlementFiles,
                repurchaseSettlementFiles: repurchaseSettlementFiles,
            });
        });

        app.get('/reports', function (req, res) {
            db.getTestReport(function (data) {
                let TradeCsvList = data.data.filter(object => object.type === config.DATABASE.Trade_Csv);
                let DailyFundingList = data.data.filter(object => object.type === config.DATABASE.Daily_Funding);
                let DailyReconciliationList = data.data.filter(object => object.type === config.DATABASE.Daily_Reconciliation);
                let RepurchaseSettlementList = data.data.filter(object => object.type === config.DATABASE.Repurchase_Settlement);
                let CashSettlementList = data.data.filter(object => object.type === config.DATABASE.Buyer_Settlement);
                let DailySettlementList = data.data.filter(object => object.type === config.DATABASE.Daily_Settlement);
                let DilutionSettlementList = data.data.filter(object => object.type === config.DATABASE.Credit_Note);
                let ExceptionReportList = data.data.filter(object => object.type === config.DATABASE.Exception);
                ejs.renderFile("views/report-template/report.ejs", {
                    title: 'Reports',
                    'TradeCsvList': TradeCsvList,
                    'DailyFundingList': DailyFundingList,
                    'DailyReconciliationList': DailyReconciliationList,
                    'RepurchaseSettlementList': RepurchaseSettlementList,
                    'CashSettlementList': CashSettlementList,
                    'DailySettlementList': DailySettlementList,
                    'DilutionSettlementList': DilutionSettlementList,
                    'ExceptionReportList': ExceptionReportList,
                    "now": moment().format("DD-MMM-YYYY")
                }, {}, function (err, html) {
                    if (err)
                        return console.log(err);
                    pdf.create(html, {format: 'A4'}).toFile("./reports/report.pdf", function (err, result) {
                        if (err)
                            return console.log(err);
                        const attachments = [
                            {
                                path: "./reports/report.pdf"
                            }
                        ];
                        mailService.send("anowar@bitmascot.com, imrul@bitmascot.com", "Test Results", "Hello Text message!", html, attachments);
                        res.render('reports', {title: 'Reports', pg: 'reports'});
                    });
                });
            });
        });

        app.post('/fileupload', function (req, res) {
            const form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                const oldpath = files.filetoupload.path;
                const newpath = __dirname + '/csvfiles/tradecsv_' + new Date().getTime() + ".csv";
                let accessToken;
                request.post('https://id.qa.tradeix.com/connect/token', {
                    form: config.form,
                    json: true
                }, function (err, res, body) {
                    accessToken = body.access_token;
                    nineTab.csvFileUpload(oldpath, newpath, accessToken);
                });
                res.redirect("/");
            });
        });

        app.post('/validation', function (req, res) {
            const form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                let accessToken;
                request.post('https://id.qa.tradeix.com/connect/token', {
                    form: config.form,
                    json: true
                }, function (err, res, body) {
                    accessToken = body.access_token;
                    validationController.validate(accessToken, fields.NIUID);
                });
                res.redirect("/");
            });
        });

        app.get('/files/delete/:type/:name', function (req, res) {
            let filePath = _self.generateFilePath(req.params.type, req.params.name);
            fs.unlinkSync(filePath);
            res.redirect('/artefacts');
        });

        app.post('/files/upload', function (req, res) {
            const form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                const oldpath = files.filetoupload.path;
                const newpath = _self.generateFilePath(req.params.type, req.params.name);
                const data = fs.readFileSync(oldpath, 'utf8');
                fs.writeFileSync(newpath, data);
                fs.unlinkSync(oldpath);
                res.redirect('/artefacts');
            });
        });
    }

    generateFilePath(type, name) {
        return __dirname + config.FILE_PATH[type] + name;
    }

    start() {
        app.listen(3000, function () {
            console.log('http://localhost:3000')
        });
    }
}

new App();
