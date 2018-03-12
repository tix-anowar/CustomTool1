//region Import
const fs = require('fs');
const excelbuilder = require('msexcel-builder');
const config = require('./../config.json');
const sanitize = require("sanitize-filename");
const request = require('request');
const moment = require('moment');
const NINE_TAB = config.NINE_TAB;
let DiscountCharge = require("./utility/DiscountCharge");
let discountCharge;
let _self;
//endregion

module.exports = class NineTab {
    constructor() {
        _self = this;
        discountCharge = new DiscountCharge();
    }

    csvFileUpload(oldpath, newpath, accessToken) {
        const data = fs.readFileSync(oldpath, 'utf8');
        fs.writeFileSync(newpath, data);
        fs.unlinkSync(oldpath);

        this.generate9tab(newpath, accessToken)
    }

    generate9tab(csvFilePath, accessToken) {
        let fileName = '9tab_' + new Date().getTime() + '.xlsx'.trim();
        var workbook = excelbuilder.createWorkbook(__dirname + '/../9tabfiles/'.trim(), fileName);
        //region Create Tabs for 9 Tab
        const ledger = workbook.createSheet('Ledger', 30, 30);
        const prevDayPayments = workbook.createSheet('Prev Day Payments', 30, 30);
        const prevDayPrePay = workbook.createSheet('Prev Day Prepay – Doc', 30, 30);
        const otherCharges = workbook.createSheet('Other Charges - MTD', 30, 30);
        const prevDaysSchedule = workbook.createSheet('Prev Days Schedule', 30, 30);
        // endregion

        //region Create Headers of Ms Excel
        _self.createLedgerTab(ledger);
        _self.createPrevDayPaymentsTab(prevDayPayments);
        _self.createPrevDayPrePayTab(prevDayPrePay);
        _self.createOtherChargesTab(otherCharges);
        _self.createPrevDaysScheduleTab(prevDaysSchedule);
        //endregion

        let csvArray = fs.readFileSync(csvFilePath).toString().split("\n");
        for (let i = 0; i < csvArray.length - 1; i++) {
            let line = csvArray[i];
            if (line.length > 0) {
                const value = sanitize(line).split(",");
                let networkInvoiceUUID = value[1].split("+")[1];
                request({
                    url: 'https://api.qa.tradeix.com/ledgers/invoices?filterField1=NetworkInvoiceUid&filterOperator1=EQUALS&filterValue1=' + networkInvoiceUUID + '&filterField2=InvoiceVersion&filterOperator2=EQUALS&filterValue2=1.0',
                    auth: {
                        'bearer': accessToken
                    }
                }, function (err, res) {
                    let invoiceLedgers = JSON.parse(res.body).invoiceLedgers;
                    if (invoiceLedgers.length) {
                        let invoiceValue = invoiceLedgers[0].invoiceValue;
                        console.log("Invoice Value: " + invoiceValue);
                        let transactionFee = (config.CONSTANT.TransactionRate / 10000) * invoiceValue;
                        let insuranceFee = (config.CONSTANT.InsuranceRate / 10000) * invoiceValue;
                        let outstanding = invoiceLedgers[0].totalOutstanding;
                        let chargeAmount = (insuranceFee + transactionFee).toFixed(2);
                        for (let i = 0; i < invoiceLedgers.length; i++) {
                            if (invoiceLedgers[i].action == "BidCreated") {
                                console.log("Ledger transactionFee: " + invoiceLedgers[i].transactionFee);
                                console.log("Ledger insuranceFee: " + invoiceLedgers[i].insuranceFee);
                                console.log("Ledger chargeAmount: " + (invoiceLedgers[i].transactionFee + invoiceLedgers[i].insuranceFee));
                            }
                        }
                        console.log("Ledger outstanding: " + outstanding);
                        console.log("Calculated transactionFee: " + transactionFee);
                        console.log("Calculated insuranceFee: " + insuranceFee);
                        console.log("Calculated chargeAmount: " + chargeAmount);

                        let csvData = _self.mapCsvData(value, chargeAmount, outstanding); console.log("Tenor: " + csvData.Tenor);
                        _self.calculateLedgerTab(ledger, csvData, i);
                        _self.calculatePrevDayPaymentsTab(prevDayPayments, csvData, i);
                        _self.calculatePrevDayPrePayTab(prevDayPrePay, csvData, i);
                        _self.calculateOtherChargesTab(otherCharges, csvData, i);
                        _self.calculatePrevDaysScheduleTab(prevDaysSchedule, csvData, i);
                        if (i == csvArray.length - 2) {
                            workbook.save(function (ok) {
                                if (!ok) {
                                    workbook.cancel();
                                    //console.log('Error, 9 Tab create error!');
                                }
                                else {
                                    console.log('congratulations, 9 Tab created');
                                }
                            });
                        }
                    }
                });
            }
        }
    }


    createLedgerTab(ledger) {
        let NINE_TAB = config.NINE_TAB;
        let LEDGER = NINE_TAB.LEDGER;
        let HEADERS = LEDGER.HEADERS;

        ledger.set(1, 7, LEDGER.CURRENT_SALES_LEDGER_ON + _self.now());
        ledger.set(1, 8, HEADERS.Limit_Group_ID);
        ledger.set(2, 8, HEADERS.Product_Desc);
        ledger.set(3, 8, HEADERS.Deal_ID);
        ledger.set(4, 8, HEADERS.Document_Number);
        ledger.set(5, 8, HEADERS.Buyer_Name);
        ledger.set(6, 8, HEADERS.Document_Date);
        ledger.set(7, 8, HEADERS.Document_Type);
        ledger.set(8, 8, HEADERS.Currency);
        ledger.set(9, 8, HEADERS.Original_Amount);
        ledger.set(10, 8, HEADERS.Due_Date);
        ledger.set(11, 8, HEADERS.Days_Overdue);
        ledger.set(12, 8, HEADERS.Status);
        ledger.set(13, 8, HEADERS.Submit_Date);
        ledger.set(14, 8, HEADERS.Outstanding);
        ledger.set(15, 8, HEADERS.Remarks);
        ledger.set(16, 8, HEADERS.Transaction_Reference);
        ledger.set(17, 8, HEADERS.Prepay_Option);
        ledger.set(18, 8, HEADERS.Prepay_Currency);
        ledger.set(19, 8, HEADERS.Prepay_Amount);
        ledger.set(20, 8, HEADERS.Prepay_Outstanding);
        ledger.set(21, 8, HEADERS.Maturity_Date);
        ledger.set(22, 8, HEADERS.Avail_Amount);
        ledger.set(23, 8, HEADERS.Disc_Charge);
        ledger.set(24, 8, HEADERS.OS_Disc_Charge);
        ledger.set(25, 8, HEADERS.O_Due_Disc_Charge);
        ledger.set(26, 8, HEADERS.O_S_O_Due_Disc_Charge);

        return true;
    }

    createPrevDayPaymentsTab(prevDayPayments) {
        let Prev_Day_Payments = NINE_TAB.Prev_Day_Payments;
        let HEADERS = Prev_Day_Payments.HEADERS;
        let NOTES = Prev_Day_Payments.NOTES;

        prevDayPayments.set(1, 7, Prev_Day_Payments.PAYMENTS_PROCESSED_ON + _self.now());

        /*Set Headers*/
        prevDayPayments.set(1, 8, HEADERS.Limit_Group_ID);
        prevDayPayments.set(2, 8, HEADERS.Product_Desc);
        prevDayPayments.set(3, 8, HEADERS.Deal_ID);
        prevDayPayments.set(4, 8, HEADERS.Buyer_Name);
        prevDayPayments.set(5, 8, HEADERS.Currency);
        prevDayPayments.set(6, 8, HEADERS.Total_Payment_Amount);
        prevDayPayments.set(7, 8, HEADERS.Value_Date);
        prevDayPayments.set(8, 8, HEADERS.Payment_Reference);
        prevDayPayments.set(9, 8, HEADERS.Document_Number);
        prevDayPayments.set(10, 8, HEADERS.Document_Type);
        prevDayPayments.set(11, 8, HEADERS.Currency);
        prevDayPayments.set(12, 8, HEADERS.Current_Document_Amount);
        prevDayPayments.set(13, 8, HEADERS.Allocated_Amount);
        prevDayPayments.set(14, 8, HEADERS.Remaining_Balance);
        prevDayPayments.set(15, 8, HEADERS.Allocation_Reference);

        /*Set Notes*/
        prevDayPayments.set(1, 11, NOTES.Note_Title);
        prevDayPayments.set(1, 12, NOTES.Value1);
        prevDayPayments.set(1, 13, NOTES.Value2);
        prevDayPayments.set(1, 14, NOTES.Value3);
        return true;
    }

    createPrevDayPrePayTab(prevDayPrePay) {
        let NINE_TAB = config.NINE_TAB;
        let Prev_Day_PrePay = NINE_TAB.Prev_Day_PrePay;
        let HEADERS = Prev_Day_PrePay.HEADERS;

        prevDayPrePay.set(1, 7, Prev_Day_PrePay.PREPAYMENT_DONE_ON + _self.now());
        prevDayPrePay.set(1, 8, HEADERS.Limit_Group_ID);
        prevDayPrePay.set(2, 8, HEADERS.Product_Desc);
        prevDayPrePay.set(3, 8, HEADERS.Deal_ID);
        prevDayPrePay.set(4, 8, HEADERS.Document_Number);
        prevDayPrePay.set(5, 8, HEADERS.Buyer_Name);
        prevDayPrePay.set(6, 8, HEADERS.Document_Type);
        prevDayPrePay.set(7, 8, HEADERS.Currency);
        prevDayPrePay.set(8, 8, HEADERS.Due_Date);
        prevDayPrePay.set(9, 8, HEADERS.Status);
        prevDayPrePay.set(10, 8, HEADERS.Outstanding);
        prevDayPrePay.set(11, 8, HEADERS.Seq_No);
        prevDayPrePay.set(12, 8, HEADERS.Post_Date_of_Prepayment);
        prevDayPrePay.set(13, 8, HEADERS.Value_Date_of_Prepayment);
        prevDayPrePay.set(14, 8, HEADERS.Maturity_Date);
        prevDayPrePay.set(15, 8, HEADERS.Tenor);
        prevDayPrePay.set(16, 8, HEADERS.Prepayment_Currency);
        prevDayPrePay.set(17, 8, HEADERS.Prepayment_Amt);
        prevDayPrePay.set(18, 8, HEADERS.Discount_Rate);
        prevDayPrePay.set(19, 8, HEADERS.Disc_Charge);

        return true;
    }

    createOtherChargesTab(otherCharges) {
        let NINE_TAB = config.NINE_TAB;
        let Other_Charges = NINE_TAB.Other_Charges;
        let HEADERS = Other_Charges.HEADERS;

        otherCharges.set(1, 7, Other_Charges.OTHER_CHARGES_FROM + _self.now());
        otherCharges.set(2, 8, HEADERS.Product_Desc);
        otherCharges.set(3, 8, HEADERS.Deal_ID);
        otherCharges.set(4, 8, HEADERS.Creation_Date);
        otherCharges.set(5, 8, HEADERS.Charge_Type);
        otherCharges.set(6, 8, HEADERS.Creation_Ref);
        otherCharges.set(7, 8, HEADERS.Collection_Date);
        otherCharges.set(8, 8, HEADERS.Collection_Ref);
        otherCharges.set(9, 8, HEADERS.TxnCCY);
        otherCharges.set(10, 8, HEADERS.TxnAmt);
        otherCharges.set(11, 8, HEADERS.Charge_Ccy);
        otherCharges.set(12, 8, HEADERS.Charge_Amt);

        otherCharges.set(1, 8, HEADERS.Limit_Group_ID);
        otherCharges.set(6, 8, HEADERS.Creation_Ref);
        otherCharges.set(12, 8, HEADERS.Charge_Amt);

        return true;
    }

    createPrevDaysScheduleTab(prevDaysSchedule) {
        let NINE_TAB = config.NINE_TAB;
        let Prev_Days_Schedule = NINE_TAB.Prev_Days_Schedule;
        let HEADERS = Prev_Days_Schedule.HEADERS;
        let NOTES = Prev_Days_Schedule.NOTES;

        prevDaysSchedule.set(1, 7, Prev_Days_Schedule.NEW_DOCUMENTS_SUBMITTED_ON + _self.now());
        prevDaysSchedule.set(1, 8, HEADERS.Limit_Group_ID);
        prevDaysSchedule.set(2, 8, HEADERS.Product_Desc);
        prevDaysSchedule.set(3, 8, HEADERS.Deal_ID);
        prevDaysSchedule.set(4, 8, HEADERS.Document_Number);
        prevDaysSchedule.set(5, 8, HEADERS.Buyer_Name);
        prevDaysSchedule.set(6, 8, HEADERS.Document_Type);
        prevDaysSchedule.set(7, 8, HEADERS.Currency);
        prevDaysSchedule.set(8, 8, HEADERS.Original_Amount);
        prevDaysSchedule.set(9, 8, HEADERS.Document_Date);
        prevDaysSchedule.set(10, 8, HEADERS.Due_Date);
        prevDaysSchedule.set(11, 8, HEADERS.Bank_Reference);
        prevDaysSchedule.set(12, 8, HEADERS.Remarks);
        prevDaysSchedule.set(1, 13, NOTES.Note_Title);
        prevDaysSchedule.set(1, 14, NOTES.Value1);
        return true;
    }

    calculateLedgerTab(ledger, value, index) {
        ledger.set(4, 9 + index, value.DocNo);
        ledger.set(5, 9 + index, value.BuyerName);
        ledger.set(6, 9 + index, value.DocDate);
        ledger.set(7, 9 + index, config.CONSTANT.DocType);
        ledger.set(8, 9 + index, value.Currency);
        ledger.set(9, 9 + index, value.TotalAmount);
        ledger.set(14, 9 + index, value.Outstanding);
        ledger.set(18, 9 + index, value.Currency);
        ledger.set(19, 9 + index, value.TotalAmount);
        ledger.set(20, 9 + index, value.Outstanding);
        ledger.set(21, 9 + index, value.PaymentDueDate);
        ledger.set(22, 9 + index, value.TotalAmount);
        ledger.set(23, 9 + index, discountCharge.getCharge(value.TotalAmount, value.Tenor));
        return true;
    }

    calculatePrevDayPaymentsTab(prevDayPayments, value, index) {
        return true;
    }

    calculatePrevDayPrePayTab(prevDayPrePay, value, index) {
        prevDayPrePay.set(3, 9 + index, value.DocNo);
        prevDayPrePay.set(4, 9 + index, value.DocNo);
        prevDayPrePay.set(5, 9 + index, value.BuyerName);
        prevDayPrePay.set(6, 9 + index, config.CONSTANT.DocType);
        prevDayPrePay.set(7, 9 + index, value.Currency);
        prevDayPrePay.set(8, 9 + index, value.PaymentDueDate);
        prevDayPrePay.set(10, 9 + index, value.Outstanding);
        prevDayPrePay.set(11, 9 + index, value.DocNo);
        prevDayPrePay.set(15, 9 + index, value.Tenor);
        prevDayPrePay.set(16, 9 + index, value.Currency);
        prevDayPrePay.set(17, 9 + index, value.Outstanding);
        prevDayPrePay.set(18, 9 + index, discountCharge.getDiscountRate(value.Tenor));
        prevDayPrePay.set(19, 9 + index, discountCharge.getCharge(value.TotalAmount, value.Tenor));
        return true;
    }

    calculateOtherChargesTab(otherCharges, value, index) {
        otherCharges.set(3, 9 + index, value.DocNo);
        otherCharges.set(6, 9 + index, value.DocNo);
        otherCharges.set(12, 9 + index, value.ChargeAmount);
        return true;
    }

    calculatePrevDaysScheduleTab(prevDaysSchedule, value, index) {
        prevDaysSchedule.set(4, 9 + index, value.DocNo);
        prevDaysSchedule.set(5, 9 + index, value.BuyerName);
        prevDaysSchedule.set(6, 9 + index, config.CONSTANT.DocType);
        prevDaysSchedule.set(7, 9 + index, value.Currency);
        prevDaysSchedule.set(8, 9 + index, value.TotalAmount);
        prevDaysSchedule.set(9, 9 + index, value.FormattedDocumentDate);
        prevDaysSchedule.set(10, 9 + index, value.FormattedPaymentDueDate);
        return true;
    }

    mapCsvData(value, chargeAmount, outstanding) {
        let documentDate = moment([value[4].slice(0, 4), value[4].slice(4, 6), value[4].slice(6, 8)].join('-')).format("DD-MMM-YYYY");
        let paymentDueDate = moment([value[15].slice(0, 4), value[15].slice(4, 6), value[15].slice(6, 8)].join('-')).format("DD-MMM-YYYY");
        let tenor = moment([value[15].slice(0, 4), value[15].slice(4, 6), value[15].slice(6, 8)].join('-')).diff(moment([value[4].slice(0, 4), value[4].slice(4, 6), value[4].slice(6, 8)].join('-')), "days");
        return {
            "RecordType": value[0],
            "DocNo": value[1],
            "DocType": value[2],
            "SenderID": value[3],
            "DocDate": value[4],
            "BuyerID": value[5],
            "SupplierID": value[6],
            "Currency": value[7],
            "TotalAmount": value[8],
            "DocStatus": value[9],
            "VenorID": value[10],
            "DocTime": value[11],
            "BuyerName": value[12],
            "SupplierName": value[13],
            "GeneralNote": value[14],
            "PaymentDueDate": value[15],
            "ChargeAmount": chargeAmount,
            "Outstanding": outstanding,
            "FormattedDocumentDate": documentDate,
            "FormattedPaymentDueDate": paymentDueDate,
            "Tenor": tenor
        };
    }

    getChargeAmount(totalAmount) {
        let transactionFee = (config.CONSTANT.TransactionRate / 10000) * totalAmount;
        let insuranceFee = (config.CONSTANT.InsuranceRate / 10000) * totalAmount;
        return ((insuranceFee + transactionFee).toFixed(2));
    }

    now() {
        return moment().format("DD-MMM-YYYY");
    }
};