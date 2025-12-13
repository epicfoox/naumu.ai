import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { GraphView } from '../components/GraphView';
import { generateInitialGraph } from '../utils/generateGraph';
import type { KnowledgeGraph } from '../types';
// We use global CSS, so standard classNames work.

export default function Home() {
    const [graphData, setGraphData] = useState<KnowledgeGraph>({ nodes: [], edges: [] });

    useEffect(() => {
        setGraphData(generateInitialGraph());
    }, []);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // --- Aesthetic Interactions (Tilt & Spotlight) ---
    useEffect(() => {
        const handleMove = (x: number, y: number) => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            const xPercent = (x / w) * 100;
            const yPercent = (y / h) * 100;

            document.documentElement.style.setProperty('--mouse-x', `${xPercent}%`);
            document.documentElement.style.setProperty('--mouse-y', `${yPercent}%`);

            // Tilt logic handled by CSS usage of these vars? 
            // Legacy JS calculated `targetInputX` and `inputX` for smooth animation.
            // For simplicity/performance in React, we can either:
            // 1. Re-implement the requestAnimationFrame loop.
            // 2. Just update CSS vars and let CSS transitions handle it (less smooth for complex parallax).
            // The legacy code performed complex smoothing. simpler to rely on CSS.
            // But the Logo H1 uses text-shadow based on these vars directly.
        };

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            // Prevent default only if not on input (but handled by passive: false usually)
            if ((e.target as Element).closest('input, textarea, button')) return;
            // e.preventDefault(); // React synthetic events? This is native listener.
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    // --- Focus Logic ---
    useEffect(() => {
        if (isFocused) {
            document.body.classList.add('focused');
        } else {
            document.body.classList.remove('focused');
        }
    }, [isFocused]);

    useEffect(() => {
        if (isSubmitted) {
            document.body.classList.add('submitted');
        } else {
            document.body.classList.remove('submitted');
        }
    }, [isSubmitted]);

    // --- Interaction Handlers ---
    const handleFocus = () => {
        // Delay slightly to avoid layout thrashing/race conditions
        setTimeout(() => setIsFocused(true), 100);
    };

    const handleBlur = () => {
        // We handle blur via click-away listener on body usually, 
        // but the textarea onBlur is also good.
        // However, legacy code used a global click listener to dismiss.
    };

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setIsSubmitted(true); // Move UI to submitted state immediately? Or after? Legacy: immediately.
        setIsFocused(false);

        try {
            const response = await fetch('/api/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: inputText }),
            });

            if (!response.ok) throw new Error('Failed to fetch graph');

            const data = await response.json();
            setGraphData(data); // Replace graph
        } catch (error) {
            console.error(error);
            alert('Error generating graph. Please try again.');
            setIsSubmitted(false); // Revert
        } finally {
            setIsLoading(false);
            setInputText(''); // Clear input
        }
    };

    // Auto-resize textarea
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';

            if (textAreaRef.current.scrollHeight > textAreaRef.current.clientHeight) {
                textAreaRef.current.style.overflowY = 'auto';
            } else {
                textAreaRef.current.style.overflowY = 'hidden';
            }
        }
    }, [inputText]);

    // Dismiss focus on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (!isFocused && !isSubmitted) return;
            const target = e.target as Element;
            if (!target.closest('.input-container')) {
                setIsFocused(false);
                if (isSubmitted && !target.closest('.result-modal')) {
                    // Optional: Dismiss submitted state?
                    // Legacy: "If clicked outside modal and input container... remove submitted"
                    setIsSubmitted(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        // document.addEventListener('touchstart', handleClickOutside); // Conflicts with interactions sometimes
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isFocused, isSubmitted]);

    return (
        <>
            <Head>
                <title>naumu</title>
            </Head>

            {/* Graph Layer */}
            <GraphView data={graphData} />

            {/* Main Scene */}
            <div className="scene" id="scene">
                {/* Only show Logo if not submitted? or keep it? Legacy keeps it but it blurs. */}
                <div className="logo-wrapper" id="target">
                    <h1>naumu</h1>
                    <p>ideas, structured.</p>
                </div>
            </div>

            {/* Result Modal (Optional explanation or details) */}
            {/* Legacy code had a result modal with text. We probably don't need it if we have the graph, 
          but the user asked for "The UI visualizes this JSON as a force-directed graph."
          Maybe we don't need the text modal? 
          "Receive: LLM returns a JSON object representing Nodes and Edges. Render: The UI visualizes this JSON..."
          I will keep the modal structure but maybe hide it or use it for "Loading..." or stats?
          I'll leave it out for a cleaner "Constellation" view as requested. 
          Actually, let's keep it for "Loading" state?
      */}

            {isLoading && (
                <div className="result-modal" style={{ opacity: 1, pointerEvents: 'auto' }}>
                    <h2>Thinking...</h2>
                    <p>Analyzing your thoughts and building the constellation.</p>
                </div>
            )}

            {/* Input Container */}
            <div className={`input-container ${isLoading ? 'loading' : ''}`}>
                <textarea
                    ref={textAreaRef}
                    placeholder="What's on your mind?"
                    id="topic-input"
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={handleFocus}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    disabled={isLoading}
                ></textarea>
                <button
                    id="submit-btn"
                    aria-label="Start learning"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        // Simple Spinner
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 60" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
            </div>

            <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </>
    );
}
