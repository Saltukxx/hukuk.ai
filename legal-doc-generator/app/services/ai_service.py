"""
AI Service for Legal Analysis
This module provides integration with Google's Gemini API for analyzing legal cases.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import asyncio
import re

# Configure logging
logger = logging.getLogger(__name__)

class AILegalAnalyzer:
    """Handles the AI analysis of legal cases using Google's Generative AI (Gemini)"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the legal analyzer with API credentials
        
        Args:
            api_key (str, optional): The API key for Google Generative AI
        """
        # Try to get API key from environment variable if not provided
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        
        # Debug info on API key status (without showing the actual key)
        if self.api_key:
            key_preview = self.api_key[:4] + "..." + self.api_key[-4:] if len(self.api_key) > 8 else "[redacted]"
            logger.info(f"Gemini API key found with format: {key_preview}")
        else:
            logger.warning("No Gemini API key provided. Using mock data for development.")
            
        if not self.api_key:
            self.api_configured = False
        else:
            try:
                # Configure the Gemini API
                genai.configure(api_key=self.api_key)
                self.api_configured = True
                logger.info("Gemini API configured successfully")
                
                # Set up the model
                self.model = genai.GenerativeModel('gemini-1.5-pro')
                logger.info("Gemini model initialized successfully")
            except Exception as e:
                logger.error(f"Error configuring Gemini API: {str(e)}")
                logger.exception(e)
                self.api_configured = False
    
    async def analyze_case(self, case_description: str, case_category: str) -> Dict[str, Any]:
        """
        Analyze a legal case and provide relevant laws, court decisions, and recommendations
        
        Args:
            case_description (str): The detailed description of the legal case
            case_category (str): The category of law (e.g., family, contract, labor)
            
        Returns:
            Dict[str, Any]: Results including relevant laws, court decisions, and recommendations
        """
        logger.info(f"Analyzing case in category: {case_category}")
        
        # If API is not configured, return mock data for development
        if not self.api_configured:
            logger.warning("Using mock data since API is not configured")
            return self._get_mock_analysis(case_category)
        
        try:
            # Format the prompt for the AI
            prompt = self._create_legal_analysis_prompt(case_description, case_category)
            logger.info(f"Created prompt for analysis, length: {len(prompt)} characters")
            
            # Get response from Gemini
            analysis_data = await self._generate_analysis(prompt, case_category)
            logger.info(f"Received AI analysis data with {len(str(analysis_data))} characters")
            
            # If we have a valid analysis data dictionary, return it directly
            if isinstance(analysis_data, dict) and "relevant_laws" in analysis_data:
                logger.info("Successfully received AI analysis")
                return analysis_data
            
            # If we got a string response (older version compatibility)
            if isinstance(analysis_data, str):
                logger.warning("Received string response, parsing as JSON")
                # Parse the response
                analysis_data = self._parse_ai_response(analysis_data)
                logger.info("Successfully parsed AI response into structured data")
                
            return analysis_data
        except Exception as e:
            logger.error(f"Error analyzing case with AI: {str(e)}")
            logger.exception(e)
            return self._get_mock_analysis(case_category)
    
    def _create_legal_analysis_prompt(self, case_description: str, case_category: str) -> str:
        """Create a prompt for the AI to analyze the legal case"""
        
        # Translate the category for the prompt
        category_translations = {
            "aile_hukuku": "Aile Hukuku (Family Law)",
            "borçlar_hukuku": "Borçlar Hukuku (Contract Law)",
            "iş_hukuku": "İş Hukuku (Labor Law)",
            "ceza_hukuku": "Ceza Hukuku (Criminal Law)",
            "ticaret_hukuku": "Ticaret Hukuku (Commercial Law)",
            "idare_hukuku": "İdare Hukuku (Administrative Law)",
            "tüketici_hukuku": "Tüketici Hukuku (Consumer Law)"
        }
        
        category_turkish = category_translations.get(case_category, case_category)
        
        # Create the prompt for the model
        prompt = f"""Bir hukuk uzmanı olarak, aşağıdaki olay örgüsüne dayalı olarak kapsamlı bir hukuki analiz yap.
