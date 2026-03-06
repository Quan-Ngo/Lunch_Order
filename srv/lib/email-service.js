const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    auth: {
        user: '4566f536ba86e6',
        pass: '75d87a9d9243b3',
    },
});

/** @type {boolean} */
let isEmailDisabled;
isEmailDisabled = true; // Set to true to temporarily disable email services

/**
 * Send an email via the configured SMTP transporter.
 * @param {Object}  options
 * @param {string}  options.to      - Recipient email address(es).
 * @param {string}  options.subject - Email subject line.
 * @param {string}  [options.text]  - Plain-text body.
 * @param {string}  [options.html]  - HTML body.
 * @returns {Promise<import('nodemailer').SentMessageInfo>}
 */
async function sendEmail({ to, subject, text, html }) {
    if (isEmailDisabled) {
        console.log(`[EmailService] Email sending is currently disabled. Skipping email to: ${to}`);
        return { messageId: 'disabled' };
    }

    const info = await transporter.sendMail({
        from: '"Lunch Order" <noreply@lunchorder.dev>',
        to,
        subject,
        text,
        html,
    });

    console.log(`[EmailService] Message sent: ${info.messageId}`);
    return info;
}

module.exports = { sendEmail };
