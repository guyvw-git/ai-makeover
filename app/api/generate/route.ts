import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { verifyGoogleToken } from '../verify-token';
import { logRequest } from '../../lib/logger';

export async function POST(request: Request) {
    // Generate UUID for this request
    const requestId = randomUUID();

    // Extract and verify auth token
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify Google OAuth token
    let userEmail: string;

    console.log(`[${requestId}] Auth Header present. Verifying token...`);

    try {
        const userInfo = await verifyGoogleToken(token);
        userEmail = userInfo.email;
        console.log(`[${requestId}] Image generation request from user: ${userEmail}`);
    } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { imageBase64, prompt, metadata, folderPath, fileName } = await request.json();
    const sourceUrl = metadata?.sourceUrl || 'Unknown Source';

    if (!imageBase64 || !prompt) {
        logRequest({ requestId, userEmail, sourceUrl, status: 'FAILED', error: 'Missing image or prompt' });
        return NextResponse.json({ error: 'Image data and prompt are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is missing');
        logRequest({ requestId, userEmail, sourceUrl, status: 'FAILED', error: 'Server config error' });
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
                // console.error(`API Error (${response.status}):`, errorText);
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

            // Persist images asynchronously (fire-and-forget, don't block response)
            const generatedImagesDir = path.join(process.cwd(), 'generated-images');
            const extension = aiImageMimeType.includes('png') ? 'png' : 'jpg';

            // Fire-and-forget async image persistence
            (async () => {
                try {
                    // Ensure directory exists
                    await fs.promises.mkdir(generatedImagesDir, { recursive: true });

                    // Prepare buffers
                    const originalImageBuffer = Buffer.from(base64Data, 'base64');
                    const aiImageBuffer = Buffer.from(aiImageBase64, 'base64');

                    // Save both images in parallel
                    const originalImagePath = path.join(generatedImagesDir, `OG_${requestId}.${extension}`);
                    const aiImagePath = path.join(generatedImagesDir, `AI_${requestId}.${extension}`);

                    await Promise.all([
                        fs.promises.writeFile(originalImagePath, originalImageBuffer),
                        fs.promises.writeFile(aiImagePath, aiImageBuffer)
                    ]);

                    console.log(`[${requestId}] Saved original image to: ${originalImagePath}`);
                    console.log(`[${requestId}] Saved AI-generated image to: ${aiImagePath}`);

                    // Optional: Also save to user-specified folder if provided
                    if (folderPath && fileName) {
                        try {
                            const outputFileName = `render_${fileName}`;
                            const outputPath = path.join(folderPath, outputFileName);
                            await fs.promises.writeFile(outputPath, aiImageBuffer);
                            console.log(`[${requestId}] Also saved to user folder: ${outputPath}`);
                        } catch (userFolderError) {
                            console.error(`[${requestId}] Failed to save to user folder:`, userFolderError);
                        }
                    }
                } catch (saveError) {
                    console.error(`[${requestId}] Failed to save images to disk:`, saveError);
                }
            })(); // Immediately invoke, don't await

            logRequest({ requestId, userEmail, sourceUrl, status: 'SUCCESS' });

            // Return response immediately without waiting for file writes (except for product analysis which we await)

            // --- PRODUCT IDENTIFICATION (Monetization) ---
            let productSuggestions: any[] = [];
            try {
                console.log(`[${requestId}] identifying products in generated image...`);
                const analysisModel = "gemini-1.5-flash";
                const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/${analysisModel}:generateContent?key=${apiKey}`;

                const analysisPrompt = `Identify 3 distinctly different furniture or decor items in this image that a user might want to buy. 
                Focus on the most prominent items (e.g. Sofa, Rug, Chandelier, Coffee Table).
                
                Return a raw JSON list (no markdown) where each item has:
                - label: A short, display-friendly name (e.g. "Velvet Sofa")
                - query: A specific search query to find this exact style on Amazon (e.g. "Green velvet tufted sofa modern")
                
                Example output:
                [
                  {"label": "Modern Rug", "query": "Geometric wool rug grey modern"},
                  {"label": "Arc Lamp", "query": "Gold arc floor lamp marble base"}
                ]`;

                const analysisPayload = {
                    "generationConfig": {
                        "response_mime_type": "application/json"
                    },
                    contents: [{
                        parts: [
                            { text: analysisPrompt },
                            {
                                inline_data: {
                                    mime_type: aiImageMimeType,
                                    data: aiImageBase64
                                }
                            }
                        ]
                    }]
                };

                const analysisResponse = await fetch(analysisUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(analysisPayload)
                });

                if (analysisResponse.ok) {
                    const analysisData = await analysisResponse.json();
                    const text = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        try {
                            // Clean potential markdown code blocks just in case
                            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                            productSuggestions = JSON.parse(cleanedText);
                            console.log(`[${requestId}] Identified ${productSuggestions.length} products`);
                        } catch (parseError) {
                            console.error(`[${requestId}] Failed to parse product JSON:`, parseError);
                            // Fallback to empty
                        }
                    }
                } else {
                    console.warn(`[${requestId}] Product analysis failed: ${analysisResponse.status}`);
                }
            } catch (analysisError) {
                console.error(`[${requestId}] Product analysis error:`, analysisError);
            }
            // ---------------------------------------------

            return NextResponse.json({
                originalUrl: 'local-file',
                aiUrl: aiImageUrl,
                status: 'completed',
                requestId: requestId,
                curlCommand: curlCommand,
                products: productSuggestions,
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

                                logRequest({ requestId, userEmail, sourceUrl, status: 'SUCCESS (RETRY)' });

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
            logRequest({ requestId, userEmail, sourceUrl, status: 'FAILED', error: 'No image returned (Text response: ' + (textResponse ? 'Yes' : 'No') + ')' });

            return NextResponse.json({
                error: 'AI model returned text instead of an image. This usually happens with exterior photos. Try using an interior room photo instead.',
                textResponse: textResponse || 'No text response',
                details: data,
                curlCommand: curlCommand
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        logRequest({ requestId, userEmail, sourceUrl, status: 'FAILED', error: error.message || 'Unknown error' });

        const status = error.status === 429 ? 429 : 500;
        const message = error.status === 429 ? 'Rate limit exceeded. Please try again in a moment.' : 'Failed to process image with AI';

        return NextResponse.json({
            error: message,
            details: error.details || error.message,
            curlCommand: curlCommand // Include curlCommand even on error
        }, { status });
    }
}
