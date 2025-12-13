import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { GraphView } from '../components/GraphView';
import { generateInitialGraph } from '../utils/generateGraph';
import type { KnowledgeGraph } from '../types';
// We use global CSS, so standard classNames work.

export default function Home() {
    const [graphData, setGraphData] = useState<KnowledgeGraph>({ nodes: [], edges: [] });


    // Load from local storage on mount
    useEffect(() => {
        const storedGraph = localStorage.getItem('naumu-graph');
        if (storedGraph) {
            try {
                setGraphData(JSON.parse(storedGraph));
            } catch (e) {
                console.error("Failed to parse stored graph", e);
                setGraphData(generateInitialGraph());
            }
        } else {
            setGraphData(generateInitialGraph());
        }
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
        };

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            if ((e.target as Element).closest('input, textarea, button')) return;
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
        setTimeout(() => setIsFocused(true), 100);
    };

    const handleClear = () => {
        localStorage.removeItem('naumu-graph');
        setGraphData(generateInitialGraph());
        setInputText('');
    };

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setIsSubmitted(true);
        setIsFocused(false);

        // Clear previous graph/storage on new prompt
        localStorage.removeItem('naumu-graph');
        // Optional: Reset to ambient graph while loading so it looks like "clearing" the old structured one
        setGraphData(generateInitialGraph());

        try {
            const response = await fetch('/api/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: inputText }),
            });

            if (!response.ok) throw new Error('Failed to fetch graph');

            const data = await response.json();
            setGraphData(data);
            localStorage.setItem('naumu-graph', JSON.stringify(data));
        } catch (error) {
            console.error(error);
            alert('Error generating graph. Please try again.');
            setIsSubmitted(false);
        } finally {
            setIsLoading(false);
            setInputText('');
            setIsSubmitted(false);
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
                    setIsSubmitted(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
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
                <div className="logo-wrapper" id="target">
                    <h1>naumu</h1>
                    <p>ideas, structured.</p>
                </div>
            </div>

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

            {/* Clear Button */}
            {!isLoading && graphData.nodes.some(n => n.label) && !isFocused && (
                <button
                    onClick={handleClear}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(0, 0, 0, 0.4)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        transition: 'color 0.3s ease',
                        zIndex: 100,
                        fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(0, 0, 0, 0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0, 0, 0, 0.4)')}
                >
                    Clear Graph
                </button>
            )}

            <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </>
    );
}

