import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Logger utility to append logs to a file (async, non-blocking)
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
    const timestamp = new Date().toISOString();

    const app = data.originApp || 'unknown';
    const ip = data.ipAddress || 'unknown';

    const logEntry = `[${timestamp}] RequestID: ${requestId} | App: ${app} | User: ${data.userEmail} | IP: ${ip} | Source: ${data.sourceUrl} | Status: ${data.status}${data.error ? ` | Error: ${data.error}` : ''}\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'requests.log');

    // Fire-and-forget async logging (don't block caller)
    (async () => {
        try {
            // Ensure directory exists
            await fs.promises.mkdir(logDir, { recursive: true });

            // Append to log file
            await fs.promises.appendFile(logFile, logEntry);
        } catch (error) {
            console.error('Error logging request:', error);
        }
    })();

    return requestId;
}
