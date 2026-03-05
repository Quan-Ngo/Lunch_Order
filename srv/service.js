const cds = require('@sap/cds');
const axios = require('axios');
const { sendEmail } = require('./lib/email-service');

module.exports = class LunchService extends cds.ApplicationService {
    async init() {
        const { Staff } = this.entities;

        this.on('grantAdminRole', async (req) => {
            const { userEmail } = req.data;
            if (!userEmail) return req.error(400, 'User email is required');

            // --- SAP BTP XSUAA / SCIM Integration Logic ---
            // In a real BTP environment, you would call the SCIM API to 
            // assign a User to an Admin Role Collection.

            try {
                // 1. You would first get an OAuth token for the XSUAA API
                // 2. You would use the SCIM API to find the user by email
                // 3. You would add the user to the 'LunchAdmin' Group/Role

                // For demonstration, let's assume we call a hypothetical SCIM endpoint
                // const scimResponse = await axios.post(`${process.env.XSUAA_URL}/scim/Users/${userEmail}/roles`, {
                //     role: 'LunchAdmin'
                // });

                console.log(`Granting Admin role to: ${userEmail}`);

                // Optional: Update a flag in your local Staff table if you track it there
                // await UPDATE(Staff).set({ isAdmin: true }).where({ email: userEmail });

                return `Successfully granted Admin role to ${userEmail}. (Simulation: SCIM API would be called here in BTP)`;
            } catch (error) {
                console.error('Failed to grant role:', error);
                return req.error(500, `Failed to update roles via SCIM: ${error.message}`);
            }
        });

        // Send email when food is added to daily menu
        this.after('CREATE', 'DailyMenu', async (data) => {
            // Check if it's a food creation (catalog_ID is present)
            if (!data.catalog_ID) return;

            // Format date from YYYY-MM-DD to DD/MM/YYYY
            const rawDateStr = data.date;
            let formattedDate = rawDateStr;
            if (rawDateStr) {
                const parts = rawDateStr.split('-');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }

            console.log(`[LunchService] Food added for ${formattedDate}. Gathering recipients...`);

            try {
                // Fetch staff from the database where status = true and notification = true
                const staffMembers = await SELECT.from(Staff).where({ status: true, notification: true });

                // Guard against users without email, or if email looks incorrect/malformed
                const validEmails = staffMembers
                    .map(staff => staff.email?.trim())
                    .filter(email => {
                        // Basic validation: string exists, contains '@' and '.'
                        return email && email.includes('@') && email.includes('.');
                    });

                if (validEmails.length === 0) {
                    console.log(`[LunchService] No valid staff emails found. Skipping notification.`);
                    return;
                }

                console.log(`[LunchService] Found ${validEmails.length} valid recipients. Sending notifications in the background...`);

                // We use standard Promise chaining (.catch) instead of await 
                // to avoid waiting on the SMTP dispatch (which keeps the UI fast)
                sendEmail({
                    to: validEmails.join(', '), // Send to array of valid emails
                    subject: `New Lunch Option for ${formattedDate}!`,
                    text: `New food selection is available for ${formattedDate}. What would you like for lunch on that day?.`
                }).catch((err) => {
                    console.error('[LunchService] Failed to send notification email:', err);
                });
            } catch (err) {
                console.error('[LunchService] Error fetching staff for notifications:', err);
            }
        });

        return super.init();
    }
}
