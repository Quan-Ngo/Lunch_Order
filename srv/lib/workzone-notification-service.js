const cds = require('@sap/cds');
const { existsSync, readFileSync } = require('fs');
const { getDestination, buildHeadersForDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

const NOTIFICATION_API_BASE_PATH = '/Notification.svc';
const NOTIFICATION_TYPE_API_BASE_PATH = '/NotificationType.svc';
const ALLOWED_PRIORITIES = new Set(['LOW', 'NEUTRAL', 'MEDIUM', 'HIGH']);

function getConfig() {
    return cds.env.requires?.workzoneNotifications || {};
}

function getDestinationName() {
    return process.env.WORKZONE_NOTIFICATIONS_DESTINATION
        || getConfig().destination
        || 'Alert_Notification_Connectivity_ANS';
}

function getTypesFilePath() {
    return getConfig().types || 'srv/notification-types.json';
}

function normalizePriority(priority = 'NEUTRAL') {
    const normalized = String(priority).toUpperCase();
    return ALLOWED_PRIORITIES.has(normalized) ? normalized : 'NEUTRAL';
}

async function getNotificationDestination() {
    const destinationName = getDestinationName();
    const destination = await getDestination({ destinationName, useCache: true });
    if (!destination) {
        throw new Error(`Failed to resolve destination '${destinationName}'.`);
    }
    return destination;
}

async function executeNotificationRequest(destination, requestConfig) {
    const headers = await buildHeadersForDestination(destination, { url: requestConfig.url });
    return executeHttpRequest(destination, {
        ...requestConfig,
        headers: {
            ...headers,
            ...(requestConfig.headers || {})
        }
    });
}

function loadNotificationTypes() {
    const filePath = getTypesFilePath();
    if (!existsSync(filePath)) {
        throw new Error(`Notification types file not found: ${filePath}`);
    }

    const notificationTypes = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!Array.isArray(notificationTypes)) {
        throw new Error(`Notification types file must contain an array: ${filePath}`);
    }

    return notificationTypes;
}

async function getExistingNotificationTypes(destination) {
    const response = await executeNotificationRequest(destination, {
        url: `${NOTIFICATION_TYPE_API_BASE_PATH}/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels`,
        method: 'get'
    });

    return response.data?.d?.results || response.data?.value || [];
}

function indexNotificationTypes(notificationTypes) {
    const indexed = new Map();
    for (const type of notificationTypes) {
        indexed.set(`${type.NotificationTypeKey}:${type.NotificationTypeVersion}`, type);
    }
    return indexed;
}

async function publishNotificationTypes() {
    const destination = await getNotificationDestination();
    const expectedTypes = loadNotificationTypes();
    const existingTypes = indexNotificationTypes(await getExistingNotificationTypes(destination));

    for (const notificationType of expectedTypes) {
        const key = `${notificationType.NotificationTypeKey}:${notificationType.NotificationTypeVersion}`;
        if (existingTypes.has(key)) {
            console.log(`[workzone-notifications] Notification type already exists: ${key}`);
            continue;
        }

        await executeNotificationRequest(destination, {
            url: `${NOTIFICATION_TYPE_API_BASE_PATH}/NotificationTypes`,
            method: 'post',
            data: notificationType
        });
        console.log(`[workzone-notifications] Published notification type: ${key}`);
    }
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
        return;
    }

    const destination = await getNotificationDestination();
    await executeNotificationRequest(destination, {
        url: `${NOTIFICATION_API_BASE_PATH}/Notifications`,
        method: 'post',
        data: buildTypedNotification(payload)
    });
}

module.exports = {
    publishNotificationTypes,
    sendTypedNotification
};
