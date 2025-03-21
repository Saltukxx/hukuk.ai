import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

def test_google_ai():
    # Load environment variables
    print("Loading environment variables...")
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in .env file")
        return False
    
    print(f"API key found: {api_key[:5]}...")
    
    try:
        # Configure the Google AI API
        print("Configuring Google AI API...")
        genai.configure(api_key=api_key)
        
        # List available models
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
        
        # Get a generative model - using one of the available models from the list
        print("Loading Gemini model...")
        model = genai.GenerativeModel('models/gemini-1.5-pro')
        
        # Generate content
        print("Generating content...")
        test_prompt = "Explain briefly the importance of labor law in Turkey."
        response = model.generate_content(test_prompt)
        
        print("\nTEST RESPONSE:")
        print("--------------------")
        print(response.text)
        print("--------------------")
        
        return True
    except Exception as e:
        print(f"Error occurred during Google AI test: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Google AI test...")
    result = test_google_ai()
    
    if result:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed!")
        sys.exit(1) 