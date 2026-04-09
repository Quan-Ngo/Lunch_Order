const cds = require('@sap/cds');
const axios = require('axios');
const { sendEmail } = require('./lib/email-service');
const { sendTypedNotification } = require('./lib/workzone-notification-service');
require('dotenv').config();

module.exports = class LunchService extends cds.ApplicationService {
    async init() {
        const { Staff } = this.entities;

        // Cloud Foundry note: `.env` is usually not shipped with the deployed app.
        // If menu extraction is used in production, GEMINI_API_KEY must be set as an app environment variable.
        if (process.env.NODE_ENV === 'production' && !process.env.GEMINI_API_KEY) {
            console.warn('[LunchService] GEMINI_API_KEY is not set. `extractMenuFromImage` will fail until configured in Cloud Foundry app env.');
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

            // Pagination params (SCIM uses 1-based startIndex)
            const startIndex = req.data.startIndex || 1;
            const count = req.data.count || 100;

            try {
                // 1. Fetch OAuth Token
                const tokenRes = await axios.post(tokenUrl, null, {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const token = tokenRes.data.access_token;

                // 2. Fetch Users from SCIM API with pagination
                const usersRes = await axios.get(usersUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    params: {
                        startIndex: startIndex,
                        count: count
                    }
                });

                const scimData = usersRes.data;

                // Return users + pagination metadata
                const result = {
                    Resources: scimData.Resources || scimData.resources || [],
                    totalResults: scimData.totalResults || 0,
                    startIndex: scimData.startIndex || startIndex,
                    itemsPerPage: scimData.itemsPerPage || count,
                };

                return JSON.stringify(result);
            } catch (err) {
                console.error("Failed to fetch BTP users in backend:", err.response?.data || err.message);
                return req.error(500, "Failed to fetch BTP users: " + err.message);
            }
        });

        this.on('extractMenuFromImage', async (req) => {
            const { image, mimeType } = req.data;
            if (!image) return req.error(400, "Image data is required");

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error('[extractMenuFromImage] Missing GEMINI_API_KEY. Configure it in Cloud Foundry app env (e.g. `cf set-env <app> GEMINI_API_KEY <key>` then restage).');
                return req.reject(500, "Server is missing GEMINI_API_KEY environment variable. Cannot process image.");
            }

            try {
                const { GoogleGenAI } = require('@google/genai');
                const ai = new GoogleGenAI({ apiKey: apiKey });

                const base64Data = image.includes(',') ? image.split(',')[1] : image;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    inlineData: {
                                        data: base64Data,
                                        mimeType: mimeType || 'image/jpeg'
                                    }
                                },
                                {
                                    text: `
                                        Hãy phân tích hình ảnh quyển menu này và trích xuất tất cả các món ăn gồm tên món và giá tiền.

                                        Quy tắc xử lý giá tiền:
                                        - Giá có thể có các định dạng như: 195k, 195 K, 195.000, 195,000, 195000, hoặc 195k - 220k.
                                        - Nếu giá có chữ "k" hoặc "K" thì hiểu đó là đơn vị nghìn (ví dụ: 195k = 195000).
                                        - Nếu một món có khoảng giá (ví dụ: 15k - 20k hoặc 15000 - 20000) thì chỉ lấy giá cao nhất trong khoảng đó.
                                        - Nếu giá có đơn vị VND hoặc VNĐ thì bỏ phần chữ đó.
                                        - Chuẩn hóa giá tiền thành số nguyên.

                                        Kết quả trả về:
                                        - Chỉ trả về một JSON hợp lệ là mảng các object theo định dạng:
                                        [{name, price}]

                                        Quy tắc output:
                                        - Không thêm giải thích.
                                        - Không thêm markdown.
                                        - Không thêm \`\`\`json hoặc \`\`\`.
                                        - Chỉ trả về đúng một mảng JSON.
                                    `
                                }
                            ]
                        }
                    ],
                    config: {
                        temperature: 0.1
                    }
                });

                let text = response.text || "[]";
                // clean markdown if any
                text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

                // validate JSON parsability
                try {
                    JSON.parse(text);
                } catch (e) {
                    console.error("Failed to parse Gemini output as JSON:", text);
                    return req.error(500, "Gemini output was not valid JSON");
                }

                return text;
            } catch (err) {
                const details =
                    err?.response?.data ||
                    err?.message ||
                    (typeof err === 'string' ? err : JSON.stringify(err));
                console.error('[extractMenuFromImage] Gemini Extraction Error:', details);
                return req.reject(502, "Failed to extract menu using Gemini API. Check server logs for details.");
            }
        });

        this.on('confirmMenu', async (req) => {
            const { date, orderOpens, orderCloses } = req.data;
            if (!date) return req.error(400, 'date is required');

            const { DailyMenu, Staff } = this.entities;
            const existingMenu = await SELECT.one.from(DailyMenu).where({ date });
            const menuPayload = {
                status: 'open',
                isShare: true,
                type: 'daily',
            };

            if (orderOpens) menuPayload.orderOpens = orderOpens;
            if (orderCloses) menuPayload.orderCloses = orderCloses;

            if (existingMenu) {
                await UPDATE(DailyMenu).set(menuPayload).where({ ID: existingMenu.ID });
            } else {
                await INSERT.into(DailyMenu).entries({
                    date,
                    ...menuPayload,
                });
            }

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
                console.log('🔔 [LunchService] confirmMenu: No eligible staff found (status=true, notification=true).');
                return `Menu confirmed for ${formattedDate}. No staff eligible for notification.`;
            }

            console.log(`🔔 [LunchService] confirmMenu: Found ${recipients.length} eligible recipients: ${recipients.map(r => r.email).join(', ')}`);

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
            console.log(`🔔 [LunchService] Attempting to send Work Zone typed notification for ${formattedDate}`);
            try {
                await sendTypedNotification({
                    recipients: recipients.map(s => s.email),
                    notificationTypeKey: 'MenuConfirmed',
                    notificationTypeVersion: '1',
                    priority: 'NEUTRAL',
                    data: {
                        date: formattedDate
                    }
                });
                console.log(`🔔 [LunchService] Work Zone typed notification sent successfully.`);
            } catch (err) {
                console.error('🔔 [LunchService] ERROR sending Work Zone typed notification:', err.message || err);
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

            const KNOWN_SCOPES = [
                'CMNA_READ_ASSIGNED_USER',
                'CMNA_READ_ALL_USER',
                'CMNA_ADD_USER',
                'CMNA_UPDATE_USER',
                'CMNA_DELETE_USER',
            ];
            const ROLE_TEMPLATE_SCOPE_MAP = {
                CMNA_USER: ['CMNA_READ_ASSIGNED_USER'],
                CMNA_ADMIN: [
                    'CMNA_ADD_USER',
                    'CMNA_DELETE_USER',
                    'CMNA_READ_ASSIGNED_USER',
                    'CMNA_READ_ALL_USER',
                    'CMNA_UPDATE_USER',
                ],
            };
            const AUTH_TRACE_ENABLED = String(process.env.AUTH_TRACE || '').toLowerCase() === 'true';

            const asTrimmedString = (value) => {
                if (typeof value === 'string' && value.trim()) return value.trim();
                return null;
            };

            const toFirstString = (...values) => {
                for (const value of values) {
                    if (Array.isArray(value)) {
                        const firstNonEmpty = value.find((entry) => typeof entry === 'string' && entry.trim());
                        if (firstNonEmpty) return firstNonEmpty.trim();
                        continue;
                    }
                    if (typeof value === 'string' && value.trim()) {
                        return value.trim();
                    }
                }
                return '';
            };

            const toStringArray = (value) => {
                if (Array.isArray(value)) {
                    return value
                        .filter((entry) => typeof entry === 'string')
                        .map((entry) => entry.trim())
                        .filter(Boolean);
                }
                if (typeof value === 'string' && value.trim()) {
                    return [value.trim()];
                }
                return [];
            };

            const uniqueSorted = (values) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
            const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
            const looksLikeEmail = (value) => typeof value === 'string' && value.includes('@');
            const normalizeScopeToRole = (value) => {
                const normalized = asTrimmedString(value);
                if (!normalized) return null;
                return normalized.includes('.') ? normalized.split('.').pop() : normalized;
            };
            const collectRolesFromUser = (targetUser) => uniqueSorted([
                ...Object.keys(targetUser?._roles || {}),
                ...toStringArray(targetUser?.roles),
                ...toStringArray(targetUser?.scopes),
            ].map(normalizeScopeToRole).filter(Boolean));
            const inferScopesFromReqUser = (targetUser) => KNOWN_SCOPES.filter((scope) => targetUser?.is?.(scope));
            const inferRoleTemplates = (resolvedScopes) => {
                const availableScopes = new Set(resolvedScopes.map(normalizeScopeToRole).filter(Boolean));
                return Object.entries(ROLE_TEMPLATE_SCOPE_MAP)
                    .filter(([, requiredScopes]) => requiredScopes.every((scope) => availableScopes.has(scope)))
                    .map(([roleTemplate]) => roleTemplate)
                    .sort((a, b) => a.localeCompare(b));
            };

            const getAttr = (attributeName) => {
                const attrValue = user.attr?.[attributeName];
                const fromUser = toStringArray(attrValue);
                if (fromUser.length > 0) return fromUser;

                const authInfoValue = user.authInfo?.getAttribute?.(attributeName);
                return toStringArray(authInfoValue);
            };

            const getNestedClaimValue = (source, path) => {
                if (!source || typeof source !== 'object') return null;
                return path.split('.').reduce((current, key) => {
                    if (current && typeof current === 'object' && key in current) {
                        return current[key];
                    }
                    return undefined;
                }, source);
            };

            const decodeJwtPayload = (token) => {
                if (!token || typeof token !== 'string') return {};
                const parts = token.split('.');
                if (parts.length < 2) return {};
                try {
                    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                    const padded = payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), '=');
                    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
                } catch (error) {
                    return {};
                }
            };

            const bearerToken = req.headers?.authorization || req.http?.req?.headers?.authorization || '';
            const rawToken = typeof bearerToken === 'string' && bearerToken.toLowerCase().startsWith('bearer ')
                ? bearerToken.slice(7)
                : '';
            const authPayload = {
                ...decodeJwtPayload(rawToken),
                ...(user.authInfo?.getPayload?.() || {}),
            };

            const rawEmail = toFirstString(
                getAttr('email'),
                getAttr('mail'),
                getAttr('user_name'),
                getAttr('preferred_username'),
                getAttr('subaccountuseremail'),
                getNestedClaimValue(authPayload, 'email'),
                getNestedClaimValue(authPayload, 'mail'),
                getNestedClaimValue(authPayload, 'upn'),
                getNestedClaimValue(authPayload, 'emails'),
                getNestedClaimValue(authPayload, 'ext_attr.email'),
                getNestedClaimValue(authPayload, 'ext_attr.mail'),
                looksLikeEmail(user.id) ? user.id : ''
            );

            const firstname = toFirstString(
                getAttr('given_name'),
                getAttr('givenName'),
                getAttr('firstname'),
                getNestedClaimValue(authPayload, 'given_name'),
                getNestedClaimValue(authPayload, 'givenName'),
                getNestedClaimValue(authPayload, 'ext_attr.given_name')
            );
            const lastname = toFirstString(
                getAttr('family_name'),
                getAttr('familyName'),
                getAttr('lastname'),
                getNestedClaimValue(authPayload, 'family_name'),
                getNestedClaimValue(authPayload, 'familyName'),
                getNestedClaimValue(authPayload, 'ext_attr.family_name')
            );
            const displayName = toFirstString(
                [firstname, lastname].filter(Boolean).join(' '),
                getAttr('name'),
                getAttr('display_name'),
                getAttr('displayName'),
                getNestedClaimValue(authPayload, 'name'),
                getNestedClaimValue(authPayload, 'display_name'),
                rawEmail,
                user.id
            );

            const email = normalize(rawEmail);
            const normalizedDisplayName = normalize(displayName);
            const normalizedUserId = normalize(user.id);
            const rawTokenScopes = uniqueSorted([
                ...toStringArray(authPayload.scope),
                ...toStringArray(authPayload.scopes),
                ...toStringArray(authPayload.authorities),
                ...toStringArray(user.scopes),
                ...toStringArray(req.user?.scopes),
            ]);

            const inferredScopes = inferScopesFromReqUser(user);
            const tokenScopes = uniqueSorted([
                ...rawTokenScopes,
                ...inferredScopes,
            ]);

            const reqUserRoles = uniqueSorted([
                ...collectRolesFromUser(user),
                ...collectRolesFromUser(req.user),
                ...inferredScopes,
            ]);

            const roleCollections = uniqueSorted([
                ...toStringArray(getNestedClaimValue(authPayload, 'xs.system.attributes.xs.rolecollections')),
                ...toStringArray(getNestedClaimValue(authPayload, 'xs.rolecollections')),
                ...toStringArray(getNestedClaimValue(authPayload, 'xs.system.attributes.rolecollections')),
                ...toStringArray(getNestedClaimValue(authPayload, 'role_collections')),
                ...toStringArray(getNestedClaimValue(authPayload, 'granted_roles')),
                ...toStringArray(getNestedClaimValue(authPayload, 'groups')),
            ]);

            const genericRoles = new Set(['any', 'authenticated-user', 'identified-user']);
            const roles = uniqueSorted([
                ...reqUserRoles.map(normalizeScopeToRole),
                ...toStringArray(getAttr('roles')).map(normalizeScopeToRole),
                ...tokenScopes.map(normalizeScopeToRole),
                ...roleCollections.map(normalizeScopeToRole),
            ].filter((role) => role && !genericRoles.has(role)));

            const scopes = uniqueSorted([
                ...tokenScopes,
                ...roleCollections,
            ]);
            const roleTemplates = uniqueSorted([
                ...roleCollections,
                ...inferRoleTemplates(scopes),
            ]);

            // In BTP, req.user.id can be a GUID, so we match against Staff using email/name claims instead.
            const allStaff = await SELECT.from(Staff);
            const matchedStaff = allStaff.find((staff) => {
                const staffEmail = normalize(staff.email);
                const staffName = normalize(staff.name);
                return (
                    (email && staffEmail === email) ||
                    (normalizedDisplayName && staffName === normalizedDisplayName) ||
                    (normalizedUserId && staffEmail === normalizedUserId) ||
                    (normalizedUserId && staffName === normalizedUserId)
                );
            }) || null;

            if (AUTH_TRACE_ENABLED) {
                console.log('[getCurrentUser TRACE]', JSON.stringify({
                    userId: user.id,
                    email,
                    displayName,
                    grantType: authPayload.grant_type || '',
                    authInfoPayloadKeys: Object.keys(authPayload || {}),
                    tokenScopes,
                    roleCollections,
                    roles,
                    roleTemplates,
                    inferredScopes,
                    userRolesRaw: user._roles || {},
                    userScopesRaw: user.scopes || [],
                    userAttrKeys: Object.keys(user.attr || {}),
                }, null, 2));
            }

            return {
                name: user.id,
                email: rawEmail || user.id,
                firstname,
                lastname,
                displayName,
                scopes: scopes.join(','),
                roles: roles.join(','),
                roleTemplates: roleTemplates.join(','),
                tokenScopes: tokenScopes.join(','),
                grantType: authPayload.grant_type || '',
                isAdmin: req.user.is('CMNA_READ_ALL_USER'),
                staff: matchedStaff
            };
        });

        // Detect when a food item is removed from the daily menu
        this.after('UPDATE', 'Catalog', async (data, req) => {
            console.log('🔔 [LunchService] Catalog AFTER UPDATE hook triggered');
            console.log('🔔 [LunchService] req.data:', JSON.stringify(req.data));

            let updatedItem = data;
            if ((!updatedItem?.name) && req.data?.ID) {
                updatedItem = await SELECT.one.from(req.target).where({ ID: req.data.ID });
                console.log(`🔔 [LunchService] Re-fetched Catalog item for notification: ${JSON.stringify(updatedItem)}`);
            }

            // Using strict check to see if dailyMenu_ID is explicitly being set to null
            if (req.data && req.data.hasOwnProperty('dailyMenu_ID') && req.data.dailyMenu_ID === null) {
                console.log(`🔔 [LunchService] Detection confirmed: Food item ${updatedItem?.name || updatedItem?.ID} removed from menu.`);
                if (updatedItem && updatedItem.name) {
                    try {
                        const staffList = await SELECT.from(Staff).where({ status: true, notification: true });
                        const recipients = staffList.filter(s => s.email && s.email.trim() !== '').map(s => s.email);

                        if (recipients.length > 0) {
                            console.log(`🔔 [LunchService] Sending typed FoodRemoved notification to ${recipients.length} users.`);
                            await sendTypedNotification({
                                recipients: recipients,
                                notificationTypeKey: 'FoodRemoved',
                                notificationTypeVersion: '1',
                                priority: 'HIGH',
                                data: {
                                    foodName: updatedItem.name,
                                    date: 'today'
                                }
                            });
                            console.log(`🔔 [LunchService] Typed FoodRemoved Notification sent.`);
                        } else {
                            console.log('🔔 [LunchService] No eligible recipients for FoodRemoved notification.');
                        }
                    } catch (err) {
                        console.error('🔔 [LunchService] ERROR sending FoodRemoved notification:', err.message || err);
                    }
                }
            }
        });

        return super.init();
    }
}
