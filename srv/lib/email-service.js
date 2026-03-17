
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '7f3250454a1ea1',
        pass: '5ae106e81e84ac'
    }
});

const sender = 'Lunch Order <dien.tang@conarum.com>';

/**
 * Send an email via the Mailtrap API client.
 * @param {Object}  options
 * @param {string}  options.to      - Recipient email address (single address string).
 * @param {string}  options.subject - Email subject line.
 * @param {string}  [options.text]  - Plain-text body.
 * @param {string}  [options.html]  - HTML body.
 * @returns {Promise<any>}
 */

async function sendEmail({ to, subject, text, html }) {
    try {
        const info = await transport.sendMail({
            from: sender,
            to,
            subject,
            text: text || '',
            html: html || undefined
        });
        console.log(`[EmailService] Message sent to ${to}:`, info.messageId);
        return info;
    } catch (err) {
        console.error(`[EmailService] Failed to send email to ${to}:`, err?.message || err);
        throw err;
    }
}

module.exports = { sendEmail };
