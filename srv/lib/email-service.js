const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    auth: {
        user: '4566f536ba86e6',
        pass: '75d87a9d9243b3',
    },
});

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
