//region Import
const config = require('../../config.json');
let _self;
//endregion

module.exports = class DiscountCharge {
    constructor() {
        _self = this;
    }

    getReferenceRate(tenor) {
        let referenceRate;
        if (tenor < 40) {
            referenceRate = 0.25250;
        } else if (tenor >= 40 && tenor < 80) {
            referenceRate = 0.29253;
        } else {
            referenceRate = 0.33256;
        }
        return ((config.CONSTANT.BaseRate)/10000); // for now it is base rate but later it will above condition applied.
    }

    getBankMarginPlusReferenceRate(tenor) {
        return _self.getReferenceRate(tenor) + ((config.CONSTANT.Margin)/10000);
    }

    getFDByDCFDenominator(tenor) {
        return tenor / 365;
    }

    getDiscountRate(tenor) {
        return (_self.getBankMarginPlusReferenceRate(tenor) * _self.getFDByDCFDenominator(tenor));
    }

    getCharge(faceValue, tenor) {
        return (faceValue * _self.getDiscountRate(tenor));
    }
};