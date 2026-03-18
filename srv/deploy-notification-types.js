const { publishNotificationTypes } = require('./lib/workzone-notification-service');

async function main() {
    await publishNotificationTypes();
    console.log('[deploy:notification-types] Notification types deployment finished.');
}

main().catch((error) => {
    console.error('[deploy:notification-types] Deployment failed:', error.message || error);
    process.exitCode = 1;
});
