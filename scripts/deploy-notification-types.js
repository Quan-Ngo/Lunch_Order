const cds = require('@sap/cds');

async function main() {
    const profileInfo = cds.env.profiles?.length ? cds.env.profiles.join(', ') : 'none';
    const typesPath = cds.env.requires?.notifications?.types;

    console.log(`[deploy:notification-types] cds profiles: ${profileInfo}`);
    console.log(`[deploy:notification-types] notification types path: ${typesPath || 'not configured'}`);

    if (!typesPath) {
        throw new Error('cds.requires.notifications.types is not configured.');
    }

    const { deployNotificationTypes } = require('@cap-js/notifications/lib/content-deployment');
    await deployNotificationTypes();
    console.log('[deploy:notification-types] Notification types deployment finished.');
}

main().catch((error) => {
    console.error('[deploy:notification-types] Deployment failed:', error.message || error);
    process.exitCode = 1;
});
