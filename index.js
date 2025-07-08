// client/pages/index.js

import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';

const EST_MESSAGES = [
    
    "Interview invitation from TCS for Python developer role on March 15th. No fees required.",
    "Infosys hiring process: Technical round scheduled for next week. Bring your government ID.",
    "Hi Ravi, we reviewed your profile on LinkedIn. We'd like to invite you to a TCS interview next week. Please confirm availability.",
    "Your resume impressed us! Join Infosys Bangalore for an in-person round on Monday. No fees involved.",
    "This is from Accenture HR. You are invited to a virtual assessment. Bring ID and resume. No charges.",
    "Dear Priya, you are selected for Capgemini hiring challenge. Login to the portal using your email and appear for the test.",
    "Your profile is shortlisted for Data Analyst role at Deloitte. Interview will be conducted over MS Teams this Friday.",
    
    
    "Pay ₹1500 to get your Amazon job offer letter today! No interview needed!",
    "Earn ₹50,000/month from home! Just share your Aadhaar and pay ₹999 registration.",
    "Congratulations! You got a job at Amazon. Pay ₹999 for offer letter and verification.",
    "Want to earn ₹50,000/month from home? No skills needed. Immediate joining. ₹499 registration required.",
    "Get your Wipro job card after paying ₹800 via GPay. Instant offer.",
    "No interview needed! Pay now and start working with Flipkart remote jobs. Just ₹999 for ID creation.",
    "You have been shortlisted for a government job. Pay document verification fee to proceed further.",
    "Join Google support team. Pay ₹1000 refundable fee for background check.",
    "Hi! We offer freelance roles in IBM. Please send PAN + Aadhaar and ₹599 to begin onboarding.",

    
    
    "Microsoft requires ₹2999 refundable deposit for onboarding. Submit via PhonePe.",
    "We are scheduling your interview for HCL Technologies. Before that, a security deposit of ₹1200 is needed to block your slot.",
    "You have been pre-selected by Cognizant. For quick onboarding, pay ₹699 as token security.",
    "Your resume was shortlisted by Microsoft India. Just pay refundable ₹899 processing charge to receive offer letter.",
];

