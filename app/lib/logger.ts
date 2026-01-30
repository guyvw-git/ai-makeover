import { randomUUID } from 'crypto';
import path from 'path';

// Logger utility using structured logging for Google Cloud Logging
export function logRequest(data: {
    requestId?: string; // Optional - will be generated if not provided
    userEmail: string;
    sourceUrl: string;
    originApp?: string; // e.g., 'chrome-extension', 'web-app'
    ipAddress?: string;
    originalUrl?: string;
    status: string;
    error?: string;
}): string {
    // Generate UUID if not provided
    const requestId = data.requestId || randomUUID();

    const app = data.originApp || 'unknown';
    const ip = data.ipAddress || 'unknown';

    const logEntry = {
        severity: data.status === 'SUCCESS' || data.status === 'SUCCESS (RETRY)' ? 'INFO' : 'ERROR',
        message: `Request ${requestId}: ${data.status}`,
        requestId: requestId,
        component: 'api-server',
        user: data.userEmail || 'unknown', // Ensure this field exists in JSON
        ip: ip,
        sourceUrl: data.sourceUrl,
        originApp: app,
        status: data.status,
        error: data.error,
        originalUrl: data.originalUrl
    };

    // Write to stdout (for INFO) or stderr (for ERROR)
    if (logEntry.severity === 'ERROR') {
        console.error(JSON.stringify(logEntry));
    } else {
        console.log(JSON.stringify(logEntry));
    }

    return requestId;
}
