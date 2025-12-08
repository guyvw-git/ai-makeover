'use client';

import { useState, useRef } from 'react';
import ImagePair from './components/ImagePair';

interface ImageState {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  aiUrl?: string;
  isGenerating: boolean;
  curlCommand?: string;
  prompt: string; // Added prompt
}

export default function Home() {
  const [prompt, setPrompt] = useState('Rerender the attached image into a luxury house setting. Focus on resell value for the house and touch up this room to make it visually fantastic. You CAN NOT change the structural layout of the room. You should work with light colors like white, black trim and wood accents to make it look expensive. Always think about redoing flooring and walls. You should furnish the rooms too so it looks like they are nicely staged');
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageState[]>([]);
  const [error, setError] = useState('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    const newImages = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      isGenerating: false,
      prompt: prompt // Initialize with global prompt
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const handlePromptChange = (id: string, newPrompt: string) => {
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, prompt: newPrompt } : img
    ));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, isGenerating: true, aiUrl: undefined, curlCommand: undefined } : img
    ));

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image.file);

      reader.onloadend = async () => {
        const base64data = reader.result as string;

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64data,
              prompt: image.prompt, // Use specific image prompt
              folderPath: folderPath,
              fileName: image.fileName
            }),
          });

          const data = await response.json();

          if (data.aiUrl) {
            setImages(prev => prev.map(img =>
              img.id === id ? { ...img, aiUrl: data.aiUrl, isGenerating: false, curlCommand: data.curlCommand } : img
            ));
          } else {
            // Handle error but save curl command if present
            console.error('Generation failed:', data);
            setImages(prev => prev.map(img =>
              img.id === id ? { ...img, isGenerating: false, curlCommand: data.curlCommand } : img
            ));
            alert(`Generation failed: ${data.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('API call failed', err);
          setImages(prev => prev.map(img =>
            img.id === id ? { ...img, isGenerating: false } : img
          ));
          alert('Failed to generate image');
        }
      };
    } catch (err) {
      console.error('Error processing image', err);
      setImages(prev => prev.map(img =>
        img.id === id ? { ...img, isGenerating: false } : img
      ));
    }
  };

  // ... (rest of the component)

  // In the render loop:



  const handleRerenderAll = async () => {
    setIsProcessingAll(true);
    await Promise.all(images.map(img => handleGenerate(img.id)));
    setIsProcessingAll(false);
  };

  const stats = {
    total: images.length,
    processed: images.filter((img) => img.aiUrl).length,
    processing: images.filter((img) => img.isGenerating).length,
  };

  return (
    <main className="min-h-screen bg-white text-black p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">AI House Makeover</h1>
          <p className="text-gray-500">Transform your local real estate photos with AI magic</p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
          {/* Global Prompt */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Local Folder Path (for auto-save)</label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none shadow-sm transition-all"
                placeholder="/Users/username/Desktop/my-images"
              />
              <p className="text-xs text-gray-500 mt-1">Paste the absolute path of your folder here to automatically save generated images.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Master Prompt (Applied to all images)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none shadow-sm transition-all"
                rows={4}
                placeholder="Enter your prompt here..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFolderSelect}
                className="hidden"
                // @ts-ignore - webkitdirectory is not standard but supported
                webkitdirectory=""
                multiple
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Select Folder
              </button>
            </div>

            {images.length > 0 && (
              <button
                onClick={handleRerenderAll}
                disabled={isProcessingAll || stats.processing > 0}
                className="px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
              >
                {isProcessingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing All...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" />
                    </svg>
                    Rerender All Images
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {images.length > 0 && (
          <div className="flex justify-center gap-12 py-6 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Images Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.processing}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.processed}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Completed</div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Select a folder to get started</p>
            <p className="text-sm text-gray-400 mt-2">We'll find all images in the folder automatically</p>
          </div>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-1 gap-12 pb-20">
          {images.map((img) => (
            <ImagePair
              key={img.id}
              originalUrl={img.previewUrl}
              aiUrl={img.aiUrl}
              isGenerating={img.isGenerating}
              curlCommand={img.curlCommand}
              prompt={img.prompt}
              onPromptChange={(newPrompt) => handlePromptChange(img.id, newPrompt)}
              onGenerate={() => handleGenerate(img.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
