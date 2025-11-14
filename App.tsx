
import React, { useState, useCallback } from 'react';
import { generateCadNotes, askAiAboutMaterial } from './services/geminiService';
import { CadNotes } from './types';
import { CopyIcon, SparklesIcon, SendIcon } from './components/Icon';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
    const [material, setMaterial] = useState<string>('Aluminum 6061-T6');
    const [finish, setFinish] = useState<string>('Anodize Black, MIL-A-8625 Type II');
    const [notes, setNotes] = useState<CadNotes | null>(null);
    const [askAiQuery, setAskAiQuery] = useState<string>('');
    const [askAiResponse, setAskAiResponse] = useState<string>('');
    const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleGenerateNotes = useCallback(async () => {
        if (!material) {
            setError('Please enter a material.');
            return;
        }
        setIsLoadingNotes(true);
        setError('');
        setNotes(null);
        setAskAiResponse('');

        try {
            const result = await generateCadNotes(material, finish);
            setNotes(result);
        } catch (e) {
            console.error(e);
            setError('Failed to generate notes. Please check your input and try again.');
        } finally {
            setIsLoadingNotes(false);
        }
    }, [material, finish]);

    const handleAskAi = useCallback(async () => {
        if (!askAiQuery || !material) return;

        setIsLoadingAi(true);
        setAskAiResponse('');
        setError('');

        try {
            const result = await askAiAboutMaterial(material, askAiQuery);
            setAskAiResponse(result);
        } catch (e) {
            console.error(e);
            setError('Failed to get an answer from the AI. Please try again.');
        } finally {
            setIsLoadingAi(false);
        }
    }, [askAiQuery, material]);

    const handleCopy = () => {
        if (!notes) return;
        const notesText = Object.values(notes).join('\n');
        navigator.clipboard.writeText(notesText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-brand-primary font-sans">
            <header className="py-6 text-center shadow-lg bg-brand-primary/80 backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-brand-highlight">
                    CAD Material Notes Generator
                </h1>
                <p className="text-brand-accent mt-2">Powered by Gemini AI</p>
            </header>
            
            <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Inputs */}
                <div className="bg-gray-800/20 p-6 rounded-xl border border-brand-secondary/30">
                    <h2 className="text-2xl font-semibold mb-6 text-brand-accent">1. Enter Details</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="material" className="block text-sm font-medium text-brand-gray mb-2">Material</label>
                            <input
                                id="material"
                                type="text"
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                placeholder="e.g., Stainless Steel 304"
                                className="w-full bg-brand-primary/50 border border-brand-secondary/50 rounded-lg px-4 py-2 text-brand-light focus:ring-2 focus:ring-brand-highlight focus:border-brand-highlight outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="finish" className="block text-sm font-medium text-brand-gray mb-2">Finish or Treatment</label>
                            <input
                                id="finish"
                                type="text"
                                value={finish}
                                onChange={(e) => setFinish(e.target.value)}
                                placeholder="e.g., Passivate or 'treatment required'"
                                className="w-full bg-brand-primary/50 border border-brand-secondary/50 rounded-lg px-4 py-2 text-brand-light focus:ring-2 focus:ring-brand-highlight focus:border-brand-highlight outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateNotes}
                        disabled={isLoadingNotes}
                        className="mt-8 w-full flex items-center justify-center bg-brand-secondary hover:bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingNotes ? <LoadingSpinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> Generate Notes</>}
                    </button>
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>

                {/* Right Panel: Outputs */}
                <div className="bg-gray-800/20 p-6 rounded-xl border border-brand-secondary/30 space-y-8">
                    {/* Notes Display */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-brand-accent">2. Generated Notes</h2>
                        <div className="bg-brand-primary/50 p-4 rounded-lg min-h-[200px] relative">
                            {isLoadingNotes && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"><LoadingSpinner /></div>}
                            {notes && (
                                <>
                                    <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md hover:bg-brand-secondary/50 transition-colors">
                                        <CopyIcon className="w-5 h-5" />
                                        {isCopied && <span className="absolute -top-8 right-0 bg-brand-highlight text-brand-primary text-xs font-bold px-2 py-1 rounded">Copied!</span>}
                                    </button>
                                    <pre className="text-brand-light whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                        {Object.values(notes).join('\n')}
                                    </pre>
                                </>
                            )}
                            {!notes && !isLoadingNotes && <p className="text-brand-gray text-center self-center flex items-center justify-center h-full">Your generated notes will appear here.</p>}
                        </div>
                    </div>

                    {/* Ask AI Section */}
                    {notes && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-brand-accent">3. Ask AI about "{material}"</h2>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={askAiQuery}
                                onChange={(e) => setAskAiQuery(e.target.value)}
                                placeholder="e.g., What is its tensile strength?"
                                className="flex-grow bg-brand-primary/50 border border-brand-secondary/50 rounded-lg px-4 py-2 text-brand-light focus:ring-2 focus:ring-brand-highlight focus:border-brand-highlight outline-none transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                            />
                            <button onClick={handleAskAi} disabled={isLoadingAi} className="bg-brand-highlight hover:opacity-90 text-brand-primary p-3 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isLoadingAi ? <LoadingSpinner /> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="mt-4 bg-brand-primary/50 p-4 rounded-lg min-h-[150px]">
                            {isLoadingAi && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                            {askAiResponse && <p className="text-brand-light whitespace-pre-wrap text-sm">{askAiResponse}</p>}
                            {!askAiResponse && !isLoadingAi && <p className="text-brand-gray text-center flex items-center justify-center h-full">AI's response will appear here.</p>}
                        </div>
                    </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
