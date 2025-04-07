import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Brain, Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { Hero } from '@/components/ui/animated-hero';
import HowItWorks from '@/components/HowItWorks';
import DeveloperProfile from '@/components/DeveloperProfile';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';

// LocalStorage key for rate limit info
const RATE_LIMIT_KEY = 'solvex_rate_limit_until';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitTime, setWaitTime] = useState<number>(0);

  // Initialize wait time from localStorage on component mount
  useEffect(() => {
    const storedRateLimitUntil = localStorage.getItem(RATE_LIMIT_KEY);
    if (storedRateLimitUntil) {
      const rateLimitUntil = parseInt(storedRateLimitUntil);
      const now = Date.now();
      
      if (rateLimitUntil > now) {
        const remainingSeconds = Math.ceil((rateLimitUntil - now) / 1000);
        setWaitTime(remainingSeconds);
        setError(`Rate limit exceeded. Please wait ${remainingSeconds} seconds.`);
      } else {
        // Clear expired rate limit
        localStorage.removeItem(RATE_LIMIT_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (waitTime <= 0) return;

    const timer = setInterval(() => {
      setWaitTime(time => {
        if (time <= 1) {
          setError(null);
          localStorage.removeItem(RATE_LIMIT_KEY);
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [waitTime]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const base64Image = base64Data.split(',')[1];
        setImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImage = () => {
    setImage(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading || waitTime > 0) return;

    setLoading(true);
    setError(null);
    
    try {
      const maxRetries = 2; // Reduced from 3 to 2 to avoid triggering additional rate limits
      let retries = 0;
      let success = false;
      let responseData;
      
      while (retries < maxRetries && !success) {
        try {
          console.log('Attempting API request...');
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro-exp-03-25",
              messages: [{
                role: "user",
                content: image ? [
                  { type: "text", text: question },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${image}`
                    }
                  }
                ] : question
              }]
            })
          });

          const data = await response.json();
          console.log('API Response:', { status: response.status, data });

          if (response.status === 429) {
            const retryAfter = data.retryAfter || 60;
            
            // Store rate limit info in localStorage with timestamp
            const rateLimitUntil = Date.now() + (retryAfter * 1000);
            localStorage.setItem(RATE_LIMIT_KEY, rateLimitUntil.toString());
            
            setWaitTime(retryAfter);
            throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
          }

          if (!response.ok) {
            throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
          }

          responseData = data;
          success = true;
        } catch (retryError) {
          console.error('Request failed:', retryError);
          
          // Don't retry on rate limit errors, they'll only make things worse
          if (retryError instanceof Error && retryError.message.includes('Rate limit')) {
            throw retryError;
          }
          
          if (retries >= maxRetries - 1) throw retryError;
          retries++;
          console.log(`Retrying... Attempt ${retries + 1} of ${maxRetries}`);
          await sleep(1000 * retries);
        }
      }

      if (success && responseData) {
        if (!responseData.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from API');
        }
        setAnswer(responseData.choices[0].message.content);
      }
    } catch (error) {
      console.error('Final error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          setError('Too many requests. Please wait until the countdown completes.');
        } else if (error.message.includes('API key not configured')) {
          setError('The service is temporarily unavailable. Please try again later or contact support.');
        } else if (error.message.includes('Invalid response format')) {
          setError('Received an invalid response from the server. Please try again.');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderImageUpload = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Upload Image Box
      </label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg h-[calc(100%-2rem)] min-h-[200px] flex items-center justify-center
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
      >
        <input {...getInputProps()} />
        {image ? (
          <div className="flex flex-col items-center p-4 relative w-full h-full">
            <img 
              src={`data:image/jpeg;base64,${image}`} 
              alt="Uploaded" 
              className="max-h-32 mb-2 object-contain" 
            />
            <p className="text-sm text-gray-500 text-center">Click or drag to replace</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-4">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center text-sm">Drag & drop an image here, or click to select</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubmitButton = () => (
    <button
      type="submit"
      disabled={loading || !question.trim() || waitTime > 0}
      className="button-54"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : waitTime > 0 ? (
        <>
          <Loader2 className="w-5 h-5" />
          Wait {waitTime}s
        </>
      ) : (
        <>
          <Send className="w-5 h-5" />
          Get answer
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative">
      <style>{`
        .button-54 {
          font-family: "Open Sans", sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          text-decoration: none;
          text-transform: uppercase;
          color: #000;
          cursor: pointer;
          border: 3px solid;
          padding: 0.25em 0.5em;
          box-shadow: 1px 1px 0px 0px, 2px 2px 0px 0px, 3px 3px 0px 0px, 4px 4px 0px 0px, 5px 5px 0px 0px;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          background: white;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.1s ease;
        }

        .button-54:active {
          box-shadow: 0px 0px 0px 0px;
          top: 5px;
          left: 5px;
        }

        .button-54:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (min-width: 768px) {
          .button-54 {
            padding: 0.25em 0.75em;
          }
        }
      `}</style>
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(209 213 219 / 0.3) 3px, transparent 0)`,
          backgroundSize: 'clamp(16px, 2vw, 24px) clamp(16px, 2vw, 24px)',
          opacity: '1',
          pointerEvents: 'none'
        }}
      />
      <Hero />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 doubt-solver-form relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-3xl font-bold text-gray-900 font-sans"></span>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                  Your Question Box
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-600 focus:ring-2 focus:ring-black focus:border-black transition-colors duration-200 ease-in-out"
                  placeholder="Type or paste your question here..."
                />
                {renderSubmitButton()}
              </div>
              {renderImageUpload()}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="prose prose-lg max-w-none min-h-[100px] latex-content">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <TextShimmerWave
                      className="[--base-color:#3b82f6] [--base-gradient-color:#1d4ed8] text-lg"
                      duration={1.5}
                      spread={1}
                      zDistance={1}
                      scaleDistance={1.1}
                      rotateYDistance={15}
                    >
                      Generating your answer...
                    </TextShimmerWave>
                  </div>
                ) : answer ? (
                  <div className="latex-wrapper">
                    <style>{`
                      .latex-wrapper {
                        font-family: 'Latin Modern Roman', 'Computer Modern', 'Cambria Math', 'Times New Roman', serif;
                        line-height: 1.6;
                      }
                      .latex-wrapper p {
                        margin: 1.2em 0;
                        text-align: justify;
                      }
                      .latex-wrapper h1, .latex-wrapper h2, .latex-wrapper h3 {
                        font-family: 'Latin Modern Roman', 'Computer Modern', 'Arial', sans-serif;
                        margin: 1.5em 0 1em;
                        color: #1a1a1a;
                      }
                      .latex-wrapper strong {
                        font-weight: 600;
                        color: #1a1a1a;
                      }
                      .latex-wrapper ul, .latex-wrapper ol {
                        margin: 1em 0;
                        padding-left: 2em;
                      }
                      .latex-wrapper li {
                        margin: 0.5em 0;
                      }
                      .latex-wrapper .katex {
                        font-size: 1.2em;
                      }
                      .latex-wrapper .katex-display {
                        margin: 1.8em 0;
                        padding: 0.8em 0;
                        overflow-x: auto;
                      }
                      .latex-wrapper code {
                        background-color: #f3f4f6;
                        padding: 0.2em 0.4em;
                        border-radius: 0.25em;
                        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                        font-size: 0.9em;
                      }
                      .latex-wrapper blockquote {
                        margin: 1.5em 0;
                        padding-left: 1em;
                        border-left: 4px solid #e5e7eb;
                        color: #4b5563;
                        font-style: italic;
                      }
                      .latex-wrapper table {
                        border-collapse: collapse;
                        margin: 1.5em 0;
                        width: 100%;
                      }
                      .latex-wrapper th, .latex-wrapper td {
                        border: 1px solid #e5e7eb;
                        padding: 0.5em;
                        text-align: left;
                      }
                      .latex-wrapper th {
                        background-color: #f9fafb;
                        font-weight: 600;
                      }
                      @font-face {
                        font-family: 'Latin Modern Roman';
                        src: url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Regular.woff2') format('woff2'),
                             url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Regular.woff') format('woff');
                        font-weight: normal;
                        font-style: normal;
                        font-display: swap;
                      }
                      @font-face {
                        font-family: 'Latin Modern Roman';
                        src: url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Bold.woff2') format('woff2'),
                             url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Bold.woff') format('woff');
                        font-weight: bold;
                        font-style: normal;
                        font-display: swap;
                      }
                      @font-face {
                        font-family: 'Latin Modern Roman';
                        src: url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Italic.woff2') format('woff2'),
                             url('https://raw.githubusercontent.com/vincentdoerig/latex-css/master/fonts/LM-Roman-10-Italic.woff') format('woff');
                        font-weight: normal;
                        font-style: italic;
                        font-display: swap;
                      }
                      .katex-display > .katex {
                        max-width: 100%;
                        overflow-x: auto;
                        overflow-y: hidden;
                        padding: 0.5em 0;
                      }
                      .katex-inline {
                        padding: 0 0.15em;
                      }
                    `}</style>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({node, ...props}) => <p className="latex-paragraph" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-6 my-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-6 my-4" {...props} />,
                        li: ({node, ...props}) => <li className="my-2" {...props} />,
                        code: ({node, inline, ...props}: {node?: any, inline?: boolean} & React.HTMLAttributes<HTMLElement>) => 
                          inline ? (
                            <code className="bg-gray-100 px-1 rounded" {...props} />
                          ) : (
                            <code className="block bg-gray-100 p-4 rounded-lg my-4" {...props} />
                          )
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center text-lg">
                    Your answer will appear here after you submit a question
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="how-it-works">
        <HowItWorks />
      </div>
      <DeveloperProfile />
    </div>
  );
}

export default App;