export default function Home() {
  // State variables
  const [testMessages, setTestMessages] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [jobText, setJobText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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


  useEffect(() => {
  fetch('http://localhost:5001/get-test-messages')
    .then(res => res.json())
    .then(data => setTestMessages(data))
    .catch(console.error);
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
      setJobText(''); // Clear text input when file is selected
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setJobText(''); // Clear text input when file is selected
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const analyzeJob = async () => {
  if (!jobText.trim() && !file) {
    addMessage("Please provide either text or upload a file to analyze.", false);
    return;
  }

  setIsAnalyzing(true);
  setAnalysisResult(null); // Reset previous results
  addMessage("Analyzing the job offer...", false);

  try {
    let response;
    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      console.log("Sending file for analysis...");
      response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        body: formData
      });
    } else {
      console.log("Sending text for analysis...");
      response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: jobText })
      });
    }

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(HTTP error! status: ${response.status});
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid response format from server");
    }

    // Ensure required fields exist
    const result = {
      is_legit: data.is_legit || false,
      score: data.score || 0,
      warnings: data.warnings || [],
      examples: data.examples || [],
      text_sample: data.text_sample || (jobText.substring(0, 200) + (jobText.length > 200 ? "..." : ""))
    };

    setAnalysisResult(result);
    setMessages(prev => prev.filter(m => m.text !== "Analyzing the job offer..."));
    
    let resultMessage = Analysis Complete:\n\n;
    resultMessage += Credibility Score: ${result.score}/100\n;
    resultMessage += Legitimacy: ${result.is_legit ? '✅ Likely Legitimate' : '⚠ Potential Scam'}\n\n;
    
    if (result.warnings.length > 0) {
      resultMessage += Red Flags Detected:\n;
      result.warnings.forEach((warning, index) => {
        resultMessage += • ${formatWarning(warning)}: "${result.examples[index] || 'example not available'}"\n;
      });
    } else {
      resultMessage += No significant red flags detected.;
    }
    
    addMessage(resultMessage, false);

  } catch (error) {
    console.error('Analysis failed:', error);
    setMessages(prev => prev.filter(m => m.text !== "Analyzing the job offer..."));
    addMessage(Analysis failed: ${error.message}, false);
  } finally {
    setIsAnalyzing(false);
  }
};

  const formatWarning = (warning) => {
    const warningMap = {
      'registration_fee': 'Registration Fee Requested',
      'high_income': 'Unrealistically High Income',
      'no_interview': 'No Interview Process',
      'urgency': 'Urgency Pressure',
      'payment_request': 'Payment Request'
    };
    return warningMap[warning] || warning;
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
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center">
                  <span className="typing-indicator"></span>
                  <span className="typing-indicator ml-1"></span>
                  <span className="typing-indicator ml-1"></span>
                </span>
              ) : 'Analyze Job Offer'}
            </button>
          </div>
          
          <div className="glass-card p-8 rounded-2xl">
  <div className="flex items-center space-x-4 mb-6">
    <div className="bg-purple-100 p-3 rounded-full">
      <i className="fas fa-comments text-secondary text-xl"></i>
    </div>
    <h3 className="text-2xl font-bold">Analysis Results</h3>
  </div>
  
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl h-80 overflow-y-auto">
    {isAnalyzing ? (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="flex space-x-2 mb-4">
          <div className="typing-indicator"></div>
          <div className="typing-indicator"></div>
          <div className="typing-indicator"></div>
        </div>
        <p className="text-gray-600">Analyzing job offer...</p>
      </div>
    ) : analysisResult ? (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className={`mb-4 p-3 rounded-lg ${
            analysisResult.is_legit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            

            <h4 className="font-bold text-lg mb-1">
              {analysisResult.is_legit ? '✅ Likely Legitimate Job Offer' : '⚠ Potential Scam Detected'}
            </h4>
            <p>Credibility Score: {analysisResult.score}/100</p>
          </div>
          
          {analysisResult.warnings.length > 0 ? (
            <>
              <h4 className="font-bold text-lg mb-2 text-gray-800">Red Flags:</h4>
              <ul className="space-y-3">
                {analysisResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <div>
                      <p className="font-medium">{formatWarning(warning)}</p>
                      <p className="text-sm text-gray-600">
                        Example: "{analysisResult.examples[index] || 'No example available'}"
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">No significant red flags detected.</p>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-bold text-lg mb-2 text-gray-800">Text Sample:</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {analysisResult.text_sample || 'No text sample available'}
            </p>
          </div>
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
        {/* ===== TEST CASE PANEL ===== */}
<div className="glass-card p-6 rounded-2xl mb-8">
  <h3 className="text-xl font-bold mb-4 flex items-center">
    <i className="fas fa-vial text-blue-500 mr-2"></i>
    Try Test Examples
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

<button
  onClick={() => {
    const randomIndex = Math.floor(Math.random() * 7); // 0-6
    setJobText(EST_MESSAGES[randomIndex]);
  }}
  className="p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
>
  Legit Example
</button>

<button
  onClick={() => {
    const randomIndex = 7 + Math.floor(Math.random() * 9); // 7-15
    setJobText(EST_MESSAGES[randomIndex]);
  }}
  className="p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
>
  Obvious Scam
</button>

<button
  onClick={() => {
    const randomIndex = 16 + Math.floor(Math.random() * 4); // 16-19
    setJobText(EST_MESSAGES[randomIndex]);
  }}
  className="p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
>
  Tricky Case
</button>
  </div>

  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="font-medium mb-2">Currently testing:</p>
    <p className="text-sm bg-white p-3 rounded border">
      {jobText || "No example selected yet"}
    </p>
    {jobText && (
      <button
        onClick={analyzeJob}
        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Analyze This
      </button>
    )}
  </div>
</div>
        {/* Features Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Key Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to identify and avoid job scams</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card p-6 rounded-2xl">
            <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <i className="fas fa-search text-primary text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Scam Detection</h3>
            <p className="text-gray-600">AI-powered analysis to identify fraudulent job listings and phishing attempts.</p>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <i className="fas fa-check-circle text-secondary text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Company Verification</h3>
            <p className="text-gray-600">Check company legitimacy and recruiter authenticity.</p>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
            <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <i className="fas fa-comments text-primary text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Assistance</h3>
            <p className="text-gray-600">Get instant answers to your job scam-related questions.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-bold">ScamShield</h3>
              </div>
              <p className="text-gray-600 mb-4">Your personal AI assistant for job scam protection.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-primary transition"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-600 hover:text-primary transition"><i className="fab fa-linkedin"></i></a>
                <a href="#" className="text-gray-600 hover:text-primary transition"><i className="fab fa-facebook"></i></a>
                <a href="#" className="text-gray-600 hover:text-primary transition"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Job Offer Analysis</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Company Verification</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Scam Detection</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Recruiter Check</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Salary Benchmarking</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Scam Alerts</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Safety Tips</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Career Guides</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition">Webinars</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Subscribe</h4>
              <p className="text-gray-600 mb-4">Get scam alerts and career protection tips</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="px-4 py-2 rounded-l-lg border border-r-0 flex-grow" />
                <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-r-lg">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600">
            <p>© 2023 ScamShield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}