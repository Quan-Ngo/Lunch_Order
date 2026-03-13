const { MailtrapClient } = require('mailtrap');

const TOKEN = 'b2afc7af46c8f9bce4b185654f0f8750';

const client = new MailtrapClient({ token: TOKEN });

const sender = {
    email: 'hello@demomailtrap.co',
    name: 'Lunch Order',
};

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
    const recipients = typeof to === 'string'
        ? to.split(',').map(email => ({ email: email.trim() }))
        : to;

    try {
        const response = await client.send({
            from: sender,
            to: recipients,
            subject,
            text: text || '',
            html: html || undefined,
            category: 'Lunch Notification',
        });

        console.log(`[EmailService] Message sent to ${to}:`, response);
        return response;
    } catch (err) {
        console.error(`[EmailService] Failed to send email to ${to}:`, err?.message || err);
        throw err;
    }
}

module.exports = { sendEmail };
