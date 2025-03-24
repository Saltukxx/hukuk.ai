"""
Test script for Gemini API
"""

import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if API_KEY else 'No'}")
if API_KEY:
    print(f"API Key length: {len(API_KEY)}")
    print(f"API Key format: {API_KEY[:4]}...{API_KEY[-4:]}")

async def test_gemini_api():
    print("Configuring Gemini API...")
    genai.configure(api_key=API_KEY)
    
    print("Creating model...")
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    print("Sending test prompt...")
    prompt = "Generate a short legal analysis of a contract dispute in Turkish (5 sentences maximum)."
    
    try:
        response = await model.generate_content_async(prompt)
        print("\nResponse received!")
        print("Response text:")
        print("-" * 50)
        print(response.text)
        print("-" * 50)
        print("Test completed successfully!")
        return True
    except Exception as e:
        print(f"Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    if not API_KEY:
        print("No API key found. Please set the GEMINI_API_KEY environment variable.")
        exit(1)
        
    print("Starting Gemini API test...")
    result = asyncio.run(test_gemini_api())
    
    if result:
        print("✅ Gemini API is working correctly!")
    else:
        print("❌ Gemini API test failed.") 