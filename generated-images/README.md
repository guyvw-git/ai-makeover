# Generated Images Directory

This directory contains all AI-generated images from the application, along with their original source images.

## File Naming Convention

For each generation request, **two images** are saved with UUID filenames that correspond to the `RequestID` in `/logs/requests.log`:

- **Original Image**: `OG_{uuid}.{extension}` - The source image submitted for transformation
- **AI-Generated Image**: `AI_{uuid}.{extension}` - The AI-transformed result

**Format**: 
- `OG_{uuid}.{extension}` (Original)
- `AI_{uuid}.{extension}` (AI-Generated)

**Example**: 
- `OG_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg` (Original)
- `AI_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg` (AI-Generated)

## Correlating Images with Logs

To find the log entry for a specific image pair:

```bash
# Search for the UUID in the log file (remove the OG_ or AI_ prefix)
grep "a1b2c3d4-e5f6-7890-abcd-ef1234567890" logs/requests.log
```

Example log entry:
```
[2025-12-14T19:52:39.123Z] RequestID: a1b2c3d4-e5f6-7890-abcd-ef1234567890 | User: user@example.com | Source: https://zillow.com | Status: SUCCESS
```

## Directory Structure

```
generated-images/
├── README.md (this file)
├── OG_{uuid-1}.jpg          # Original image
├── AI_{uuid-1}.jpg          # AI-generated version
├── OG_{uuid-2}.jpg          # Original image
├── AI_{uuid-2}.jpg          # AI-generated version
└── ...
```

## Viewing Before/After Pairs

To view a before/after pair for a specific request:

```bash
# List both images for a specific UUID
ls generated-images/*a1b2c3d4-e5f6-7890-abcd-ef1234567890*

# Output:
# generated-images/OG_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
# generated-images/AI_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

## Cleanup

Images are never automatically deleted. To clean up old images:

```bash
# Remove all image pairs older than 30 days
find generated-images -name "OG_*.jpg" -o -name "AI_*.jpg" -o -name "OG_*.png" -o -name "AI_*.png" -mtime +30 -delete
```

## Storage Considerations

Each generation request creates **2 files** (original + AI-generated), so storage usage is approximately double the size of the AI-generated images alone. Monitor disk usage periodically and clean up old images as needed.

