const cds = require('@sap/cds');
const { existsSync, readFileSync } = require('fs');
const { getDestination, buildHeadersForDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

const NOTIFICATION_API_BASE_PATH = '/v2/Notification.svc';
const NOTIFICATION_TYPE_API_BASE_PATH = '/v2/NotificationType.svc';
const ALLOWED_PRIORITIES = new Set(['LOW', 'NEUTRAL', 'MEDIUM', 'HIGH']);
const DESTINATION_NAME = 'Alert_Notification_Connectivity_ANS';

function getConfig() {
    return cds.env.requires?.workzoneNotifications || {};
}

function getTypesFilePath() {
    return getConfig().types || 'srv/notification-types.json';
}

function normalizePriority(priority = 'NEUTRAL') {
    const normalized = String(priority).toUpperCase();
    return ALLOWED_PRIORITIES.has(normalized) ? normalized : 'NEUTRAL';
}

async function getNotificationDestination() {
    console.log(`🔔 [WorkZoneNotifications] Resolving destination '${DESTINATION_NAME}'...`);
    const destination = await getDestination({ destinationName: DESTINATION_NAME, useCache: true });
    if (!destination) {
        throw new Error(`Failed to resolve destination '${DESTINATION_NAME}'.`);
    }
    console.log(`🔔 [WorkZoneNotifications] Destination '${DESTINATION_NAME}' resolved successfully.`);
    return destination;
}

async function executeNotificationRequest(destination, requestConfig) {
    console.log(`🔔 [WorkZoneNotifications] Preparing authenticated request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
    const headers = await buildHeadersForDestination(destination, { url: requestConfig.url });
    console.log(`🔔 [WorkZoneNotifications] Auth headers built for ${requestConfig.url}.`);
    const finalRequest = {
        ...requestConfig,
        headers: {
            ...headers,
            ...(requestConfig.headers || {})
        }
    };

    try {
        return await executeHttpRequest(destination, finalRequest);
    } catch (error) {
        const response = error.response || {};
        const responseHeaders = response.headers || {};
        const authHeader = finalRequest.headers?.authorization || finalRequest.headers?.Authorization || '';
        const bearerPrefix = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.slice(0, 24) + '...'
            : '[missing]';

        console.error(`🔔 [WorkZoneNotifications] Request failed: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        console.error(`🔔 [WorkZoneNotifications] Response status: ${response.status || '[none]'}`);
        console.error(`🔔 [WorkZoneNotifications] Response body: ${JSON.stringify(response.data || error.message || null)}`);
        console.error(`🔔 [WorkZoneNotifications] www-authenticate: ${responseHeaders['www-authenticate'] || responseHeaders['WWW-Authenticate'] || '[missing]'}`);
        console.error(`🔔 [WorkZoneNotifications] Response headers: ${JSON.stringify(responseHeaders)}`);
        console.error(`🔔 [WorkZoneNotifications] Destination name: ${DESTINATION_NAME}`);
        console.error(`🔔 [WorkZoneNotifications] Destination URL: ${destination.url || '[missing]'}`);
        console.error(`🔔 [WorkZoneNotifications] Request authorization prefix: ${bearerPrefix}`);
        console.error(`🔔 [WorkZoneNotifications] Request header keys: ${JSON.stringify(Object.keys(finalRequest.headers || {}))}`);
        console.error(`🔔 [WorkZoneNotifications] Request payload: ${JSON.stringify(requestConfig.data || null)}`);

        throw error;
    }
}

function loadNotificationTypes() {
    const filePath = getTypesFilePath();
    console.log(`🔔 [WorkZoneNotifications] Loading notification types from '${filePath}'...`);
    if (!existsSync(filePath)) {
        throw new Error(`Notification types file not found: ${filePath}`);
    }

    const notificationTypes = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!Array.isArray(notificationTypes)) {
        throw new Error(`Notification types file must contain an array: ${filePath}`);
    }

    console.log(`🔔 [WorkZoneNotifications] Loaded ${notificationTypes.length} notification type definition(s).`);
    return notificationTypes;
}

