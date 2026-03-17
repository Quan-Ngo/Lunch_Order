const cds = require('@sap/cds');
const axios = require('axios');
const { sendEmail } = require('./lib/email-service');

module.exports = class LunchService extends cds.ApplicationService {
    async init() {
        const { Staff } = this.entities;
        
        // Connect to Notification Service
        let notifications;
        try {
            notifications = await cds.connect.to('notifications');
        } catch (e) {
            console.warn('[LunchService] Notifications service not bound or unavailable in environment.');
        }

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

            // 5. Send Workzone Built-in Notification
            if (notifications) {
                try {
                    await notifications.notify({
                        recipients: recipients.map(s => s.email),
                        type: 'MenuConfirmed',
                        data: {
                            date: formattedDate
                        }
                    });
                    console.log(`[LunchService] Workzone Notifications sent for MenuConfirmed.`);
                } catch(err) {
                    console.error('[LunchService] Failed to send Workzone Notification:', err);
                }
            }

            return `Menu confirmed for ${formattedDate}. Notifications sent to ${recipients.length} staff member(s).`;
        });

        this.on('confirmOrder', async (req) => {
            const { date, supplierEmail } = req.data;

            if (!date) return req.error(400, 'date is required');
            if (!supplierEmail || supplierEmail.trim() === '') {
                return req.error(400, 'supplierEmail is required');
            }

            const { DailyCatalogStatistics, DailyOrderSummary } = this.entities;

            // 1. Format date DD/MM/YYYY for the email body
            const parts = date.split('-');
            const formattedDate = parts.length === 3
                ? `${parts[2]}/${parts[1]}/${parts[0]}`
                : date;

            // 2. Fetch order statistics for the given date
            const stats = await SELECT.from(DailyCatalogStatistics).where({ OrderDate: date });
            const summaryRows = await SELECT.from(DailyOrderSummary).where({ OrderDate: date });
            const summary = summaryRows.length > 0 ? summaryRows[0] : null;

            if (!stats || stats.length === 0) {
                return req.error(400, `No orders found for ${formattedDate}. Cannot send an empty order to supplier.`);
            }

            // 3. Build order table rows
            const tableRows = stats.map((item) => {
                const price = Number(item.CatalogPrice || 0).toLocaleString('vi-VN');
                const subtotal = Number(item.SubTotal || 0).toLocaleString('vi-VN');
                return `<tr>
                    <td style="padding:8px 12px;border:1px solid #ddd;">${item.CatalogName}</td>
                    <td style="padding:8px 12px;border:1px solid #ddd;text-align:right;">${price} ${item.CatalogCurrency || 'VND'}</td>
                    <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${item.OrderCount}</td>
                    <td style="padding:8px 12px;border:1px solid #ddd;text-align:right;">${subtotal} ${item.CatalogCurrency || 'VND'}</td>
                </tr>`;
            }).join('');

            const totalOrders = summary ? summary.TotalOrders : stats.reduce((sum, s) => sum + s.OrderCount, 0);
            const totalAmount = summary ? Number(summary.TotalAmount).toLocaleString('vi-VN') : 'N/A';
            const currency = stats[0]?.CatalogCurrency || 'VND';

            // 4. Compose HTML email
            const htmlBody = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <h2 style="color:#333;border-bottom:2px solid #FFD600;padding-bottom:8px;">
                        Lunch Order for ${formattedDate}
                    </h2>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                        <thead>
                            <tr style="background:#FFD600;">
                                <th style="padding:10px 12px;border:1px solid #ddd;text-align:left;">Item</th>
                                <th style="padding:10px 12px;border:1px solid #ddd;text-align:right;">Unit Price</th>
                                <th style="padding:10px 12px;border:1px solid #ddd;text-align:center;">Qty</th>
                                <th style="padding:10px 12px;border:1px solid #ddd;text-align:right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                        <tfoot>
                            <tr style="background:#f5f5f5;font-weight:bold;">
                                <td style="padding:10px 12px;border:1px solid #ddd;">Total</td>
                                <td style="padding:10px 12px;border:1px solid #ddd;"></td>
                                <td style="padding:10px 12px;border:1px solid #ddd;text-align:center;">${totalOrders}</td>
                                <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;">${totalAmount} ${currency}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <p style="color:#666;font-size:13px;">This order was sent from the Lunch Order system.</p>
                </div>
            `;

            const textBody = `Lunch Order for ${formattedDate}\n\n` +
                stats.map(s => `- ${s.CatalogName}: ${s.OrderCount} x ${Number(s.CatalogPrice || 0).toLocaleString('vi-VN')} ${s.CatalogCurrency || 'VND'} = ${Number(s.SubTotal || 0).toLocaleString('vi-VN')} ${s.CatalogCurrency || 'VND'}`).join('\n') +
                `\n\nTotal: ${totalOrders} items — ${totalAmount} ${currency}`;

            // 5. Send email to supplier
            console.log(`[LunchService] confirmOrder: Sending order email to supplier ${supplierEmail} for ${formattedDate}`);

            try {
                await sendEmail({
                    to: supplierEmail.trim(),
                    subject: `Lunch Order for ${formattedDate}`,
                    text: textBody,
                    html: htmlBody,
                });

                console.log(`[LunchService] confirmOrder: Email sent successfully to ${supplierEmail}`);
                return `Order for ${formattedDate} has been sent to ${supplierEmail.trim()}.`;
            } catch (err) {
                console.error(`[LunchService] confirmOrder: Failed to send email to ${supplierEmail}:`, err);
                return req.error(500, `Failed to send order email to ${supplierEmail.trim()}. Please try again later.`);
            }
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

            // Match the authenticated user against the Staff table server-side
            const matchedStaff = await SELECT.one.from(Staff).where({
                email: email
            }).or({
                name: displayName
            }).or({
                name: email
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

        // Detect when a food item is removed from the daily menu
        this.after('UPDATE', 'Catalog', async (data, req) => {
            // Re-fetch data if data.name is missing, though usually it's returned
            const updatedItem = data;

            // Using strict check to see if dailyMenu_ID is explicitly being set to null
            if (req.data && req.data.hasOwnProperty('dailyMenu_ID') && req.data.dailyMenu_ID === null) {
                if (notifications && updatedItem && updatedItem.name) {
                    try {
                        const staffList = await SELECT.from(Staff).where({ status: true, notification: true });
                        const recipients = staffList.filter(s => s.email && s.email.trim() !== '').map(s => s.email);

                        if (recipients.length > 0) {
                            await notifications.notify({
                                recipients: recipients,
                                type: 'FoodRemoved',
                                data: {
                                    foodName: updatedItem.name,
                                    date: 'the daily menu' 
                                }
                            });
                            console.log(`[LunchService] Notification sent for FoodRemoved: ${updatedItem.name}`);
                        }
                    } catch(err) {
                        console.error('[LunchService] Failed to send FoodRemoved notification:', err);
                    }
                }
            }
        });

        return super.init();
    }
}
