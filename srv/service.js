const cds = require('@sap/cds');
const axios = require('axios');
const { sendEmail } = require('./lib/email-service');

module.exports = class LunchService extends cds.ApplicationService {
    async init() {
        const { Staff } = this.entities;

        this.on('userInfo', async (req) => {
            if (req.user.is('anonymous')) {
                return req.error(401, 'Not authenticated');
            }

            // CMNA_ADMIN is a template name, but req.user.is() checks for scopes.
            // CMNA_READ_ALL_USER is a scope granted only to Admins in xs-security.json.
            const isAdmin = req.user.is('CMNA_READ_ALL_USER');

            // Debug: log user identity and scopes for BTP role diagnosis (visible via `cf logs`)
            console.log('🏁[userInfo] user.id:', req.user.id);
            console.log('🏁[userInfo] user._roles:', JSON.stringify(req.user._roles));
            console.log('🏁[userInfo] is(CMNA_ADMIN):', isAdmin);
            console.log('🏁[userInfo] is(CMNA_ADD_USER):', req.user.is('CMNA_ADD_USER'));
            console.log('🏁[userInfo] is(CMNA_READ_ASSIGNED_USER):', req.user.is('CMNA_READ_ASSIGNED_USER'));
            console.log('🏁[userInfo] is(CMNA_READ_ALL_USER):', req.user.is('CMNA_READ_ALL_USER'));
            console.log('🏁[userInfo] is(CMNA_DELETE_USER):', req.user.is('CMNA_DELETE_USER'));
            console.log('🏁[userInfo] is(CMNA_UPDATE_USER):', req.user.is('CMNA_UPDATE_USER'));

            return JSON.stringify({ role: isAdmin ? 'admin' : 'staff' });
        });


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

        this.on('getBtpUsers', async (req) => {
            const BTP_CLIENT_ID = "sb-na-0dc1b295-8545-4401-b294-6912d269cc66!a203402";
            const BTP_CLIENT_SECRET = "b5e721dc-6cb7-4a21-8ebd-46a7cc099cc2$OO_PT7anPElmD3SSuQ9Y5L10W5F-LoBQyBb-7Vz1Frg=";
            const credentials = Buffer.from(`${BTP_CLIENT_ID}:${BTP_CLIENT_SECRET}`).toString('base64');
            const tokenUrl = 'https://proconarum-development-system.authentication.eu10.hana.ondemand.com/oauth/token?grant_type=client_credentials';
            const usersUrl = 'https://api.authentication.eu10.hana.ondemand.com/Users';

            try {
                // 1. Fetch OAuth Token
                const tokenRes = await axios.post(tokenUrl, null, {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const token = tokenRes.data.access_token;

                // 2. Fetch Users from SCIM API
                const usersRes = await axios.get(usersUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                // Return as stringyfied JSON since results might be complex
                return JSON.stringify(usersRes.data);
            } catch (err) {
                console.error("Failed to fetch BTP users in backend:", err.response?.data || err.message);
                return req.error(500, "Failed to fetch BTP users: " + err.message);
            }
        });

        // Send email when food is added to daily menu
        this.after('CREATE', 'DailyMenu', (data) => {
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

            console.log(`[LunchService] Food added for ${formattedDate}. Sending notification in the background...`);

            // TEST: Send a single email as requested. 
            // We use standard Promise chaining (.catch) instead of await to avoid blocking the DB transaction and HTTP response.
            sendEmail({
                to: 'test@lunchorder.local',
                subject: `New Lunch Option for ${formattedDate}!`,
                text: `New food selection is available for ${formattedDate}. What would you like for lunch on that day?.`
            }).catch((err) => {
                console.error('[LunchService] Failed to send notification email:', err);
            });
        });

        this.on('confirmMenu', async (req) => {
            const { date } = req.data;
            if (!date) return req.error(400, 'date is required');

            const { DailyMenu, Staff } = this.entities;

            console.log(`[LunchService] confirmMenu: Skipping mark as complete for ${date}.`);

            // 2. Format date DD/MM/YYYY for the email body
            const parts = date.split('-');
            const formattedDate = parts.length === 3
                ? `${parts[2]}/${parts[1]}/${parts[0]}`
                : date;

            // 3. Fetch all Staff with status=true and notification=true and a valid email
            const staffList = await SELECT.from(Staff).where({ status: true, notification: true });
            const recipients = staffList.filter(s => s.email && s.email.trim() !== '');

            if (recipients.length === 0) {
                console.log('[LunchService] confirmMenu: No eligible staff to notify.');
                return `Menu confirmed for ${formattedDate}. No staff eligible for notification.`;
            }

            console.log(`[LunchService] confirmMenu: Sending notification to ${recipients.length} staff member(s).`);

            // 4. Send email to each eligible staff member (fire-and-forget)
            recipients.forEach((staff) => {
                sendEmail({
                    to: staff.email,
                    subject: `Lunch Menu Ready for ${formattedDate}`,
                    text: `I have add food menu for ${formattedDate}`,
                    html: `<p>I have add food menu for <strong>${formattedDate}</strong></p>`,
                }).catch((err) => {
                    console.error(`[LunchService] Failed to send email to ${staff.email}:`, err);
                });
            });

            return `Menu confirmed for ${formattedDate}. Notifications sent to ${recipients.length} staff member(s).`;
        });
        this.on('getCurrentUser', async (req) => {
            const user = req.user;
            if (!user || user.is('anonymous')) {
                return req.error(401, 'No authenticated user found');
            }

            const email = (user.id || '').trim().toLowerCase();
            const firstname = user.attr?.given_name ?? '';
            const lastname = user.attr?.family_name ?? '';
            const displayName = (firstname && lastname)
                ? `${firstname} ${lastname}`
                : user.id;
            const normalizedDisplayName = displayName.trim().toLowerCase();

            // Match the authenticated user against the Staff table server-side (using targeted query for performance)
            const matchedStaff = await SELECT.one.from(Staff).where({
                or: [
                    { email: email },
                    { name: displayName },
                    { name: email }
                ]
            });

            return JSON.stringify({
                name: user.id,
                email: user.id,
                firstname,
                lastname,
                displayName,
                staff: matchedStaff || null
            });
        });

        return super.init();
    }
}
