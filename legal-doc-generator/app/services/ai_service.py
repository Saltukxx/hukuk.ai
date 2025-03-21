import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
import json
import sqlite3
import re

# .env dosyasından API anahtarı ve diğer yapılandırmaları yükle
load_dotenv()

# Google AI API anahtarını ayarla
google_api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=google_api_key)

class AIService:
    """
    Yapay zeka servisi, hukuki belgelerin oluşturulması için
    Google AI (Gemini) API ile etkileşim sağlar.
    """
    
    def __init__(self, db_path: str = "app/data/legal_database.db"):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY .env dosyasında tanımlanmamış")
        
        # Gemini modeli yapılandırması
        self.model = genai.GenerativeModel('models/gemini-1.5-pro')
        
        # Veritabanı bağlantısı
        self.db_path = db_path
    
    def connect_db(self) -> sqlite3.Connection:
        """Veritabanı bağlantısı oluşturur."""
        return sqlite3.connect(self.db_path)
    
    async def _get_relevant_laws(self, case_category: str, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Verilen kategoriye ve anahtar kelimelere göre ilgili kanunları getirir.
        """
        try:
            conn = self.connect_db()
            cursor = conn.cursor()
            
            # Anahtar kelimeleri OR koşulu ile birleştir
            query_parts = []
            params = []
            
            for keyword in keywords:
                query_parts.append("(name LIKE ? OR content LIKE ?)")
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            
            # Kategori filtresini ekle
            if case_category:
                category_mapping = {
                    "iş_hukuku": "İş Hukuku",
                    "aile_hukuku": "Medeni Hukuk",
                    "borçlar_hukuku": "Borçlar Hukuku",
                    "ceza_hukuku": "Ceza Hukuku",
                    "tüketici_hukuku": "Tüketici Hukuku",
                    "ticaret_hukuku": "Ticaret Hukuku",
                    "idare_hukuku": "İdare Hukuku"
                }
                
                mapped_category = category_mapping.get(case_category)
                if mapped_category:
                    query_parts.append("category = ?")
                    params.append(mapped_category)
            
            # Sorguyu oluştur
            query = f"""
            SELECT id, law_no, name, category, content, publication_date, last_updated
            FROM laws
            WHERE {" OR ".join(query_parts)}
            LIMIT 10
            """
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Sonuçları biçimlendir
            results = []
            for row in rows:
                law_id = row[0]
                
                # Bu kanuna ait maddeleri getir
                cursor.execute("""
                SELECT article_no, content
                FROM law_articles
                WHERE law_id = ?
                LIMIT 20
                """, (law_id,))
                
                articles = []
                for article_row in cursor.fetchall():
                    articles.append({
                        "article_no": article_row[0],
                        "content": article_row[1]
                    })
                
                # Kanun bilgilerini ekle
                results.append({
                    "id": row[0],
                    "law_no": row[1],
                    "name": row[2],
                    "category": row[3],
                    "content": row[4],
                    "publication_date": row[5],
                    "last_updated": row[6],
                    "articles": articles
                })
            
            conn.close()
            return results
            
        except Exception as e:
            print(f"İlgili kanunları getirme hatası: {str(e)}")
            return []
    
    async def _get_relevant_decisions(self, case_category: str, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Verilen kategoriye ve anahtar kelimelere göre ilgili Yargıtay kararlarını getirir.
        """
        try:
            conn = self.connect_db()
            cursor = conn.cursor()
            
            # Anahtar kelimeleri OR koşulu ile birleştir
            query_parts = []
            params = []
            
            for keyword in keywords:
                query_parts.append("(subject LIKE ? OR content LIKE ? OR keywords LIKE ?)")
                params.extend([f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"])
            
            # Daire filtresini ekle
            if case_category:
                category_to_chamber = {
                    "iş_hukuku": "9. Hukuk Dairesi",
                    "aile_hukuku": "2. Hukuk Dairesi",
                    "borçlar_hukuku": "4. Hukuk Dairesi",
                    "ceza_hukuku": "12. Ceza Dairesi",
                    "tüketici_hukuku": "13. Hukuk Dairesi",
                    "ticaret_hukuku": "11. Hukuk Dairesi",
                    "idare_hukuku": "12. Hukuk Dairesi"
                }
                
                chamber = category_to_chamber.get(case_category)
                if chamber:
                    query_parts.append("chamber = ?")
                    params.append(chamber)
            
            # Sorguyu oluştur
            query = f"""
            SELECT id, decision_no, decision_date, chamber, subject, content, keywords
            FROM court_decisions
            WHERE {" OR ".join(query_parts)}
            ORDER BY decision_date DESC
            LIMIT 10
            """
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Sonuçları biçimlendir
            results = []
            for row in rows:
                results.append({
                    "id": row[0],
                    "decision_no": row[1],
                    "decision_date": row[2],
                    "chamber": row[3],
                    "subject": row[4],
                    "content": row[5],
                    "keywords": row[6]
                })
            
            conn.close()
            return results
            
        except Exception as e:
            print(f"İlgili Yargıtay kararlarını getirme hatası: {str(e)}")
            return []
    
    async def _extract_keywords(self, text: str) -> List[str]:
        """
        Metinden anahtar kelimeleri çıkarır.
        """
        # Metni temizle
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        
        # Stopwords (durma kelimeleri)
        stopwords = ["ve", "veya", "ile", "bir", "bu", "şu", "o", "ki", "da", "de", "mi", "mu", "mı", "için", "gibi", "kadar", "sonra", "önce", "dolayı", "göre", "ise", "ama", "fakat", "lakin", "ancak", "çünkü", "zira", "eğer", "şayet", "yani", "nasıl", "neden", "niye", "ne", "kim", "kime", "hangi", "her", "tüm", "bütün", "hep", "hiç", "daha", "en", "çok", "defa", "kez", "kere", "adet", "eder", "eden", "etti", "etmek", "etmez", "olmak", "olur", "oldu", "olacak", "olmuş", "oluyor", "gerek", "lazım", "zorunlu", "şart", "diye", "üzere", "ait", "ilişkin", "yönelik", "arasında", "üzerinde", "altında", "yanında", "birlikte", "karşı", "doğru", "yana", "beri", "rağmen", "itibaren", "önce", "sonra", "başka", "diğer", "ayrıca", "ayrı", "farklı", "fazla", "fazlaca", "gayrı", "değil", "değildir", "değildi", "değilmiş", "yoktur", "yoktu", "yokmuş", "yok", "var", "vardır", "vardı", "varmış", "olan", "olarak", "olduğu", "olduğunu", "olacağı", "olacağını", "olması", "olmalı", "olmaz", "olmayan", "olmadığı", "olmadığını", "olmayacağı", "olmayacağını", "olmaması", "olmamalı", "olsa", "olsun", "olsaydı", "olmuş", "olmuştur", "oluyordu", "olacaktır", "olabilir", "olabilirdi", "olabilecek", "olabilecekti", "olsaydı", "olsaymış", "olursa", "olurdu", "olurmuş", "olan", "olup", "olarak", "olduğu", "olacağı", "olması", "olmaz", "olmadı", "olmamış", "olmayacak", "olmasın", "olsaydı", "olsaymış", "olursa", "olurdu", "olurmuş", "olmalı", "olmalıydı", "olmaktadır", "olmaktaydı", "olacaktır", "olacaktı", "olmuştur", "olmuştu", "oluyordu", "olmaktaydı", "olacaktır", "olacaktı"]

        # Tokenize
        words = [word for word in re.findall(r'\w+', text) if word not in stopwords and len(word) > 3]
        
        # Kelime frekansı hesapla
        word_freq = {}
        for word in words:
            if word in word_freq:
                word_freq[word] += 1
            else:
                word_freq[word] = 1
        
        # Frekansa göre sırala
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        # En sık kullanılan 15 kelimeyi döndür
        return [word for word, freq in sorted_words[:15]]
    
    async def analyze_case(self, 
                           case_description: str, 
                           case_category: str) -> Dict[str, Any]:
        """
        Olay açıklamasına göre hukuki analiz yapar
        ve ilgili kanun ve Yargıtay kararlarını tespit eder.
        
        Args:
            case_description: Dava/Olay detaylı açıklaması
            case_category: Hukuk kategorisi (iş hukuku, ceza hukuku, vb.)
            
        Returns:
            Analiz sonuçlarını içeren sözlük
        """
        try:
            print(f"[analyze_case] Starting analysis for category: {case_category}")
            
            # Çok uzun metinleri kısalt (genai model sınırlamaları için)
            truncated_case = case_description[:1500] if len(case_description) > 1500 else case_description
            
            # Analiz promptu
            prompt = f"""
            Aşağıdaki {case_category} ile ilgili olay açıklamasını analiz et. 
            Bu durumla ilgili:
            
            1. Kısa bir hukuki değerlendirme yap (max. 150 kelime)
            2. İlgili temel Türk kanunlarını belirle (maddelerle birlikte, en fazla 3 adet)
            3. İlgili olabilecek Yargıtay kararlarını belirle (en fazla 2 adet)
            
            Cevabını JSON formatında ver, şu anahtarları kullan: "analysis", "relevant_laws", "relevant_decisions"
            
            {truncated_case}
            """
            
            system_prompt = "Sen Türkiye'deki hukuk sistemi konusunda uzman bir avukatsın. Sana verilen hukuki olayları analiz et ve JSON formatında yanıt ver."
            
            print(f"[analyze_case] Sending analysis request to Gemini API")
            
            # Retry mekanizması
            max_retries = 3
            retry_count = 0
            response_content = None
            
            while retry_count < max_retries and response_content is None:
                try:
                    response = self.model.generate_content(
                        [system_prompt, prompt],
                        generation_config={"temperature": 0.2}
                    )
                    
                    if not hasattr(response, 'text') or not response.text:
                        print(f"[analyze_case] Empty response received on attempt {retry_count+1}/{max_retries}")
                        retry_count += 1
                        continue
                        
                    response_content = response.text
                    print(f"[analyze_case] API response received, length: {len(response_content)}")
                    
                except Exception as api_error:
                    retry_count += 1
                    print(f"[analyze_case] API error on attempt {retry_count}/{max_retries}: {str(api_error)}")
                    if retry_count >= max_retries:
                        raise
            
            # Tüm retry'lar başarısız olursa
            if response_content is None:
                print("[analyze_case] All API attempts failed, creating fallback analysis")
                return {
                    "analysis": f"Bu {case_category} vakası için analiz yapılamadı.",
                    "category": case_category,
                    "relevant_laws": [],
                    "relevant_decisions": [],
                    "error": "API yanıtı alınamadı."
                }
            
            # JSON çıktısını parse et
            try:
                # JSON bloğunu ayıkla (markdown formatında olabilir)
                json_str = response_content
                
                # Eğer markdown json bloğu içeriyorsa ayıkla
                if "```json" in response_content:
                    json_str = response_content.split("```json")[1].split("```")[0].strip()
                elif "```" in response_content:
                    json_str = response_content.split("```")[1].split("```")[0].strip()
                
                analysis_data = json.loads(json_str)
                print(f"[analyze_case] Successfully parsed JSON response")
                
                # Gerekli alanları doğrula ve varsayılan değerlerle doldur
                if "analysis" not in analysis_data:
                    analysis_data["analysis"] = f"Bu {case_category} vakası için analiz yapılamadı."
                
                if "relevant_laws" not in analysis_data or not isinstance(analysis_data["relevant_laws"], list):
                    analysis_data["relevant_laws"] = []
                
                if "relevant_decisions" not in analysis_data or not isinstance(analysis_data["relevant_decisions"], list):
                    analysis_data["relevant_decisions"] = []
                
                # Kategori bilgisini ekle
                analysis_data["category"] = case_category
                analysis_data["timestamp"] = str(datetime.now())
                
                return analysis_data
                
            except json.JSONDecodeError as json_error:
                print(f"[analyze_case] JSON parse error: {str(json_error)}")
                print(f"[analyze_case] Raw response that couldn't be parsed: {response_content[:200]}...")
                
                # JSON parse edilemezse basit bir yanıt oluştur
                return {
                    "analysis": f"Bu {case_category} vakası için şu değerlendirme yapılabilir: " + 
                               response_content[:200] + "...",
                    "category": case_category,
                    "relevant_laws": [],
                    "relevant_decisions": [],
                    "parsing_error": str(json_error)
                }
                
        except Exception as e:
            print(f"[analyze_case] ERROR: {str(e)}")
            return {
                "analysis": f"Bu {case_category} vakası için analiz yapılamadı.",
                "category": case_category,
                "relevant_laws": [],
                "relevant_decisions": [],
                "error": str(e)
            }

    async def generate_legal_document(self, 
                               template_name: str,
                               case_details: str,
                               legal_analysis: Dict[str, Any],
                               template_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verilen şablona, olay detaylarına ve hukuki analize dayanarak
        profesyonel bir hukuki belge oluşturur.
        
        Args:
            template_name: Şablon adı
            case_details: Olay detayları
            legal_analysis: Hukuki analiz sonuçları
            template_data: Şablon verileri
            
        Returns:
            Belge içeriğini ve metadata'yı içeren sözlük
        """
        try:
            print(f"[generate_legal_document] Starting generation for {template_name}")
            # Belge türüne göre uygun prompt oluştur
            document_type_prompts = {
                "dilekce": "genel bir dilekçe",
                "ihtarname": "resmi bir ihtarname",
                "vekaletname": "detaylı bir vekaletname",
                "dava_dilekce": "kapsamlı bir dava dilekçesi",
                "temyiz_dilekce": "detaylı bir temyiz dilekçesi" 
            }
            
            document_type = document_type_prompts.get(template_name, "hukuki belge")
            category = legal_analysis.get("category", "genel")
            
            print(f"[generate_legal_document] Preparing prompt context for {document_type}")
            # Daha basit bir prompt oluştur - içeriği sınırla
            laws_context = "İlgili kanunlar: "
            for law in legal_analysis.get("relevant_laws", [])[:3]:  # Sadece ilk 3 kanunu al
                laws_context += f"{law.get('name', '')} (No: {law.get('law_no', '')}), "
            
            decisions_context = "İlgili Yargıtay kararları: "
            for decision in legal_analysis.get("relevant_decisions", [])[:2]:  # Sadece ilk 2 kararı al
                decisions_context += f"{decision.get('chamber', '')} {decision.get('decision_no', '')}, "
            
            # Şablon verilerini basitleştir
            template_data_str = "Şablon bilgileri: "
            for key, value in template_data.items():
                if isinstance(value, str):
                    template_data_str += f"{key}: {value[:50]}..., " if len(value) > 50 else f"{key}: {value}, "
            
            # Daha kısa ve basit bir prompt
            prompt = f"""
            Bir Türk avukatı olarak {document_type} oluştur.
            
            Belge türü: {document_type}
            Hukuk alanı: {category}
            
            Olay: 
            {case_details[:500]}... 
            
            {laws_context}
            
            {decisions_context}
            
            Lütfen sadece belge içeriğini oluştur.
            """
            
            system_prompt = "Sen Türk hukuk sisteminde uzman bir avukatsın. Senin görevin profesyonel hukuki belgeler oluşturmak."
            
            print(f"[generate_legal_document] Sending API request to Gemini")
            
            # Gemini modeliyle belge içeriği oluştur - retry mekanizması ekle
            enhanced_content = None
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries and enhanced_content is None:
                try:
                    response = self.model.generate_content(
                        [system_prompt, prompt],
                        generation_config={"temperature": 0.3}
                    )
                    
                    if not hasattr(response, 'text') or not response.text:
                        print(f"[generate_legal_document] Empty response received, retry {retry_count+1}/{max_retries}")
                        retry_count += 1
                        continue
                    
                    enhanced_content = response.text
                    print(f"[generate_legal_document] API response successfully received, content length: {len(enhanced_content)}")
                    
                except Exception as api_error:
                    retry_count += 1
                    print(f"[generate_legal_document] API error on attempt {retry_count}/{max_retries}: {str(api_error)}")
                    if retry_count >= max_retries:
                        raise
            
            # Tüm retry'lar başarısız olursa
            if enhanced_content is None:
                print("[generate_legal_document] All API attempts failed, creating fallback content")
                enhanced_content = f"""
                Bu belge, olay detaylarına dayanarak oluşturulmuştur. 
                
                Hukuki durum: {category}
                
                Olay Özeti: {case_details[:200]}...
                
                Bu belge otomatik olarak oluşturulmuştur.
                """
            
            # Şablon verilerine zenginleştirilmiş içeriği ekle
            enhanced_template_data = dict(template_data)  # Orijinal veriyi kopyala
            
            print(f"[generate_legal_document] Enhancing template data with generated content")
            # Hangi alanları doldurmalıyız?
            content_fields = []
            if template_name == "dilekce":
                content_fields = ["icerik"]
            elif template_name == "ihtarname":
                content_fields = ["icerik", "sonuc_talep"]
            elif template_name == "dava_dilekce":
                content_fields = ["aciklamalar", "hukuki_sebepler", "sonuc_talep"]
            elif template_name == "temyiz_dilekce":
                content_fields = ["temyiz_sebepleri", "sonuc_talep"]
            elif template_name == "vekaletname":
                content_fields = ["yetki_kapsami"]
            else:
                # Genel durumda bu alanları doldur
                content_fields = ["icerik", "aciklamalar", "hukuki_sebepler", "sonuc_talep", "temyiz_sebepleri", "yetki_kapsami"]
                
            # Şablon verilerindeki ilgili alanları doldur
            for key in content_fields:
                if key in enhanced_template_data:
                    enhanced_template_data[key] = enhanced_content
            
            print(f"[generate_legal_document] Document generation complete")
            return {
                "enhanced_template_data": enhanced_template_data,
                "raw_ai_content": enhanced_content,
                "metadata": {
                    "ai_enhanced": True,
                    "template_name": template_name,
                    "timestamp": str(datetime.now()),
                    "category": category
                }
            }
            
        except Exception as e:
            print(f"[generate_legal_document] ERROR: {str(e)}")
            # Hata durumunda orijinal şablon verilerini geri döndür ve hatayı belirt
            
            # Basit bir içerik oluştur
            fallback_content = f"""
            Bu belge, bir hata nedeniyle otomatik olarak oluşturulmuştur.
            
            Olay Özeti: {case_details[:100] if case_details else "Belirtilmedi"}...
            
            Lütfen tekrar deneyiniz veya sistem yöneticisiyle iletişime geçiniz.
            """
            
            # Şablona göre alanları doldur
            enhanced_template_data = dict(template_data)  # Orijinal veriyi kopyala
            if "icerik" in enhanced_template_data:
                enhanced_template_data["icerik"] = fallback_content
            if "aciklamalar" in enhanced_template_data:
                enhanced_template_data["aciklamalar"] = fallback_content
            if "hukuki_sebepler" in enhanced_template_data:
                enhanced_template_data["hukuki_sebepler"] = "Hukuki sebepler oluşturulamadı."
            if "sonuc_talep" in enhanced_template_data:
                enhanced_template_data["sonuc_talep"] = "Talep oluşturulamadı."
            
            return {
                "error": str(e),
                "enhanced_template_data": enhanced_template_data,
                "raw_ai_content": fallback_content
            } 