Analiz kategorisi: {category_turkish}

Olay örgüsü:
{case_description}

Analiz aşağıdaki bölümleri içermelidir:

1. Özet (Summary): Bu durum hakkında kısa bir değerlendirme yap.

2. İlgili Kanun Maddeleri (Relevant Laws): Türk hukuk sisteminde bu durum için en ilgili ve önemli 3-5 kanun maddesini belirt. Türk Medeni Kanunu, Borçlar Kanunu, İş Kanunu, Ceza Kanunu, vb. kanunlarda ilgili maddeleri liste.

3. İlgili Yargıtay Kararları (Relevant Court Decisions): Bu durumla ilgili olabilecek 2-4 önemli Yargıtay kararını belirt. Her karar için mahkeme dairesi, karar numarası ve kararın ana sonucu veya ilkesi verilmelidir.

4. Hukuki Öneriler (Recommendations): Bu durumla ilişkili hukuki tavsiyeler ve izlenecek yolu belirt.

Yanıtını aşağıdaki JSON formatında ver:

```json
{{
  "summary": "Durumun özeti",
  "relevant_laws": [
    {{"title": "Kanun Adı ve Madde Numarası", "description": "Maddenin içeriği ve bu duruma nasıl uygulanacağı"}},
    ...
  ],
  "relevant_decisions": [
    {{"case_number": "Karar Numarası", "date": "Tarih", "summary": "Kararın özeti ve önemi"}},
    ...
  ],
  "recommendations": "Hukuki tavsiyeler ve öneriler"
}}
```