async function getExistingNotificationTypes(destination) {
    console.log('🔔 [WorkZoneNotifications] Fetching existing notification types from Alert Notification service...');
    const response = await executeNotificationRequest(destination, {
        url: `${NOTIFICATION_TYPE_API_BASE_PATH}/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels`,
        method: 'get'
    });

    const existingTypes = response.data?.d?.results || response.data?.value || [];
    console.log(`🔔 [WorkZoneNotifications] Retrieved ${existingTypes.length} existing notification type(s).`);
    return existingTypes;
}

function indexNotificationTypes(notificationTypes) {
    const indexed = new Map();
    for (const type of notificationTypes) {
        indexed.set(`${type.NotificationTypeKey}:${type.NotificationTypeVersion}`, type);
    }
    return indexed;
}

async function publishNotificationTypes() {
    console.log('🔔 [WorkZoneNotifications] Starting notification type publication flow...');
    const destination = await getNotificationDestination();
    const expectedTypes = loadNotificationTypes();
    const existingTypes = indexNotificationTypes(await getExistingNotificationTypes(destination));

    for (const notificationType of expectedTypes) {
        const key = `${notificationType.NotificationTypeKey}:${notificationType.NotificationTypeVersion}`;
        if (existingTypes.has(key)) {
            console.log(`🔔 [WorkZoneNotifications] Notification type already exists, skipping: ${key}`);
            continue;
        }

        console.log(`🔔 [WorkZoneNotifications] Publishing notification type: ${key}`);
        await executeNotificationRequest(destination, {
            url: `${NOTIFICATION_TYPE_API_BASE_PATH}/NotificationTypes`,
            method: 'post',
            data: notificationType
        });
        console.log(`🔔 [WorkZoneNotifications] Published notification type successfully: ${key}`);
    }

    console.log('🔔 [WorkZoneNotifications] Notification type publication flow finished.');
}

function buildProperties(data = {}) {
    return Object.entries(data).map(([key, value]) => ({
        Key: key,
        Language: 'en',
        Value: String(value),
        Type: 'String',
        IsSensitive: false
    }));
}

function buildTypedNotification({
    recipients,
    notificationTypeKey,
    notificationTypeVersion = '1.0',
    data = {},
    priority = 'NEUTRAL',
    navigationTargetAction,
    navigationTargetObject,
    originId
}) {
    return {
        NotificationTypeKey: notificationTypeKey,
        NotificationTypeVersion: notificationTypeVersion,
        Priority: normalizePriority(priority),
        NavigationTargetAction: navigationTargetAction,
        NavigationTargetObject: navigationTargetObject,
        OriginId: originId,
        Properties: buildProperties(data),
        Recipients: recipients.map(recipient => ({ RecipientId: recipient }))
    };
}

async function sendTypedNotification(payload) {
    if (!Array.isArray(payload.recipients) || payload.recipients.length === 0) {
        console.log('🔔 [WorkZoneNotifications] No recipients provided for typed notification. Skipping send.');
        return;
    }

    console.log(`🔔 [WorkZoneNotifications] Sending typed notification '${payload.notificationTypeKey}:${payload.notificationTypeVersion || '1.0'}' to ${payload.recipients.length} recipient(s).`);
    const destination = await getNotificationDestination();
    await executeNotificationRequest(destination, {
        url: `${NOTIFICATION_API_BASE_PATH}/Notifications`,
        method: 'post',
        data: buildTypedNotification(payload)
    });
    console.log(`🔔 [WorkZoneNotifications] Typed notification '${payload.notificationTypeKey}:${payload.notificationTypeVersion || '1.0'}' sent successfully.`);
}

module.exports = {
    publishNotificationTypes,
    sendTypedNotification
};
