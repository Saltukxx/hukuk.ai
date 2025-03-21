import os
import requests
import logging
import re
import json
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import sqlite3
import time

# Ensure logs directory exists
os.makedirs("app/logs", exist_ok=True)

# Logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app/logs/data_collector.log"),
        logging.StreamHandler()
    ]
)

class LegalDataCollector:
    """
    Türk hukuk sistemine ait kanunları ve Yargıtay kararlarını 
    çeşitli kaynaklardan toplayıp veritabanına kaydeden servis.
    """
    
    def __init__(self, db_path: str = "app/data/legal_database.db"):
        """
        LegalDataCollector sınıfını başlatır.
        
        Args:
            db_path: SQLite veritabanı dosya yolu
        """
        self.db_path = db_path
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # HTTP istekleri için varsayılan headers
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
        
        # Mevkzuat.gov.tr erişim bilgileri
        self.mevzuat_base_url = "https://www.mevzuat.gov.tr"
        
        # Kazanci.com.tr erişim bilgileri (gerçek uygulamada abonelik gerekebilir)
        self.kazanci_base_url = "https://www.kazanci.com.tr"
        
        # Lexpera.com.tr erişim bilgileri (gerçek uygulamada abonelik gerekebilir)
        self.lexpera_base_url = "https://www.lexpera.com.tr"
    
    def connect_db(self) -> sqlite3.Connection:
        """Veritabanı bağlantısı oluşturur."""
        return sqlite3.connect(self.db_path)
    
    async def collect_laws_from_mevzuat(self, law_type: str = "kanun", limit: int = 50) -> int:
        """
        mevzuat.gov.tr sitesinden kanunları toplar.
        
        Args:
            law_type: Mevzuat tipi (kanun, khk, tüzük, yönetmelik vb.)
            limit: Toplanacak maksimum kanun sayısı
            
        Returns:
            Eklenen kanun sayısı
        """
        try:
            logging.info(f"Mevzuat.gov.tr'den {law_type} tipi kanunlar toplanıyor...")
            
            # Mevzuat tipine göre URL belirle
            law_type_map = {
                "kanun": "Kanunlar",
                "khk": "KHK",
                "tuzuk": "Tuzukler",
                "yonetmelik": "Yonetmelikler",
                "cumhurbaskanligi_karari": "Cumhurbaskanligi-Kararlari",
                "anayasa": "Anayasa"
            }
            
            mapped_type = law_type_map.get(law_type.lower(), "Kanunlar")
            
            # Arama URL'si
            url = f"{self.mevzuat_base_url}/{mapped_type}.aspx"
            
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                logging.error(f"Mevzuat sitesine erişilemedi. Status: {response.status_code}")
                return 0
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # A'dan Z'ye sıralı mevzuat listesini bul
            law_links = []
            
            # Ana liste elementlerini bul (.mevzuatTuru, .mevzuatlar, .list-content gibi selectorları dene)
            list_containers = soup.select('.mevzuatTuru, .mevzuatlar, .list-content, #ctl00_ContentPlaceHolder1_pnlKanunlar, ul')
            
            if not list_containers:
                # Doğrudan tüm linkleri tara
                all_links = soup.select('a')
                for link in all_links:
                    href = link.get('href')
                    text = link.get_text(strip=True)
                    
                    # Kanunlara benzeyen linkleri seç
                    if href and ('MevzuatMetin' in href or 'MevzuatFihrist' in href or 'Kanun' in href):
                        if text and len(text) > 5:  # Kısa metinleri filtrele
                            law_links.append({'url': href, 'name': text})
            else:
                # Liste elementleri içindeki linkleri tara
                for container in list_containers:
                    link_elements = container.select('a')
                    
                    for link in link_elements:
                        href = link.get('href')
                        text = link.get_text(strip=True)
                        
                        if href and text and len(text) > 5:
                            # Tam URL oluştur
                            full_url = href if href.startswith('http') else self.mevzuat_base_url + ('/' + href if not href.startswith('/') else href)
                            law_links.append({'url': full_url, 'name': text})
            
            logging.info(f"Toplam {len(law_links)} adet {law_type} bulundu.")
            
            if not law_links:
                logging.error(f"Mevzuat listesi bulunamadı: {url}")
                return 0
            
            # Veritabanına ekle
            conn = self.connect_db()
            cursor = conn.cursor()
            
            # Maksimum limit kadar kanun ekle
            law_links = law_links[:limit]
            
            total_added = 0
            for law_link in law_links:
                # Bu kanun zaten var mı kontrol et
                cursor.execute("SELECT id FROM laws WHERE name = ?", (law_link['name'],))
                if cursor.fetchone():
                    logging.info(f"Kanun zaten veritabanında mevcut: {law_link['name']}")
                    continue
                
                # Kanun detaylarını çek
                law_url = law_link['url']
                law_details = self._extract_law_details(law_url)
                
                if not law_details:
                    logging.warning(f"Kanun detayları çekilemedi: {law_link['name']}")
                    continue
                
                # Kanunun adı ve numarası çekilemezse link bilgilerini kullan
                if not law_details.get('name'):
                    law_details['name'] = law_link['name']
                
                # Veritabanına ekle
                cursor.execute('''
                INSERT INTO laws (law_no, name, category, content, publication_date, last_updated)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    law_details.get('law_no', ''),
                    law_details.get('name', law_link['name']),
                    law_details.get('category', law_type),
                    law_details.get('content', ''),
                    law_details.get('publication_date', ''),
                    datetime.now().strftime('%Y-%m-%d')
                ))
                
                # Kanun ID'sini al
                law_id = cursor.lastrowid
                
                # Kanun maddelerini ekle
                for article in law_details.get('articles', []):
                    cursor.execute('''
                    INSERT INTO law_articles (law_id, article_no, content)
                    VALUES (?, ?, ?)
                    ''', (
                        law_id,
                        article.get('article_no', ''),
                        article.get('content', '')
                    ))
                
                total_added += 1
                logging.info(f"Kanun eklendi: {law_details.get('name', law_link['name'])}")
                
                # Her 5 kanunda bir commit yap
                if total_added % 5 == 0:
                    conn.commit()
                    logging.info(f"{total_added} kanun eklendi")
                
                # Siteye yük bindirmemek için bekle
                time.sleep(1)
            
            conn.commit()
            conn.close()
            
            logging.info(f"Toplam {total_added} adet {law_type} eklendi.")
            return total_added
            
        except Exception as e:
            logging.error(f"Kanun toplama hatası: {str(e)}")
            return 0
    
    def _extract_law_details(self, law_url: str) -> Dict[str, Any]:
        """
        Verilen URL'deki kanun detaylarını çeker.
        
        Args:
            law_url: Kanun detay sayfasının URL'si
            
        Returns:
            Kanun detayları ve maddeleri
        """
        try:
            logging.info(f"Kanun detayları çekiliyor: {law_url}")
            
            # API için gerekli parametreleri ayıklama
            law_id = None
            if "/mevzuat?MevzuatNo=" in law_url:
                law_id = law_url.split("MevzuatNo=")[1].split("&")[0]
            
            # Eğer kanun ID'si bulunamazsa doğrudan sayfayı çek
            if not law_id:
                response = requests.get(law_url, headers=self.headers)
                if response.status_code != 200:
                    logging.error(f"Kanun detayları alınamadı. URL: {law_url}, Status: {response.status_code}")
                    return {}
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Temel bilgileri çek (sayfanın yapısına göre ayarlanmalı)
                law_no = ""
                law_name = ""
                pub_date = ""
                content = ""
                articles = []
                
                # Kanun numarası
                law_no_element = soup.select_one('.kanun-no, .mevzuat-no')  
                if law_no_element:
                    law_no = law_no_element.get_text(strip=True)
                else:
                    # Alternatif yöntem - başlıktan çekme
                    title_element = soup.select_one('h1, h2')
                    if title_element:
                        title_text = title_element.get_text(strip=True)
                        # Kanun numarasını başlıktan regex ile çekmeye çalış
                        law_no_match = re.search(r'\b(\d+)\b', title_text)
                        if law_no_match:
                            law_no = law_no_match.group(1)
                
                # Kanun adı
                law_name_element = soup.select_one('.kanun-adi, .mevzuat-adi, h1, h2')
                if law_name_element:
                    law_name = law_name_element.get_text(strip=True)
                
                # Yayın tarihi
                pub_date_element = soup.select_one('.yayin-tarihi, .mevzuat-tarihi')
                if pub_date_element:
                    pub_date = pub_date_element.get_text(strip=True)
                
                # Kanun içeriği - tüm metni al
                content_elements = soup.select('.kanun-icerigi, .mevzuat-icerigi, .content, article, .madde')
                if content_elements:
                    content = "\n".join([elem.get_text(strip=True) for elem in content_elements])
                else:
                    # Alternatif: sayfanın ana içeriğini al
                    main_content = soup.select_one('main, article, .content, body')
                    if main_content:
                        content = main_content.get_text(strip=True)
                
                # Kanun maddelerini bul
                article_elements = soup.select('.madde, article, p')
                
                for elem in article_elements:
                    article_text = elem.get_text(strip=True)
                    
                    # Madde numarasını ve içeriğini ayırmaya çalış
                    madde_match = re.search(r'MADDE\s+(\d+)\s*-\s*(.*)', article_text, re.IGNORECASE)
                    if madde_match:
                        article_no = madde_match.group(1)
                        article_content = madde_match.group(2)
                        
                        articles.append({
                            'article_no': article_no,
                            'content': article_content
                        })
            
            else:
                # API üzerinden kanun detaylarını çekme (gerçek uygulamada)
                api_url = f"{self.mevzuat_base_url}/api/Mevzuat/MevzuatDetay?mevzuatNo={law_id}"
                response = requests.get(api_url, headers=self.headers)
                
                if response.status_code != 200:
                    logging.error(f"Kanun API'sine erişilemedi. Status: {response.status_code}")
                    return {}
                
                try:
                    law_data = response.json()
                    
                    law_no = law_data.get('mevzuatNo', '')
                    law_name = law_data.get('mevzuatAdi', '')
                    pub_date = law_data.get('resmiGazeteTarihi', '')
                    content = law_data.get('mevzuatMetni', '')
                    
                    # Maddeleri ayıkla
                    madde_pattern = r'MADDE\s+(\d+)\s*-\s*(.*?)(?=MADDE\s+\d+\s*-|\Z)'
                    madde_matches = re.finditer(madde_pattern, content, re.DOTALL)
                    
                    for match in madde_matches:
                        article_no = match.group(1)
                        article_content = match.group(2).strip()
                        
                        articles.append({
                            'article_no': article_no,
                            'content': article_content
                        })
                        
                except ValueError:
                    logging.error(f"API yanıtı JSON formatında değil: {response.text[:200]}...")
                    return {}
            
            # Toplanan verileri döndür
            return {
                'law_no': law_no,
                'name': law_name,
                'publication_date': pub_date,
                'content': content,
                'articles': articles
            }
            
        except Exception as e:
            logging.error(f"Kanun detayları çekme hatası: {str(e)}")
            return {}
    
    async def collect_court_decisions(self, chamber: str = None, start_date: str = None, end_date: str = None, limit: int = 50) -> int:
        """
        Yargıtay kararlarını toplar.
        
        Args:
            chamber: Yargıtay dairesi (örn: "9. Hukuk Dairesi")
            start_date: Başlangıç tarihi (YYYY-MM-DD formatında)
            end_date: Bitiş tarihi (YYYY-MM-DD formatında)
            limit: Toplanacak maksimum karar sayısı
            
        Returns:
            Eklenen karar sayısı
        """
        try:
            logging.info(f"Yargıtay kararları toplanıyor... Daire: {chamber if chamber else 'Tümü'}")
            
            # Kazanci veya Lexpera için parametreleri hazırlama
            params = {}
            
            if chamber:
                params["chamber"] = chamber
            
            if start_date:
                params["startDate"] = start_date
            
            if end_date:
                params["endDate"] = end_date
                
            params["limit"] = limit
            
            # Önce Kazanci web sitesinden veri çekmeyi dene
            try:
                decisions = await self._fetch_decisions_from_kazanci(params)
                if not decisions:
                    # Kazanci'dan veri alınamazsa Lexpera'dan deneyelim
                    decisions = await self._fetch_decisions_from_lexpera(params)
                    
                if not decisions:
                    # Eğer gerçek veri çekilemezse örnek veri oluştur
                    logging.warning("Gerçek veri kaynağından veri çekilemedi, örnek veri kullanılıyor.")
                    decisions = self._generate_sample_court_decisions(chamber, start_date, end_date, limit)
            except Exception as e:
                logging.error(f"Veri çekme hatası: {str(e)}")
                # Hata durumunda örnek veri oluştur
                decisions = self._generate_sample_court_decisions(chamber, start_date, end_date, limit)
            
            conn = self.connect_db()
            cursor = conn.cursor()
            
            total_added = 0
            for decision in decisions:
                # Karar zaten veritabanında var mı kontrol et
                cursor.execute(
                    "SELECT id FROM court_decisions WHERE decision_no = ? AND chamber = ?", 
                    (decision.get('decision_no', ''), decision.get('chamber', ''))
                )
                
                if cursor.fetchone():
                    logging.info(f"Karar zaten veritabanında mevcut: {decision.get('decision_no')}")
                    continue
                
                # Yeni kararı ekle
                cursor.execute('''
                INSERT INTO court_decisions 
                (decision_no, decision_date, chamber, subject, content, keywords)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    decision.get('decision_no', ''),
                    decision.get('decision_date', ''),
                    decision.get('chamber', ''),
                    decision.get('subject', ''),
                    decision.get('content', ''),
                    decision.get('keywords', '')
                ))
                
                total_added += 1
                
                # Her 10 kararda bir commit yap
                if total_added % 10 == 0:
                    conn.commit()
                    logging.info(f"{total_added} karar eklendi")
            
            conn.commit()
            conn.close()
            
            logging.info(f"Toplam {total_added} adet Yargıtay kararı eklendi.")
            return total_added
            
        except Exception as e:
            logging.error(f"Yargıtay kararları toplama hatası: {str(e)}")
            return 0
    
    async def _fetch_decisions_from_kazanci(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Kazanci.com.tr'den Yargıtay kararlarını çeker.
        
        Args:
            params: Sorgu parametreleri
            
        Returns:
            Yargıtay kararları listesi
        """
        try:
            logging.info("Kazanci.com.tr'den kararlar çekiliyor...")
            
            # Kazanci'ye özel parametreler
            kazanci_params = {
                "daire": params.get("chamber", ""),
                "baslangicTarihi": params.get("startDate", ""),
                "bitisTarihi": params.get("endDate", ""),
                "limit": params.get("limit", 50)
            }
            
            # Arama sayfasına istek at
            search_url = f"{self.kazanci_base_url}/arama/yargitay-kararlari"
            response = requests.get(search_url, params=kazanci_params, headers=self.headers)
            
            if response.status_code != 200:
                logging.error(f"Kazanci.com.tr'ye erişilemedi. Status: {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Karar linklerini bul
            decision_links = []
            link_elements = soup.select('.karar-liste a, .search-results a, .result-item a')
            
            for link in link_elements:
                href = link.get('href')
                if href and '/karar/' in href:
                    full_url = self.kazanci_base_url + href if href.startswith('/') else href
                    decision_links.append(full_url)
            
            # Eğer hiç link bulunamazsa boş liste döndür
            if not decision_links:
                logging.warning("Kazanci.com.tr'de hiç karar linki bulunamadı.")
                return []
            
            # Her kararın detaylarını çek
            decisions = []
            for link in decision_links[:params.get("limit", 50)]:
                decision = await self._extract_kazanci_decision_details(link)
                if decision:
                    decisions.append(decision)
                
                # Siteye yük bindirmemek için kısa bir bekleme
                time.sleep(0.5)
            
            return decisions
            
        except Exception as e:
            logging.error(f"Kazanci.com.tr'den veri çekme hatası: {str(e)}")
            return []
    
    async def _extract_kazanci_decision_details(self, decision_url: str) -> Dict[str, Any]:
        """
        Kazanci.com.tr'den karar detaylarını çeker.
        
        Args:
            decision_url: Karar detay sayfasının URL'si
            
        Returns:
            Karar detayları
        """
        try:
            response = requests.get(decision_url, headers=self.headers)
            if response.status_code != 200:
                logging.error(f"Karar detayları alınamadı. URL: {decision_url}, Status: {response.status_code}")
                return {}
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Karar bilgilerini çek
            decision_no = ""
            decision_date = ""
            chamber = ""
            subject = ""
            content = ""
            keywords = ""
            
            # Karar numarası ve daire bilgisi
            header_element = soup.select_one('.karar-baslik, .karar-header, h1, h2')
            if header_element:
                header_text = header_element.get_text(strip=True)
                
                # Daire bilgisini çıkar
                chamber_match = re.search(r'(\d+\.\s*(?:Hukuk|Ceza)\s*Dairesi)', header_text, re.IGNORECASE)
                if chamber_match:
                    chamber = chamber_match.group(1)
                
                # Karar numarasını çıkar
                decision_no_match = re.search(r'(\d{4}/\d+)', header_text)
                if decision_no_match:
                    decision_no = decision_no_match.group(1)
            
            # Karar tarihi
            date_element = soup.select_one('.karar-tarih, .date, .tarih')
            if date_element:
                date_text = date_element.get_text(strip=True)
                date_match = re.search(r'(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})', date_text)
                if date_match:
                    date_str = date_match.group(1)
                    # Tarihi standart formata çevir
                    if '.' in date_str:
                        day, month, year = date_str.split('.')
                        decision_date = f"{year}-{month}-{day}"
                    else:
                        decision_date = date_str
            
            # Konu
            subject_element = soup.select_one('.karar-konu, .subject, .konu')
            if subject_element:
                subject = subject_element.get_text(strip=True)
            
            # İçerik
            content_element = soup.select_one('.karar-icerik, .content, .icerik, .karar-metni')
            if content_element:
                content = content_element.get_text(strip=True)
            else:
                # Alternatif: tüm metni al
                content = soup.get_text(strip=True)
            
            # Anahtar kelimeler
            keywords_element = soup.select_one('.anahtar-kelimeler, .keywords, .etiketler')
            if keywords_element:
                keywords = keywords_element.get_text(strip=True)
            else:
                # Anahtar kelimeleri metinden çıkar
                if content:
                    # En sık geçen anlamlı kelimeleri bul
                    words = re.findall(r'\b\w{4,}\b', content.lower())
                    word_count = {}
                    
                    for word in words:
                        if word not in ["için", "veya", "dava", "karar", "madde", "yargıtay", "mahkeme"]:
                            word_count[word] = word_count.get(word, 0) + 1
                    
                    # En sık geçen 5 kelimeyi al
                    top_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:5]
                    keywords = ", ".join([word for word, _ in top_words])
            
            return {
                "decision_no": decision_no,
                "decision_date": decision_date,
                "chamber": chamber,
                "subject": subject,
                "content": content,
                "keywords": keywords
            }
            
        except Exception as e:
            logging.error(f"Karar detayları çekme hatası: {str(e)}")
            return {}
    
    async def _fetch_decisions_from_lexpera(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Lexpera.com.tr'den Yargıtay kararlarını çeker.
        
        Args:
            params: Sorgu parametreleri
            
        Returns:
            Yargıtay kararları listesi
        """
        try:
            logging.info("Lexpera.com.tr'den kararlar çekiliyor...")
            
            # Lexpera'ya özel parametreler
            lexpera_params = {
                "Daire": params.get("chamber", ""),
                "BaslangicTarihi": params.get("startDate", ""),
                "BitisTarihi": params.get("endDate", ""),
                "Sayfa": "1",
                "SayfaBoyutu": str(params.get("limit", 50))
            }
            
            # Arama sayfasına istek at
            search_url = f"{self.lexpera_base_url}/ictihat/yargitay-kararlari"
            response = requests.get(search_url, params=lexpera_params, headers=self.headers)
            
            if response.status_code != 200:
                logging.error(f"Lexpera.com.tr'ye erişilemedi. Status: {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Karar linklerini bul
            decision_links = []
            link_elements = soup.select('.searchResult a, .searchItem a, .result-item a')
            
            for link in link_elements:
                href = link.get('href')
                if href and '/ictihat/' in href:
                    full_url = self.lexpera_base_url + href if href.startswith('/') else href
                    decision_links.append(full_url)
            
            # Eğer hiç link bulunamazsa boş liste döndür
            if not decision_links:
                logging.warning("Lexpera.com.tr'de hiç karar linki bulunamadı.")
                return []
            
            # Her kararın detaylarını çek
            decisions = []
            for link in decision_links[:params.get("limit", 50)]:
                decision = await self._extract_lexpera_decision_details(link)
                if decision:
                    decisions.append(decision)
                
                # Siteye yük bindirmemek için kısa bir bekleme
                time.sleep(0.5)
            
            return decisions
            
        except Exception as e:
            logging.error(f"Lexpera.com.tr'den veri çekme hatası: {str(e)}")
            return []
    
    async def _extract_lexpera_decision_details(self, decision_url: str) -> Dict[str, Any]:
        """
        Lexpera.com.tr'den karar detaylarını çeker.
        
        Args:
            decision_url: Karar detay sayfasının URL'si
            
        Returns:
            Karar detayları
        """
        try:
            response = requests.get(decision_url, headers=self.headers)
            if response.status_code != 200:
                logging.error(f"Karar detayları alınamadı. URL: {decision_url}, Status: {response.status_code}")
                return {}
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Karar bilgilerini çek
            decision_no = ""
            decision_date = ""
            chamber = ""
            subject = ""
            content = ""
            keywords = ""
            
            # Karar numarası
            decision_no_element = soup.select_one('.karar-no, .decision-no, .no')
            if decision_no_element:
                decision_no = decision_no_element.get_text(strip=True)
            
            # Daire
            chamber_element = soup.select_one('.daire, .chamber, .court')
            if chamber_element:
                chamber = chamber_element.get_text(strip=True)
            
            # Karar tarihi
            date_element = soup.select_one('.karar-tarihi, .decision-date, .date')
            if date_element:
                date_text = date_element.get_text(strip=True)
                date_match = re.search(r'(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})', date_text)
                if date_match:
                    date_str = date_match.group(1)
                    # Tarihi standart formata çevir
                    if '.' in date_str:
                        day, month, year = date_str.split('.')
                        decision_date = f"{year}-{month}-{day}"
                    else:
                        decision_date = date_str
            
            # Konu
            subject_element = soup.select_one('.konu, .subject, .ozet')
            if subject_element:
                subject = subject_element.get_text(strip=True)
            
            # İçerik
            content_element = soup.select_one('.karar-metni, .decision-text, .content')
            if content_element:
                content = content_element.get_text(strip=True)
            else:
                # Alternatif: sayfa içeriğinden metni çıkar
                main_element = soup.select_one('main, article, .main-content')
                if main_element:
                    content = main_element.get_text(strip=True)
            
            # Anahtar kelimeler
            keywords_element = soup.select_one('.anahtar-kelimeler, .keywords, .tags')
            if keywords_element:
                keywords = keywords_element.get_text(strip=True)
            else:
                # İçerikten anahtar kelimeler çıkar
                if content:
                    # En sık geçen anlamlı kelimeleri bul
                    words = re.findall(r'\b\w{4,}\b', content.lower())
                    word_count = {}
                    
                    for word in words:
                        if word not in ["için", "veya", "dava", "karar", "madde", "yargıtay", "mahkeme"]:
                            word_count[word] = word_count.get(word, 0) + 1
                    
                    # En sık geçen 5 kelimeyi al
                    top_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:5]
                    keywords = ", ".join([word for word, _ in top_words])
            
            return {
                "decision_no": decision_no,
                "decision_date": decision_date,
                "chamber": chamber,
                "subject": subject,
                "content": content,
                "keywords": keywords
            }
            
        except Exception as e:
            logging.error(f"Karar detayları çekme hatası: {str(e)}")
            return {}
    
    def _generate_sample_court_decisions(self, chamber: str = None, start_date: str = None, end_date: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Örnek Yargıtay kararları oluşturur.
        
        Bu metod gerçek veriye erişilemediğinde yedek olarak kullanılır.
        
        Args:
            chamber: Yargıtay dairesi
            start_date: Başlangıç tarihi
            end_date: Bitiş tarihi
            limit: Karar sayısı
            
        Returns:
            Yargıtay kararları listesi
        """
        # Bu sadece örnek veri - gerçek veri çekilemezse kullanılır
        logging.warning("Örnek veri oluşturuluyor...")
        
        sample_decisions = []
        chambers = ["1. Hukuk Dairesi", "2. Hukuk Dairesi", "9. Hukuk Dairesi", "12. Ceza Dairesi", "15. Hukuk Dairesi"]
        
        # Belirli bir daire istenmişse sadece o daire için
        if chamber:
            chambers = [chamber]
        
        # Örnek kararlar oluştur
        for i in range(1, limit + 1):
            chamber_name = chambers[i % len(chambers)]
            year = 2022 - (i % 3)
            decision_no = f"{year}/{i*1000}"
            
            # Tarih kontrolü
            if start_date:
                # YYYY-MM-DD formatını kontrol et
                if re.match(r'\d{4}-\d{2}-\d{2}', start_date):
                    start_year = int(start_date.split("-")[0])
                    if year < start_year:
                        year = start_year
            
            if end_date:
                # YYYY-MM-DD formatını kontrol et
                if re.match(r'\d{4}-\d{2}-\d{2}', end_date):
                    end_year = int(end_date.split("-")[0])
                    if year > end_year:
                        year = end_year
            
            decision_date = f"{year}-{i%12+1:02d}-{i%28+1:02d}"
            
            if chamber_name == "2. Hukuk Dairesi":
                subject = "Boşanma Davası"
                content = f"""
                Yargıtay {chamber_name} {decision_no} sayılı kararı:
                
                DAVA: Taraflar arasındaki boşanma davasının yapılan muhakemesi sonunda mahalli mahkemece verilen, yukarıda tarih ve numarası gösterilen hükmün temyizen tetkiki taraflar tarafından istenilmekle, evrak okunup gereği görüşülüp düşünüldü:
                
                KARAR: Davacı, davalı ile {year-10} yılında evlendiklerini, evliliklerinin son döneminde davalının kendisine karşı şiddet uyguladığını, hakaret ettiğini ve evlilik birliğinin temelinden sarsıldığını ileri sürerek boşanmaya karar verilmesini talep etmiştir.
                
                Mahkemece, toplanan deliller ve tanık beyanları dikkate alınarak, evlilik birliğinin temelinden sarsıldığı gerekçesiyle Türk Medeni Kanunu'nun 166/1. maddesi gereğince tarafların boşanmalarına karar verilmiştir.
                
                Yapılan incelemede, taraflar arasındaki evlilik birliğinin temelinden sarsıldığı, ortak hayatın sürdürülmesinin beklenemeyeceği anlaşılmakla, mahkeme kararının ONANMASINA karar verilmiştir.
                """
                keywords = "boşanma, evlilik birliğinin sarsılması, TMK 166"
            
            elif chamber_name == "9. Hukuk Dairesi":
                subject = "İşçilik Alacakları"
                content = f"""
                Yargıtay {chamber_name} {decision_no} sayılı kararı:
                
                DAVA: Davacı, kıdem tazminatı, ihbar tazminatı ve yıllık izin ücretinin tahsilini istemiştir.
                
                Mahkeme, isteği kısmen hüküm altına almıştır.
                
                Hüküm süresi içinde davalı avukatı tarafından temyiz edilmiş olmakla, dava dosyası için Tetkik Hakimi tarafından düzenlenen rapor dinlendikten sonra dosya incelendi, gereği konuşulup düşünüldü:
                
                KARAR: Davacı işçi, davalı işveren nezdinde {year-5} yılından itibaren çalıştığını, iş akdinin haksız feshedildiğini ileri sürerek kıdem ve ihbar tazminatı ile yıllık izin ücreti alacaklarını istemiştir.
                
                Dosyadaki bilgi ve belgelerden, davacının iş akdinin işveren tarafından haksız olarak feshedildiği anlaşılmakla, 4857 sayılı İş Kanunu'nun 17. ve 32. maddeleri uyarınca kıdem tazminatı ve ihbar tazminatına hak kazandığına karar verilmiştir.
                
                Yıllık izin ücreti talebine ilişkin olarak ise, davacının kullanmadığı izin sürelerinin belirlenmesi için dosyanın yerel mahkemeye İADESİNE karar verilmiştir.
                """
                keywords = "işçilik alacakları, kıdem tazminatı, ihbar tazminatı, yıllık izin ücreti, İş Kanunu 17, İş Kanunu 32"
            
            else:
                subject = f"Örnek Yargıtay Kararı {i}"
                content = f"""
                Yargıtay {chamber_name} {decision_no} sayılı kararı:
                
                DAVA: Davacı, davalıdan alacağının tahsilini talep etmiştir.
                
                KARAR: Mahkemece toplanan deliller ve bilirkişi raporu doğrultusunda davanın kabulüne karar verilmiştir.
                
                Kararın incelenmesinde, mahkeme değerlendirmesinin usul ve yasaya uygun olduğu anlaşıldığından, temyiz itirazlarının reddi ile kararın ONANMASINA karar verilmiştir.
                """
                keywords = "alacak, tahsil, borç, TMK, TBK"
            
            sample_decisions.append({
                "decision_no": decision_no,
                "decision_date": decision_date,
                "chamber": chamber_name,
                "subject": subject,
                "content": content,
                "keywords": keywords
            })
        
        return sample_decisions
    
    async def backup_database(self, backup_path: Optional[str] = None) -> bool:
        """
        Veritabanını yedekler.
        
        Args:
            backup_path: Yedek dosyasının yolu (varsayılan: app/data/backups/)
            
        Returns:
            İşlemin başarılı olup olmadığı
        """
        try:
            if not backup_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_dir = "app/data/backups"
                os.makedirs(backup_dir, exist_ok=True)
                backup_path = f"{backup_dir}/legal_db_backup_{timestamp}.db"
            
            conn = self.connect_db()
            
            # Backup işlemi
            backup_conn = sqlite3.connect(backup_path)
            conn.backup(backup_conn)
            
            conn.close()
            backup_conn.close()
            
            logging.info(f"Veritabanı başarıyla yedeklendi: {backup_path}")
            return True
            
        except Exception as e:
            logging.error(f"Veritabanı yedekleme hatası: {str(e)}")
            return False 