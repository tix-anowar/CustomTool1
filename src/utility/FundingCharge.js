//region Import
const config = require('../../config.json');
let DiscountCharge = require("./DiscountCharge");
let _self;
let discountCharge;
//endregion

module.exports = class FundingCharge {
    constructor() {
        _self = this;
        discountCharge = new DiscountCharge();
    }

    baseRate(faceValue) {
        return ((config.CONSTANT.BaseRate/10000) * faceValue);
    }

    margin(faceValue) {
        return ((config.CONSTANT.Margin/10000) * faceValue);
    }

    calculatedBaseRate(faceValue, tenor) {
        return ((this.baseRate(faceValue) * tenor)/365);
    }

    calculatedMargin(faceValue, tenor) {
        return ((this.margin(faceValue) * tenor) / 365);
    }

    insurerGrossFee(faceValue) {
        return (config.CONSTANT.InsuranceRate/10000) * faceValue;
    }

    insurerNetFee(faceValue) {
        return (this.insurerGrossFee(faceValue)/1.12);
    }

    insurerVat(faceValue) {
        return (this.insurerGrossFee(faceValue) - this.insurerNetFee(faceValue));
    }

    servicerGrossFee(faceValue) {
        return (config.CONSTANT.ServicerRate/10000) * faceValue;
    }

    servicerNetFee(faceValue) {
        return (this.servicerGrossFee(faceValue)/1.2);
    }

    servicerVat(faceValue) {
        return (this.servicerGrossFee(faceValue) - this.servicerNetFee(faceValue));
    }

    networkGrossFee(faceValue) {
        return ((config.CONSTANT.NetworkRate/10000) * faceValue);
    }

    networkNetFee(faceValue) {
        return (this.networkGrossFee(faceValue)/1.2);
    }

    networkVat(faceValue) {
        return (this.networkGrossFee(faceValue) - this.networkNetFee(faceValue));
    }

    chargeAmount(faceValue) {
        return this.insurerGrossFee(faceValue) + this.servicerGrossFee(faceValue) + this.networkGrossFee(faceValue);
    }

    totalFundingCost(faceValue, tenor) {
        return this.chargeAmount(faceValue) + discountCharge.getCharge(faceValue, tenor);
    }

};