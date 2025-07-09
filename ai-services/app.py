from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import PyPDF2
from io import BytesIO

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Enhanced scam detection patterns with more examples
# Fix the regex patterns (notice the balanced parentheses and proper escaping)
SCAM_PATTERNS = {
    "registration_fee": r"(registration\s+fee|deposit|upfront\s+payment|investment|security\s+deposit|token\s+security|processing\s+charge|verification\s+fee|document\s+charge)",
    "high_income": r"(earn\s+(₹|\$|€|Rs\.?)\s?\d{4,}\s*(per|/)\s*(month|week|day|hour)|(make\s+\d{4,}\s+from\s+home))",
    "no_interview": r"(no\s+interview|immediate\s+join(ing)?|direct\s+hiring|instant\s+(job|offer)|guaranteed\s+job)",
    "urgency": r"(limited\s+seats|only\s+today|offer\s+expires|join\s+now|urgent\s+hiring|apply\s+immediately|few\s+positions\s+left|block\s+your\s+slot)",
    "payment_request": r"(pay\s+(₹|\$|€|Rs\.?)\s?\d+|send\s+money|pay\s+(first|advance|now)|wallet\s+transfer|bank\s+details|payment\s+required|gpay|phonepe|paytm)",
    "document_request": r"(send\s+(pan|aadhaar|id\s+proof)|upload\s+documents\s+first|share\s+personal\s+details)"
}
TEST_MESSAGES = [
    # Legitimate messages
    "Interview invitation from TCS for Python developer role on March 15th. No fees required.",
    "Infosys hiring process: Technical round scheduled for next week. Bring your government ID.",
    "Hi Ravi, we reviewed your profile on LinkedIn. We'd like to invite you to a TCS interview next week. Please confirm availability.",
    "Your resume impressed us! Join Infosys Bangalore for an in-person round on Monday. No fees involved.",
    "This is from Accenture HR. You are invited to a virtual assessment. Bring ID and resume. No charges.",
    "Dear Priya, you are selected for Capgemini hiring challenge. Login to the portal using your email and appear for the test.",
    "Your profile is shortlisted for Data Analyst role at Deloitte. Interview will be conducted over MS Teams this Friday.",
    
    # Scam messages
    "Pay ₹1500 to get your Amazon job offer letter today! No interview needed!",
    "Earn ₹50,000/month from home! Just share your Aadhaar and pay ₹999 registration.",
    "Congratulations! You got a job at Amazon. Pay ₹999 for offer letter and verification.",
    "Want to earn ₹50,000/month from home? No skills needed. Immediate joining. ₹499 registration required.",
    "Get your Wipro job card after paying ₹800 via GPay. Instant offer.",
    "No interview needed! Pay now and start working with Flipkart remote jobs. Just ₹999 for ID creation.",
    "You have been shortlisted for a government job. Pay document verification fee to proceed further.",
    "Join Google support team. Pay ₹1000 refundable fee for background check.",
    "Hi! We offer freelance roles in IBM. Please send PAN + Aadhaar and ₹599 to begin onboarding.",

    
    # Tricky messages
    "Microsoft requires ₹2999 refundable deposit for onboarding. Submit via PhonePe.",
    "We are scheduling your interview for HCL Technologies. Before that, a security deposit of ₹1200 is needed to block your slot.",
    "You have been pre-selected by Cognizant. For quick onboarding, pay ₹699 as token security.",
    "Your resume was shortlisted by Microsoft India. Just pay refundable ₹899 processing charge to receive offer letter.",
]

def analyze_text(text):
    """Analyze text for scam indicators with severity scoring"""
    warnings = []
    matched_examples = []
    
    text_lower = text.lower()
    
    for pattern_name, pattern in SCAM_PATTERNS.items():
        try:
            matches = re.finditer(pattern, text_lower)
            for match in matches:
                if pattern_name not in warnings:  # Only add unique warning types
                    warnings.append(pattern_name)
                matched_examples.append(match.group(0))
        except re.error as e:
            print(f"Regex error in pattern '{pattern_name}': {str(e)}")
            continue
    
    # Calculate dynamic score (0-100)
    severity_weights = {
        'payment_request': 30,
        'registration_fee': 25, 
        'high_income': 20,
        'urgency': 15,
        'no_interview': 10
    }
    
    credibility_score = max(0, 100 - sum(severity_weights.get(w, 10) for w in warnings))
    
    return {
        "is_legit": credibility_score > 70,
        "score": credibility_score,
        "warnings": warnings,
        "examples": matched_examples[:5],  # Return first 5 examples max
        "text_sample": text[:200] + ("..." if len(text) > 200 else "")
    }

def extract_pdf_text(file_bytes):
    """Extract text from PDF with robust error handling"""
    try:
        pdf = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        return text if text.strip() else None
    except Exception as e:
        print(f"PDF extraction error: {str(e)}")
        return None
    
@app.route('/get-scam-patterns', methods=['GET'])
def get_scam_patterns():
    return jsonify({
        "patterns": SCAM_PATTERNS,
        "pattern_descriptions": {
            "payment": "Payment Requests (requests for money)",
            "urgency": "Urgency Tactics (pressure to act fast)",
            "no_process": "No Proper Hiring Process",
            "documents": "Suspicious Document Requests",
            "unrealistic": "Unrealistic Offers"
        }
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "Empty file"}), 400
            
            file_bytes = file.read()
            
            if file.filename.lower().endswith('.pdf'):
                text = extract_pdf_text(file_bytes)
            else:  # Treat as text file
                text = file_bytes.decode('utf-8', errors='ignore')
            
            if not text or not text.strip():
                return jsonify({"error": "No readable content found"}), 400
                
            return jsonify(analyze_text(text))
        
        # Handle JSON text input
        if request.content_type == 'application/json':
            data = request.get_json()
            if 'text' in data and data['text'].strip():
                return jsonify(analyze_text(data['text']))
            return jsonify({"error": "Empty text input"}), 400
            
        # Handle form data text input
        if 'text' in request.form and request.form['text'].strip():
            return jsonify(analyze_text(request.form['text']))
        
        return jsonify({"error": "No valid input provided"}), 400
        
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route('/test-cases', methods=['GET'])
def get_test_cases():
    return jsonify({
        "legit": TEST_MESSAGES[:7],
        "scams": TEST_MESSAGES[7:16],
        "tricky": TEST_MESSAGES[16:]
    })
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

    