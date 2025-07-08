import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  // State variables
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [jobText, setJobText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize chat
  useEffect(() => {
    setTimeout(() => {
      addMessage("Welcome to ScamShield! I can help you verify job offers for authenticity.", false);
      setTimeout(() => {
        addMessage("You can paste the job description or upload the offer document for analysis.", false);
      }, 1000);
    }, 500);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (text, isUser = false) => {
    const newMessage = {
      id: Date.now(),
      text,
      isUser
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    addMessage(inputValue, true);
    sendToAI(inputValue);
    setInputValue('');
  };

  // File handling functions
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setJobText(e.target.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setJobText(e.target.result);
      };
      reader.readAsText(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const sendToAI = async (message) => {
    setMessages(prev => [...prev, { id: 'typing', text: '', typing: true }]);
    
    try {
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message })
      });
      
      const data = await response.json();
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      addMessage(data.reply, false);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      addMessage("Sorry, I'm having trouble connecting. Please try again later.", false);
    }
  };

  const analyzeJob = async () => {
    if (!jobText.trim() && !file) return;
    
    try {
      let formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', jobText);
      }

      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setAnalysisResult(data.feedback);
    } catch (error) {
      console.error('Error:', error);
      setAnalysisResult("Error analyzing job offer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ScamShield - Job Offer Authenticity Checker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    dark: '#1e293b',
                    light: '#f8fafc'
                  },
                  animation: {
                    'fade-in': 'fadeIn 0.5s ease-out',
                    'float': 'float 6s ease-in-out infinite',
                    'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  },
                  keyframes: {
                    fadeIn: {
                      '0%': { opacity: 0, transform: 'translateY(10px)' },
                      '100%': { opacity: 1, transform: 'translateY(0)' }
                    },
                    float: {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-10px)' }
                    }
                  }
                }
              }
            }
          `
        }} />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            min-height: 100vh;
            color: #1e293b;
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
          }
          
          .gradient-text {
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .chat-bubble {
            max-width: 80%;
            padding: 16px;
            border-radius: 18px;
            position: relative;
            margin-bottom: 16px;
            animation: fade-in 0.3s ease-out;
          }
          
          .user-bubble {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border-bottom-right-radius: 4px;
            align-self: flex-end;
          }
          
          .ai-bubble {
            background: white;
            color: #1e293b;
            border-bottom-left-radius: 4px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
            align-self: flex-start;
          }
          
          .chat-container {
            height: 500px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            overflow: hidden;
          }
          
          .chat-messages {
            background: rgba(249, 250, 251, 0.7);
          }
          
          .typing-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #8b5cf6;
            margin-right: 4px;
          }
          
          .typing-indicator:nth-child(1) {
            animation: pulse-slow 1.5s infinite;
          }
          
          .typing-indicator:nth-child(2) {
            animation: pulse-slow 1.5s infinite 0.2s;
          }
          
          .typing-indicator:nth-child(3) {
            animation: pulse-slow 1.5s infinite 0.4s;
          }
          
          .upload-area {
            border: 2px dashed #c7d2fe;
            background: rgba(199, 210, 254, 0.2);
            transition: all 0.3s ease;
          }
          
          .upload-area:hover {
            background: rgba(199, 210, 254, 0.4);
            border-color: #a5b4fc;
          }
          
          .job-card {
            transition: all 0.3s ease;
          }
          
          .job-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04);
          }
          
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </Head>

      {/* Header */}
      <header className="glass-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold gradient-text">ScamShield</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-dark hover:text-primary font-medium transition">Home</a>
            <a href="#" className="text-dark hover:text-primary font-medium transition">Features</a>
            <a href="#" className="text-dark hover:text-primary font-medium transition">About</a>
            <a href="#" className="text-dark hover:text-primary font-medium transition">Contact</a>
          </nav>
          <button className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto">
            Protect Yourself From <span className="gradient-text">Job Scams</span> with AI
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify job offers, detect fraudulent listings, and secure your career journey with our intelligent scam detector.
          </p>
        </div>

        {/* Job Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="job-card glass-card p-8 rounded-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-indigo-100 p-3 rounded-full">
                <i className="fas fa-briefcase text-primary text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold">Job Offer Analysis</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Job Offer Document</label>
              <div 
                className="upload-area rounded-xl p-8 text-center cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={triggerFileInput}
              >
                <i className="fas fa-cloud-upload-alt text-primary text-4xl mb-3"></i>
                <p className="font-medium text-gray-700">Drag & drop your file here</p>
                <p className="text-gray-500 text-sm mt-1">Supports PDF, DOCX, TXT (Max 5MB)</p>
                {fileName && (
                  <p className="mt-2 text-sm text-primary">
                    <i className="fas fa-file-alt mr-2"></i>
                    {fileName}
                  </p>
                )}
                <button className="mt-4 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg text-sm">
                  Browse Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Or paste job offer text</label>
              <textarea 
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Paste job offer content here..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              ></textarea>
            </div>
            
            <button 
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition"
              onClick={analyzeJob}
            >
              Analyze Job Offer
            </button>
          </div>
          
          <div className="glass-card p-8 rounded-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <i className="fas fa-comments text-secondary text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold">AI Verification</h3>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl h-80 overflow-y-auto">
              {analysisResult ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <pre className="whitespace-pre-wrap">{analysisResult}</pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Submit a job offer to verify its authenticity</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </main>

      {/* Footer */}
      <footer className="glass-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div>
                <div>
                  
                </div>
                
              </div>
            
              
            </div>
            
            
            
            
            
            
          </div>
          

        </div>
      </footer>
    </div>
  );
}