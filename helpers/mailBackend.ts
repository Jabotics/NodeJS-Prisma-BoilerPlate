import nodemailer from "nodemailer";
import handlebars from 'nodemailer-express-handlebars';


export default {
    name: "MailBackend",
    
    // Transporter to send mail from client server
    transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASS
        }
    }),

    hbs: handlebars,

    hbsConfig: {
        viewEngine: {
            extName: ".hbs",
            layoutDir: "./EmailTemplates/templates",
            defaultLayout: String(),
        },
        viewPath: "./EmailTemplates/templates",
        extName: ".hbs"
    },

    // Send email
    async send(contact: string, subject: string, template: string, context: object) {
        this.transporter.use("compile", this.hbs(this.hbsConfig))

        const mailOptions = {
            from: process.env.EMAIL_ID,
            to: contact,
            subject: subject,
            template: template,
            context: context
        };
        
        this.transporter.sendMail(mailOptions, function(err, info) {});
    },

    async send_attachments(contact: string, subject: string, template: string, context: object, attachments: Array<object>) {
        this.transporter.use("compile", this.hbs(this.hbsConfig))

        const mailOptions = {
            from: process.env.EMAIL_ID,
            to: contact,
            subject: subject,
            template: template,
            context: context,
            attachments: attachments
        };
        
        this.transporter.sendMail(mailOptions, function(err, info) {});
    },
}