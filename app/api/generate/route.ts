import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyGoogleToken } from '../verify-token';
import { logRequest } from '../../lib/logger';
import { uploadToGCS } from '../../lib/storage';

import { STYLE_PROMPTS } from './style-prompts';

export async function POST(request: Request) {
    // Generate UUID for this request
    const requestId = randomUUID();

    // Extract and verify auth token
    const authHeader = request.headers.get('authorization');

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // CHECK FOR BYPASS KEY
        const bypassKey = request.headers.get('x-api-key');
        if (bypassKey && process.env.API_BYPASS_KEY && bypassKey === process.env.API_BYPASS_KEY) {
            console.log(`[${requestId}] Auth Bypass Key used. Skipping token verification.`);
            // Proceed with dummy user
        } else {
            logRequest({
                requestId,
                userEmail: 'unknown',
                sourceUrl: 'unknown',
                originApp: 'unknown',
                ipAddress,
                status: 'AUTH_FAILED',
                error: 'No token provided'
            });
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }
    }

    let userEmail = 'dev-bypass-user'; // Default for bypass

    // Verify Google OAuth token (only if not bypassed)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log(`[${requestId}] Auth Header present. Verifying token...`);

        try {
            const userInfo = await verifyGoogleToken(token);
            userEmail = userInfo.email;
        } catch (error) {
            console.error('Token verification failed:', error);
            // Log the failed auth attempt
            logRequest({
                requestId,
                userEmail: 'unknown',
                sourceUrl: 'unknown',
                originApp: 'unknown',
                ipAddress,
                status: 'AUTH_FAILED',
                error: 'Invalid token'
            });
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }
    }

    const { imageBase64, styleId, customPrompt, metadata, folderPath, fileName } = await request.json();

    const originApp = metadata?.originApp || 'unknown';
    const sourceUrl = metadata?.sourceUrl || 'Unknown Source';

    // Log request processing start with style info
    console.log(`[${requestId}] Image generation request from user: ${userEmail} | Style: ${styleId || 'custom'} | IP: ${ipAddress}`);

    // Resolve Prompt
    let prompt = '';

    if (styleId && STYLE_PROMPTS[styleId]) {
        console.log(`[${requestId}] Using server-side prompt for style: ${styleId}`);
        prompt = "Redesign this room. " + STYLE_PROMPTS[styleId];
    } else if (customPrompt) {
        console.log(`[${requestId}] Using custom user prompt`);
        prompt = "Redesign this room. " + customPrompt;
    } else {
        return NextResponse.json({ error: 'Missing styleId or valid customPrompt' }, { status: 400 });
    }

    if (!imageBase64) {
        logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'FAILED', error: 'Missing image or prompt' });
        return NextResponse.json({ error: 'Image data and prompt are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is missing');
        logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'FAILED', error: 'Server config error' });
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

Rerender the attached image into a luxury house setting. Focus on resell value for the house and touch up this room to make it visually fantastic. 
You CAN NOT change the structural layout of the room. You should work with light colors like white, black trim and wood accents to make it look expensive. 
Always think about redoing flooring and walls. You should furnish the rooms too so it looks like they are nicely staged.
        
Specific Style Instructions: ${prompt}
        
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

        // Debug logging (minimized for production per user request)
        // console.log("--- FULL API RESPONSE ---");
        // console.log(JSON.stringify(data, null, 2));
        // console.log("-------------------------");

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

            // Persist images to GCS
            const extension = aiImageMimeType.includes('png') ? 'png' : 'jpg';

            try {
                // Prepare buffers
                const originalImageBuffer = Buffer.from(base64Data, 'base64');
                const aiImageBuffer = Buffer.from(aiImageBase64, 'base64');

                const originalPath = `images/OG_${requestId}.${extension}`;
                const aiPath = `images/AI_${requestId}.${extension}`;

                console.log(`[${requestId}] Uploading images to GCS...`);

                // Upload to GCS in parallel and await completion to ensure persistence
                const [originalUrl, aiUrl] = await Promise.all([
                    uploadToGCS(originalImageBuffer, originalPath, aiImageMimeType.includes('png') ? 'image/png' : 'image/jpeg'),
                    uploadToGCS(aiImageBuffer, aiPath, aiImageMimeType)
                ]);

                console.log(`[${requestId}] Saved to GCS: ${originalUrl}`);
                console.log(`[${requestId}] Saved to GCS: ${aiUrl}`);

            } catch (saveError) {
                console.error(`[${requestId}] Failed to save images to GCS:`, saveError);
                // Don't fail the request if storage fails, just log it
            }

            logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'SUCCESS' });

            // Log final user success message
            console.log(`[${requestId}] Image generation response for user: ${userEmail} | Status: Success`);

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

                                logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'SUCCESS (RETRY)' });

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
            logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'FAILED', error: 'No image returned (Text response: ' + (textResponse ? 'Yes' : 'No') + ')' });

            return NextResponse.json({
                error: 'AI model returned text instead of an image. This usually happens with exterior photos. Try using an interior room photo instead.',
                textResponse: textResponse || 'No text response',
                details: data,
                curlCommand: curlCommand
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        logRequest({ requestId, userEmail, sourceUrl, originApp, ipAddress, status: 'FAILED', error: error.message || 'Unknown error' });

        const status = error.status === 429 ? 429 : 500;
        const message = error.status === 429 ? 'Rate limit exceeded. Please try again in a moment.' : 'Failed to process image with AI';

        return NextResponse.json({
            error: message,
            details: error.details || error.message,
            curlCommand: curlCommand // Include curlCommand even on error
        }, { status });
    }
}
