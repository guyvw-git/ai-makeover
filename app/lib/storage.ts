import { Storage } from '@google-cloud/storage';

// Singleton instance
let storage: Storage | null = null;
let bucketName: string | null = null;

function getStorage() {
    if (!storage) {
        storage = new Storage();
    }
    return storage;
}

function getBucketName() {
    if (!bucketName) {
        bucketName = process.env.GCS_BUCKET_NAME || '';
        if (!bucketName) {
            console.error('GCS_BUCKET_NAME environment variable is not set. Images may not be saved.');
        }
    }
    return bucketName;
}

/**
 * Uploads a buffer to Google Cloud Storage.
 * @param buffer The file content as a Buffer
 * @param destinationPath The path in the bucket (e.g., 'images/file.jpg')
 * @param mimeType The MIME type of the file
 * @returns The authenticated URL of the uploaded file (storage.cloud.google.com)
 */
export async function uploadToGCS(buffer: Buffer, destinationPath: string, mimeType: string): Promise<string> {
    const bucket = getBucketName();
    if (!bucket) {
        console.warn('Skipping GCS upload: GCS_BUCKET_NAME not set');
        return '';
    }

    const file = getStorage().bucket(bucket).file(destinationPath);

    try {
        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
            },
            resumable: false
        });

        // Return a console-clickable link for the logs
        return `https://storage.cloud.google.com/${bucket}/${destinationPath}`;
    } catch (error) {
        console.error(`Failed to upload to GCS (${destinationPath}):`, error);
        throw error;
    }
}
