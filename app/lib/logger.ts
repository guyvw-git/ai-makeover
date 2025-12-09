import fs from 'fs';
import path from 'path';

// Logger utility to append logs to a file
export function logRequest(data: {
    userEmail: string;
    sourceUrl: string;
    originalUrl?: string;
    status: string;
    error?: string;
}) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] User: ${data.userEmail} | Source: ${data.sourceUrl} | Status: ${data.status}${data.error ? ` | Error: ${data.error}` : ''}\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'requests.log');

    try {
        // Ensure directory exists (async check/create is safer but sync is fine here for simplicity/low volume)
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.appendFile(logFile, logEntry, (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    } catch (error) {
        console.error('Error logging request:', error);
    }
}
