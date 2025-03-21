# Hukuk.AI - Turkish Legal Document Generator

Hukuk.AI is an AI-powered legal document generator specifically designed for the Turkish legal system. It creates professional legal documents using AI analysis of case descriptions, relevant laws, and court decisions.

## Features

- **AI-Powered Document Generation**: Create legal documents with AI assistance
- **Multiple Document Templates**: Support for various legal document types including petitions, notices, lawsuits
- **Legal Reference Integration**: Automatic inclusion of relevant laws and court decisions
- **User-Friendly Interface**: Modern, responsive UI designed for ease of use
- **Legal Analysis**: AI analysis of case details with references to applicable laws

## How It Works

1. **Input Case Details**: Users describe their legal situation and select document type
2. **AI Analysis**: The system analyzes the case and identifies relevant laws and precedents
3. **Document Generation**: AI creates a professional legal document with proper formatting
4. **Legal References**: References to relevant laws and court decisions are automatically included
5. **Download**: Users can download the generated document as a Word file

## Technologies Used

- **Backend**: Python with FastAPI
- **Frontend**: HTML, CSS, JavaScript with Bootstrap
- **AI Integration**: Google Gemini AI API
- **Document Generation**: Python-docx for Word document creation
- **Database**: SQLite for storing legal data

## Getting Started

### Prerequisites
- Python 3.8+
- Git

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Saltukxx/hukuk.ai.git
   cd hukuk.ai
   ```

2. Install dependencies
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables
   - Create a `.env` file in the project root
   - Add your Google API key: `GOOGLE_API_KEY=your_api_key_here`

4. Run the application
   ```
   python -m uvicorn app.main:app --reload
   ```

5. Open your browser and visit `http://localhost:8000`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the Turkish legal community for guidance on document formatting
- Powered by Google Gemini AI 