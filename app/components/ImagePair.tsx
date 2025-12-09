'use client';

import { useState, useEffect, useRef } from 'react';

import { DESIGN_STYLES, DesignStyle } from '../data/styles';

interface ImagePairProps {
    originalUrl: string;
    onGenerate: () => void;
    aiUrl?: string;
    isGenerating: boolean;
    curlCommand?: string;
    prompt: string;
    onPromptChange: (newPrompt: string) => void;
}

export default function ImagePair({ originalUrl, onGenerate, aiUrl, isGenerating, curlCommand, prompt, onPromptChange }: ImagePairProps) {
    const [isComparing, setIsComparing] = useState(false);
    const [opacity, setOpacity] = useState(85);
    const [waitingForAutoCompare, setWaitingForAutoCompare] = useState(false);
    const [showMagicInput, setShowMagicInput] = useState(false);
    const [magicPrompt, setMagicPrompt] = useState('');
    const [showStyleSelector, setShowStyleSelector] = useState(false);
    const magicInputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (magicInputRef.current && !magicInputRef.current.contains(event.target as Node)) {
                setShowMagicInput(false);
                setShowStyleSelector(false); // Also reset style selector state
            }
        }

        if (showMagicInput) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMagicInput]);

    useEffect(() => {
        if (aiUrl && waitingForAutoCompare) {
            setIsComparing(true);
            setWaitingForAutoCompare(false);
        }
    }, [aiUrl, waitingForAutoCompare]);

    const handleCopyCurl = () => {
        if (curlCommand) {
            navigator.clipboard.writeText(curlCommand);
            alert('cURL command copied to clipboard!');
        }
    };

    const handleMagicWandClick = () => {
        setShowMagicInput(true);
    };

    const handleMagicSend = () => {
        if (magicPrompt.trim()) {
            const newPrompt = prompt + " " + magicPrompt;
            onPromptChange(newPrompt);
        }
        setWaitingForAutoCompare(true);
        setShowMagicInput(false);
        setMagicPrompt('');
        onGenerate();
    };

    const handleStyleSelect = (style: DesignStyle) => {
        // Override the prompt with the extensive style prompt
        onPromptChange(style.extensivePrompt);

        // Trigger generation immediately
        setWaitingForAutoCompare(true);
        setShowMagicInput(false);
        setShowStyleSelector(false);
        onGenerate();
    };

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50 shadow-sm">
            {isComparing && aiUrl ? (
                // Comparison Mode
                <div className="relative h-96 w-full rounded-lg overflow-hidden bg-gray-200">
                    {/* Original Image (Bottom Layer) */}
                    <img
                        src={originalUrl}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* AI Image (Top Layer) */}
                    <img
                        src={aiUrl}
                        alt="AI Version"
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
                        style={{ opacity: opacity / 100 }}
                    />

                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm rounded pointer-events-none">
                        Original
                    </div>
                    <div className="absolute top-4 right-4 bg-purple-600/90 text-white px-3 py-1 text-sm rounded pointer-events-none" style={{ opacity: opacity / 100 }}>
                        AI Makeover
                    </div>

                    {/* Slider Control */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 max-w-md bg-black/50 backdrop-blur-sm p-4 rounded-full flex items-center gap-4">
                        <span className="text-white text-xs font-bold uppercase">Original</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-white text-xs font-bold uppercase text-purple-400">AI</span>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsComparing(false)}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                        title="Close Comparison"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                // Standard Grid Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Image */}
                    <div className="relative group h-64">
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded z-10">Original</div>
                        <img src={originalUrl} alt="Original" className="w-full h-full object-cover rounded-lg" />

                        {/* Magic Wand Button */}
                        {!isGenerating && !showMagicInput && (
                            <button
                                onClick={handleMagicWandClick}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-4 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 border border-white/50 shadow-lg"
                                title="Magic Makeover & Compare"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" />
                                </svg>
                            </button>
                        )}

                        {/* Magic Input Field */}
                        {showMagicInput && (
                            <div
                                ref={magicInputRef}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${showStyleSelector ? 'w-auto' : 'w-3/4 max-w-md'}`}
                            >
                                {!showStyleSelector ? (
                                    // Text Input Mode
                                    <div className="relative flex items-center w-full">
                                        {/* Style Selector Button */}
                                        <button
                                            onClick={() => setShowStyleSelector(true)}
                                            className="absolute left-2 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all z-10"
                                            title="Choose a Style"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                                            </svg>
                                        </button>

                                        <input
                                            type="text"
                                            value={magicPrompt}
                                            onChange={(e) => setMagicPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleMagicSend()}
                                            autoFocus
                                            className="w-full px-4 py-3 pl-12 pr-12 bg-white/20 backdrop-blur-md border border-white/50 rounded-full text-[#404040] placeholder-white/70 outline-none focus:bg-white/30 transition-all shadow-lg min-w-[300px]"
                                            placeholder="Add to prompt..."
                                        />
                                        <button
                                            onClick={handleMagicSend}
                                            className="absolute right-2 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    // Style Selector Mode
                                    <div className="relative flex items-center justify-center animate-in fade-in zoom-in duration-200">
                                        {/* Main Selector Bar */}
                                        <div className="bg-white/20 backdrop-blur-md border border-white/50 rounded-2xl p-2 shadow-lg">
                                            <div className="flex items-center gap-4 px-2">
                                                {DESIGN_STYLES.map((style) => (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => handleStyleSelect(style)}
                                                        className="group flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-xl transition-all"
                                                        title={style.name}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6 group-hover:scale-110 transition-transform">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                                                        </svg>
                                                        <span className="text-[10px] font-medium text-white/90 tracking-wide shadow-sm">{style.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Separated Close Button - Absolute Positioned */}
                                        <button
                                            onClick={() => setShowStyleSelector(false)}
                                            className="absolute -right-14 p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/50 rounded-full text-white shadow-lg transition-all"
                                            title="Back to Text Input"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Loading Overlay on Original Image */}
                        {isGenerating && (
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-2 rounded-full">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>

                    {/* AI Image or Placeholder */}
                    <div className="relative bg-gray-200 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                        {aiUrl ? (
                            <>
                                <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 text-xs rounded z-10">AI Makeover</div>
                                <img src={aiUrl} alt="AI Version" className="w-full h-full object-cover" />
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm text-center p-4">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                                        <span>Generating Magic...</span>
                                    </div>
                                ) : (
                                    'AI version will appear here'
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Prompt Editor (Hidden in Compare Mode to reduce clutter) */}
            {!isComparing && (
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 outline-none resize-y min-h-[80px]"
                        placeholder="Customize the prompt for this specific image..."
                    />
                </div>
            )}

            {/* Controls */}
            <div className="flex justify-end mt-2 gap-2">
                {!isComparing && aiUrl && (
                    <button
                        onClick={() => setIsComparing(true)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                        Compare
                    </button>
                )}

                {curlCommand && !isComparing && (
                    <button
                        onClick={handleCopyCurl}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Copy CURL
                    </button>
                )}

                {!isComparing && (
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {aiUrl ? 'Rerender' : 'Render AI Version'}
                    </button>
                )}
            </div>
        </div>
    );
}
