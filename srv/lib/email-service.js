const nodemailer = require('nodemailer');

// Pull SMTP configuration from environment variables (e.g., .env file)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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