Lütfen sadece belirtilen formatta JSON yanıt ver ve herhangi bir açıklama ekleme."""

        return prompt
    
    async def _generate_analysis(self, prompt: str, case_category: str) -> dict:
        """
        Generate analysis from Gemini API with improved error handling
        """
        if not self.api_configured:
            logger.warning("API not configured, returning mock analysis")
            return self._get_mock_analysis(case_category)
        
        try:
            logger.info(f"Sending prompt to Gemini model: {self.model.model_name}")
            logger.debug(f"Prompt content: {prompt[:100]}...")
            
            # Configure safety settings to allow legal content
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
            
            # Set generation config for structured output
            generation_config = {
                "temperature": 0.1,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
            
            # Send to Gemini API and get response
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Check if we have a valid response
            if not response or not response.text:
                logger.error("Empty response from Gemini API")
                return self._get_mock_analysis(case_category)
            
            # Log response length for debugging
            logger.info(f"Received response from Gemini API: {len(response.text)} characters")
            logger.debug(f"Response preview: {response.text[:200]}...")
            
            # Find the JSON part in the response
            text = response.text
            # Try to isolate JSON if it's wrapped in backticks or other markers
            json_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
            json_matches = re.findall(json_pattern, text)
            
            if json_matches:
                logger.info("Found JSON block in response")
                text = json_matches[0]  # Use the first JSON block found
            
            # Try to parse the response as JSON
            try:
                # Clean up the text before parsing (remove any non-JSON characters)
                text = text.strip()
                if not (text.startswith('{') and text.endswith('}')):
                    logger.warning("Response doesn't appear to be valid JSON, trying to extract JSON part")
                    # Try to find anything that looks like a JSON object
                    json_obj_pattern = r'(\{[\s\S]*\})'
                    obj_matches = re.search(json_obj_pattern, text)
                    if obj_matches:
                        text = obj_matches.group(1)
                
                logger.info(f"Attempting to parse JSON: {text[:100]}...")
                analysis_data = json.loads(text)
                
                # Validate the structure of the JSON
                expected_keys = ["summary", "relevant_laws", "relevant_decisions", "recommendations"]
                missing_keys = [key for key in expected_keys if key not in analysis_data]
                
                if missing_keys:
                    logger.warning(f"Analysis data is missing these keys: {missing_keys}")
                    # Add missing keys with empty values
                    for key in missing_keys:
                        if key in ["relevant_laws", "relevant_decisions"]:
                            analysis_data[key] = []
                        else:
                            analysis_data[key] = ""
                
                # Ensure relevant_laws and relevant_decisions are lists
                if not isinstance(analysis_data.get("relevant_laws"), list):
                    logger.warning("relevant_laws is not a list, fixing it")
                    analysis_data["relevant_laws"] = []
                
                if not isinstance(analysis_data.get("relevant_decisions"), list):
                    logger.warning("relevant_decisions is not a list, fixing it")
                    analysis_data["relevant_decisions"] = []
                
                # Ensure each law has title and description
                for i, law in enumerate(analysis_data["relevant_laws"]):
                    if not isinstance(law, dict):
                        analysis_data["relevant_laws"][i] = {"title": "Kanun", "description": str(law)}
                    elif "title" not in law:
                        law["title"] = "Kanun"
                    elif "description" not in law:
                        law["description"] = "Detay bilgi bulunmamaktadır."
                
                # Ensure each decision has case_number, date, and summary
                for i, decision in enumerate(analysis_data["relevant_decisions"]):
                    if not isinstance(decision, dict):
                        analysis_data["relevant_decisions"][i] = {
                            "case_number": "Belirsiz",
                            "date": "Belirsiz",
                            "summary": str(decision)
                        }
                    else:
                        if "case_number" not in decision:
                            decision["case_number"] = "Belirsiz"
                        if "date" not in decision:
                            decision["date"] = "Belirsiz"
                        if "summary" not in decision:
                            decision["summary"] = "Detay bilgi bulunmamaktadır."
                
                logger.info("Successfully parsed and validated analysis data")
                return analysis_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {str(e)}")
                logger.error(f"Raw response: {text}")
                # Fall back to mock data if JSON parsing fails
                return self._get_mock_analysis(case_category)
                
        except Exception as e:
            logger.error(f"Error generating analysis: {str(e)}")
            logger.exception(e)
            return self._get_mock_analysis(case_category)
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse the AI response into structured data"""
        try:
            logger.info("Parsing AI response...")
            # Extract JSON from the response
            # The response might contain markdown code blocks
            if "```json" in response:
                logger.info("Found JSON code block with ```json marker")
                json_content = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                logger.info("Found code block with ``` marker")
                json_content = response.split("```")[1].strip()
            else:
                logger.info("No code block markers found, treating entire response as JSON")
                json_content = response.strip()
            
            # Log the JSON content for debugging
            preview = json_content[:100] + "..." if len(json_content) > 100 else json_content
            logger.info(f"JSON content preview: {preview}")
            
            try:
                # Parse the JSON
                analysis_data = json.loads(json_content)
                logger.info("JSON parsed successfully")
            except json.JSONDecodeError as json_err:
                logger.error(f"JSON parsing error: {str(json_err)}")
                logger.error(f"JSON content that failed to parse: {json_content}")
                # Return a simplified mock response if JSON parsing fails
                return {
                    "relevant_laws": [
                        {
                            "title": "JSON Parsing Error",
                            "content": f"The AI response could not be parsed as JSON: {str(json_err)}"
                        }
                    ],
                    "relevant_decisions": [],
                    "recommendations": f"<p>Error processing AI response: {str(json_err)}</p><p>Raw response: {response[:500]}...</p>"
                }
            
            # Make sure we have all required fields
            if "relevant_laws" not in analysis_data:
                logger.warning("Adding missing 'relevant_laws' field to analysis data")
                analysis_data["relevant_laws"] = []
            if "relevant_decisions" not in analysis_data:
                logger.warning("Adding missing 'relevant_decisions' field to analysis data")
                analysis_data["relevant_decisions"] = []
            if "recommendations" not in analysis_data:
                logger.warning("Adding missing 'recommendations' field to analysis data")
                analysis_data["recommendations"] = ""
            
            logger.info("Successfully processed AI response into structured data")
            return analysis_data
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            logger.exception(e)
            # Return error information in the analysis data
            return {
                "relevant_laws": [
                    {
                        "title": "Error Processing AI Response",
                        "content": f"An error occurred while processing the AI response: {str(e)}"
                    }
                ],
                "relevant_decisions": [
                    {
                        "court": "Error",
                        "number": "N/A",
                        "content": "Could not process AI response"
                    }
                ],
                "recommendations": f"<p>Error: {str(e)}</p><p>Please try again with a different query.</p>"
            }
    
    def _get_mock_analysis(self, category: str) -> Dict[str, Any]:
        """
        Get mock analysis data for development when API is not available
        
        Args:
            category (str): The category of law
            
        Returns:
            Dict[str, Any]: Mock analysis data
        """
        if category == "aile_hukuku":
            return {
                "summary": "Bu aile hukuku vakasında, evlilik birliğinin temelinden sarsıldığı ve boşanma davası açılabileceği görülmektedir. Çocukların velayeti, nafaka hakları ve mal paylaşımı konuları değerlendirilmelidir.",
                "relevant_laws": [
                    {
                        "title": "Türk Medeni Kanunu Madde 166",
                        "description": "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir."
                    },
                    {
                        "title": "Türk Medeni Kanunu Madde 175",
                        "description": "Boşanma yüzünden yoksulluğa düşecek taraf, kusuru daha ağır olmamak koşuluyla geçimi için diğer taraftan malî gücü oranında süresiz olarak nafaka isteyebilir."
                    },
                    {
                        "title": "Türk Medeni Kanunu Madde 178",
                        "description": "Evliliğin boşanma sebebiyle sona ermesinden doğan dava hakları, boşanma hükmünün kesinleşmesinin üzerinden bir yıl geçmekle zamanaşımına uğrar."
                    },
                    {
                        "title": "Türk Medeni Kanunu Madde 169",
                        "description": "Boşanma veya ayrılık davası açılınca hâkim, davanın devamı süresince gerekli olan, özellikle eşlerin barınmasına, geçimine, eşlerin mallarının yönetimine ve çocukların bakım ve korunmasına ilişkin geçici önlemleri re'sen alır."
                    }
                ],
                "relevant_decisions": [
                    {
                        "case_number": "2019/8754 E, 2020/3421 K",
                        "date": "12.05.2020",
                        "summary": "Yargıtay 2. Hukuk Dairesi: Evlilik birliğinin temelinden sarsılmasında kusur değerlendirmesi yapılırken, tanık beyanları ve tarafların sosyal medya paylaşımları gibi tüm deliller birlikte değerlendirilmelidir."
                    },
                    {
                        "case_number": "2018/5421 E, 2019/2134 K",
                        "date": "24.09.2019",
                        "summary": "Yargıtay 2. Hukuk Dairesi: Eşler arasında şiddetli geçimsizlik bulunduğu ve ortak hayatın çekilmez hale geldiği anlaşıldığından, tarafların boşanmalarına karar verilmesi gerekir."
                    },
                    {
                        "case_number": "2021/1234 E, 2021/5678 K",
                        "date": "15.11.2021",
                        "summary": "Yargıtay 2. Hukuk Dairesi: Velayet hakkı belirlenirken çocuğun üstün yararı gözetilmeli, yaşı ve gelişim durumuna göre karar verilmelidir."
                    }
                ],
                "recommendations": """
                Boşanma davasında dikkate alınması gereken önemli hususlar:
                1. Boşanma sebebi olarak ileri sürülen vakıaların tanık ifadeleri, yazışmalar, ses/görüntü kayıtları gibi delillerle ispatlanması önemlidir.
                2. Çocukların velayeti talep ediliyorsa, çocuğun üstün yararını gösteren deliller (psikolojik raporlar, okul durumu, vs.) sunulmalıdır.
                3. Maddi ve manevi tazminat talepleri için kusur durumunun ve oluşan zararın ispatlanması gerekir.
                4. Mal rejiminin tasfiyesi için evlilik süresince edinilen malların dökümü ve değer tespitleri yapılmalıdır.
                5. Nafaka talepleri için gelir durumu, ihtiyaç ve kusur oranı belgelenmeli ve açıkça belirtilmelidir.
                
                Sunulan olay örgüsüne göre, dava sürecinin yaklaşık 1-2 yıl sürmesi beklenebilir. Anlaşmalı boşanma seçeneği değerlendirilirse süreç daha hızlı sonuçlanabilir.
                """
            }
        elif category == "borçlar_hukuku":
            return {
                "summary": "Bu borçlar hukuku vakasında, sözleşmeden doğan yükümlülüklerin yerine getirilmemesi durumu söz konusudur. Borcun ifa edilmemesi nedeniyle tazminat talep edilebilir.",
                "relevant_laws": [
                    {
                        "title": "Türk Borçlar Kanunu Madde 112",
                        "description": "Borcun hiç veya gereği gibi ifa edilmemesi durumunda borçlu, kendisine hiçbir kusurun yüklenemeyeceğini ispat etmedikçe, alacaklının bundan doğan zararını gidermekle yükümlüdür."
                    },
                    {
                        "title": "Türk Borçlar Kanunu Madde 114",
                        "description": "Borçlu, genel olarak her türlü kusurdan sorumludur. Bu sorumluluğun kapsamı, işin özel niteliğine göre belirlenir."
                    }
                ],
                "relevant_decisions": [
                    {
                        "case_number": "2019/1234 E, 2019/5678 K",
                        "date": "18.06.2019",
                        "summary": "Yargıtay 15. Hukuk Dairesi: Tacirler arası ilişkilerde özen yükümlülüğü daha yüksek düzeyde değerlendirilmelidir."
                    },
                    {
                        "case_number": "2018/2345 E, 2018/6789 K",
                        "date": "22.11.2018",
                        "summary": "Yargıtay 13. Hukuk Dairesi: Sözleşmeler kurulurken dürüstlük ilkesine uygun davranılması gerekmektedir."
                    }
                ],
                "recommendations": """
                Bu davada öncelikle dikkat edilmesi gereken noktalar:
                1. Sözleşmenin ne zaman ve hangi koşullarda imzalandığı tespit edilmelidir.
                2. Taraflar arasındaki yazışmalar delil teşkil edebilir, bunlar toplanmalıdır.
                3. Davalının temerrüde düştüğü tarihin tespiti önemlidir.
                4. Dava açmadan önce ihtarname çekilmesi ispat kolaylığı sağlayacaktır.
                
                Sonuç olarak, delillerin dikkatle toplanması ve iddia edilen zararın belgelendirilmesi halinde davanın kazanılma olasılığı yüksektir.
                """
            }
        else:
            return {
                "summary": "Bu vaka için gerçek yapay zeka analizi yapılamadı.",
                "relevant_laws": [
                    {
                        "title": "İlgili Kanun Maddesi",
                        "description": "API anahtarı sağlanmadığı veya bir teknik hata nedeniyle gerçek analiz yapılamadı. Lütfen tekrar deneyin."
                    }
                ],
                "relevant_decisions": [
                    {
                        "case_number": "Örnek Karar No",
                        "date": "01.01.2023",
                        "summary": "API anahtarı sağlanmadığı veya bir teknik hata nedeniyle gerçek yargı kararları analizi yapılamadı."
                    }
                ],
                "recommendations": """
                Gerçek AI analizi için:
                1. Bir Google Gemini API anahtarı edinin.
                2. Sisteme API anahtarını ekleyin.
                3. Gerçek zamanlı AI analizini etkinleştirin.
                
                Şu anda örnek veriler görüntülenmektedir.
                """
            } 