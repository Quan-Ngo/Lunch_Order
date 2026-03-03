const cds = require('@sap/cds');
const axios = require('axios');

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

        return super.init();
    }
}
