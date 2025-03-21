import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Get the API key
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("ERROR: GOOGLE_API_KEY not found in environment variables or .env file")
    sys.exit(1)

print(f"API Key found: {api_key[:5]}...{api_key[-5:]}")

# Configure the Gemini API
genai.configure(api_key=api_key)

def test_simple_prompt():
    """Test a simple prompt to verify API connection"""
    try:
        model = genai.GenerativeModel('models/gemini-1.5-pro')
        
        response = model.generate_content("Say hello in Turkish")
        
        print("\nSimple Prompt Test:")
        print(f"Response: {response.text}")
        print("Simple test PASSED ✓")
        return True
    except Exception as e:
        print(f"\nSimple Prompt Test FAILED: {str(e)}")
        return False

def test_document_generation():
    """Test document generation with similar parameters to the app"""
    try:
        model = genai.GenerativeModel('models/gemini-1.5-pro')
        
        system_prompt = "Sen Türk hukuk sisteminde uzman bir avukatsın. Senin görevin profesyonel hukuki belgeler oluşturmak."
        
        user_prompt = """
        Bir Türk avukatı olarak genel bir dilekçe oluştur.
        
        Belge türü: dilekçe
        Hukuk alanı: iş_hukuku
        
        Olay: 
        İş yerinde mobbing yaşadım ve istifa etmek zorunda kaldım. İşverenin baskıları sonucu istifa ettim. Kıdem ve ihbar tazminatı talep ediyorum.
        
        İlgili kanunlar: İş Kanunu, Borçlar Kanunu
        
        İlgili Yargıtay kararları: 9. Hukuk Dairesi 2019/3421
        
        Lütfen sadece belge içeriğini oluştur.
        """
        
        print("\nTesting document generation...")
        print("Sending request to Gemini API...")
        
        response = model.generate_content(
            [system_prompt, user_prompt],
            generation_config={"temperature": 0.3}
        )
        
        if not hasattr(response, 'text') or not response.text:
            print("ERROR: Empty response or missing text attribute")
            return False
            
        print(f"\nDocument generation result preview (first 150 chars):")
        print(f"{response.text[:150]}...")
        print("Document generation test PASSED ✓")
        return True
    except Exception as e:
        print(f"\nDocument Generation Test FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    print("==== Gemini API Diagnostic Test ====")
    
    simple_test = test_simple_prompt()
    document_test = test_document_generation()
    
    if simple_test and document_test:
        print("\n✅ All tests PASSED. Gemini API is working correctly.")
    else:
        if not simple_test:
            print("\n❌ Simple API test failed. Check your API key and internet connection.")
        if not document_test:
            print("\n❌ Document generation test failed. The issue is with the document generation logic.")
        
    print("\n==== Test Complete ====") 