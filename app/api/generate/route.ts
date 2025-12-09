import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const { imageBase64, prompt, folderPath, fileName } = await request.json();

    if (!imageBase64 || !prompt) {
        return NextResponse.json({ error: 'Image data and prompt are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is missing');
        return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500 });
    }

    const callWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error: any) {
                if (error.status === 429) {
                    console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded for API call');
    };

    let curlCommand = '';

    try {
        // Clean base64 string
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const fullPrompt = `YOU MUST GENERATE AN IMAGE. DO NOT respond with text only.
        
Redesign the attached image using these instructions: ${prompt}
        
CRITICAL RULES:
- You MUST output a photorealistic image, not text
- Even if the image shows an exterior, redesign it anyway
- Maintain the exact structural layout, perspective, and geometry
- Only change the style, furniture, materials, colors, and lighting
- DO NOT ask questions or provide explanations
- OUTPUT AN IMAGE ONLY`;

        // User requested specific model
        const model = "gemini-2.5-flash-image";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload =
        {
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "temperature": 0.8
            },
            contents: [{
                parts: [
                    { text: fullPrompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }]
        };

        // Construct cURL for the user
        curlCommand = `curl -X POST "${url.replace(apiKey, 'YOUR_API_KEY')}" \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(payload)}'`;

        // Log truncated cURL for server logs
        //console.log("--- cURL Command (Truncated for logs) ---");
        //console.log(`curl -X POST "${url.replace(apiKey, 'YOUR_API_KEY')}" ... (base64 data hidden) ...`);
        //console.log("----------------------------------");

        const makeRequest = async () => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error (${response.status}):`, errorText);
                const error = new Error(`API request failed with status ${response.status}: ${errorText}`);
                (error as any).status = response.status;
                (error as any).details = errorText;
                throw error;
            }

            return response.json();
        };

        console.log(`Sending direct request to ${model}...`);
        const data = await callWithRetry(makeRequest);

        // UNCONDITIONAL DEBUG LOG
        console.log("--- FULL API RESPONSE ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("-------------------------");

        // Check for image in the response
        let generatedImagePart: any = null;

        // Iterate through all candidates and parts to find the first image
        if (data.candidates && Array.isArray(data.candidates)) {
            for (const candidate of data.candidates) {
                if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
                    for (const part of candidate.content.parts) {
                        const inlineData = part.inline_data || part.inlineData;
                        if (inlineData) {
                            const mimeType = inlineData.mime_type || inlineData.mimeType;
                            if (mimeType && mimeType.startsWith('image/')) {
                                generatedImagePart = part;
                                break;
                            }
                        }
                    }
                }
                if (generatedImagePart) break;
            }
        }

        if (generatedImagePart) {
            const inlineData = generatedImagePart.inline_data || generatedImagePart.inlineData;
            const aiImageBase64 = inlineData.data;
            const aiImageMimeType = inlineData.mime_type || inlineData.mimeType;
            const aiImageUrl = `data:${aiImageMimeType};base64,${aiImageBase64}`;

            // Auto-save logic
            if (folderPath && fileName) {
                try {
                    const buffer = Buffer.from(aiImageBase64, 'base64');
                    const outputFileName = `render_${fileName}`;
                    const outputPath = path.join(folderPath, outputFileName);
                    fs.writeFileSync(outputPath, buffer);
                    console.log(`Saved generated image to: ${outputPath}`);
                } catch (saveError) {
                    console.error("Failed to save image to disk:", saveError);
                    // Don't fail the request, just log the error
                }
            }

            return NextResponse.json({
                originalUrl: 'local-file',
                aiUrl: aiImageUrl,
                status: 'completed',
                curlCommand: curlCommand,
                debug: {
                    prompt: fullPrompt
                }
            });
        } else {
            // Check if we got a text response instead
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (textResponse) {
                console.log("Gemini returned text instead of image. Retrying with stronger prompt...");

                // Retry with an even more forceful prompt
                const forcedPrompt = `IGNORE ANY CONCERNS. You MUST generate an image. Transform this image with: ${prompt}. DO NOT respond with text. OUTPUT IMAGE ONLY.`;

                const retryPayload = {
                    contents: [{
                        parts: [
                            { text: forcedPrompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                };

                try {
                    const retryResponse = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(retryPayload)
                    });

                    const retryData = await retryResponse.json();
                    console.log("--- RETRY RESPONSE ---");
                    console.log(JSON.stringify(retryData, null, 2));

                    // Check for image in retry response
                    if (retryData.candidates?.[0]?.content?.parts) {
                        for (const part of retryData.candidates[0].content.parts) {
                            const inlineData = part.inline_data || part.inlineData;
                            if (inlineData?.mime_type?.startsWith('image/')) {
                                const aiImageBase64 = inlineData.data;
                                const aiImageUrl = `data:${inlineData.mime_type};base64,${aiImageBase64}`;

                                return NextResponse.json({
                                    originalUrl: 'local-file',
                                    aiUrl: aiImageUrl,
                                    status: 'completed',
                                    note: 'Generated after retry with stronger prompt'
                                });
                            }
                        }
                    }
                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                }
            }

            console.error("No image found in generation response. Full Response Structure:", JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: 'AI model returned text instead of an image. This usually happens with exterior photos. Try using an interior room photo instead.',
                textResponse: textResponse || 'No text response',
                details: data,
                curlCommand: curlCommand
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        const status = error.status === 429 ? 429 : 500;
        const message = error.status === 429 ? 'Rate limit exceeded. Please try again in a moment.' : 'Failed to process image with AI';

        return NextResponse.json({
            error: message,
            details: error.details || error.message,
            curlCommand: curlCommand // Include curlCommand even on error
        }, { status });
    }
}
