//region Import
const mailer = require('nodemailer');
const config = require('../../config.json');
let _self;
//endregion

module.exports = class MailService {
    constructor() {
        _self = this;
    }

    send(to = null, subject = null, message = null, html = null, attachments = null) {
        let transporter = mailer.createTransport(config.MAIL.Transport_Options);
        let mailOptions = {
            from: 'DHL TestLab 1.0 <md.imrulhasan92@gmail.com>',
            to: to || "",
            subject: subject || "No Subject",
            text: message || "",
            html: html || "",
            attachments: attachments || ""
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Mail sent successfully ! : %s', info.response);
        });
    }
};