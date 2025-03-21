import os
import requests
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import sqlite3
import re

class LegalDatabaseService:
    """
    Türk hukuk sistemi için kanunlar ve Yargıtay kararları veritabanı servisi.
    Bu sınıf, hukuki belge oluşturma sürecinde kullanılacak.
    """
    
    def __init__(self, db_path: str = "app/data/legal_database.db"):
        """
        LegalDatabaseService sınıfını başlatır.
        
        Args:
            db_path: SQLite veritabanı dosya yolu
        """
        self.db_path = db_path
        self._initialize_db()
    
    def _initialize_db(self):
        """Veritabanını başlatır ve gerekli tabloları oluşturur."""
        try:
            # Veritabanı dizininin varlığını kontrol et
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            
            # Veritabanı bağlantısı
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Kanun tablosu
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS laws (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                law_no TEXT,
                name TEXT,
                category TEXT,
                content TEXT,
                publication_date TEXT,
                last_updated TEXT
            )
            ''')
            
            # Kanun maddeleri tablosu
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS law_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                law_id INTEGER,
                article_no TEXT,
                content TEXT,
                FOREIGN KEY (law_id) REFERENCES laws (id)
            )
            ''')
            
            # Yargıtay kararları tablosu
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS court_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                decision_no TEXT,
                decision_date TEXT,
                chamber TEXT,
                subject TEXT,
                content TEXT,
                keywords TEXT
            )
            ''')
            
            conn.commit()
            conn.close()
            
            print("Veritabanı başarıyla başlatıldı.")
            
        except Exception as e:
            print(f"Veritabanı başlatma hatası: {str(e)}")
    
    async def search_laws(self, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Kanunlar içinde arama yapar.
        
        Args:
            query: Arama sorgusu
            category: Kanun kategorisi (isteğe bağlı)
            
        Returns:
            Bulunan kanunların listesi
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Sorgu parametrelerini hazırla
            search_query = f"%{query}%"
            
            if category:
                cursor.execute('''
                SELECT id, law_no, name, category, content, publication_date, last_updated
                FROM laws
                WHERE (content LIKE ? OR name LIKE ?) AND category = ?
                LIMIT 20
                ''', (search_query, search_query, category))
            else:
                cursor.execute('''
                SELECT id, law_no, name, category, content, publication_date, last_updated
                FROM laws
                WHERE content LIKE ? OR name LIKE ?
                LIMIT 20
                ''', (search_query, search_query))
            
            rows = cursor.fetchall()
            conn.close()
            
            # Sonuçları sözlük listesine dönüştür
            results = []
            for row in rows:
                results.append({
                    "id": row[0],
                    "law_no": row[1],
                    "name": row[2],
                    "category": row[3],
                    "content": row[4][:500] + "..." if len(row[4]) > 500 else row[4],  # İçeriği kısalt
                    "publication_date": row[5],
                    "last_updated": row[6]
                })
            
            return results
            
        except Exception as e:
            print(f"Kanun arama hatası: {str(e)}")
            return []
    
    async def search_articles(self, law_id: int = None, query: str = None) -> List[Dict[str, Any]]:
        """
        Kanun maddelerinde arama yapar.
        
        Args:
            law_id: Kanun ID'si (isteğe bağlı)
            query: Arama sorgusu (isteğe bağlı)
            
        Returns:
            Bulunan maddelerin listesi
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if law_id and query:
                search_query = f"%{query}%"
                cursor.execute('''
                SELECT la.id, la.law_id, la.article_no, la.content, l.name, l.law_no
                FROM law_articles la
                JOIN laws l ON la.law_id = l.id
                WHERE la.law_id = ? AND la.content LIKE ?
                LIMIT 50
                ''', (law_id, search_query))
            elif law_id:
                cursor.execute('''
                SELECT la.id, la.law_id, la.article_no, la.content, l.name, l.law_no
                FROM law_articles la
                JOIN laws l ON la.law_id = l.id
                WHERE la.law_id = ?
                LIMIT 50
                ''', (law_id,))
            elif query:
                search_query = f"%{query}%"
                cursor.execute('''
                SELECT la.id, la.law_id, la.article_no, la.content, l.name, l.law_no
                FROM law_articles la
                JOIN laws l ON la.law_id = l.id
                WHERE la.content LIKE ?
                LIMIT 50
                ''', (search_query,))
            else:
                # Hem law_id hem de query yoksa boş liste döndür
                return []
            
            rows = cursor.fetchall()
            conn.close()
            
            # Sonuçları sözlük listesine dönüştür
            results = []
            for row in rows:
                results.append({
                    "id": row[0],
                    "law_id": row[1],
                    "article_no": row[2],
                    "content": row[3],
                    "law_name": row[4],
                    "law_no": row[5]
                })
            
            return results
            
        except Exception as e:
            print(f"Kanun maddesi arama hatası: {str(e)}")
            return []
    
    async def search_court_decisions(self, query: str, chamber: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Yargıtay kararlarında arama yapar.
        
        Args:
            query: Arama sorgusu
            chamber: Yargıtay dairesi (isteğe bağlı)
            
        Returns:
            Bulunan kararların listesi
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Sorgu parametrelerini hazırla
            search_query = f"%{query}%"
            
            if chamber:
                cursor.execute('''
                SELECT id, decision_no, decision_date, chamber, subject, content, keywords
                FROM court_decisions
                WHERE (content LIKE ? OR subject LIKE ? OR keywords LIKE ?) AND chamber = ?
                LIMIT 20
                ''', (search_query, search_query, search_query, chamber))
            else:
                cursor.execute('''
                SELECT id, decision_no, decision_date, chamber, subject, content, keywords
                FROM court_decisions
                WHERE content LIKE ? OR subject LIKE ? OR keywords LIKE ?
                LIMIT 20
                ''', (search_query, search_query, search_query))
            
            rows = cursor.fetchall()
            conn.close()
            
            # Sonuçları sözlük listesine dönüştür
            results = []
            for row in rows:
                results.append({
                    "id": row[0],
                    "decision_no": row[1],
                    "decision_date": row[2],
                    "chamber": row[3],
                    "subject": row[4],
                    "content": row[5][:500] + "..." if len(row[5]) > 500 else row[5],  # İçeriği kısalt
                    "keywords": row[6]
                })
            
            return results
            
        except Exception as e:
            print(f"Yargıtay kararı arama hatası: {str(e)}")
            return []
    
    async def get_relevant_laws_and_decisions(self, case_description: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Belirli bir vaka açıklaması için ilgili kanunları ve kararları bulur.
        
        Args:
            case_description: Vaka açıklaması
            category: Hukuki kategori (isteğe bağlı)
            
        Returns:
            İlgili kanunlar ve kararlar
        """
        try:
            # Anahtar kelimeleri çıkar
            keywords = self._extract_keywords(case_description)
            
            results = {
                "laws": [],
                "court_decisions": [],
                "keywords": keywords
            }
            
            # Her anahtar kelime için arama yap
            for keyword in keywords:
                # Kanunlarda ara
                laws = await self.search_laws(keyword, category)
                for law in laws:
                    if law not in results["laws"]:
                        results["laws"].append(law)
                
                # Yargıtay kararlarında ara
                decisions = await self.search_court_decisions(keyword)
                for decision in decisions:
                    if decision not in results["court_decisions"]:
                        results["court_decisions"].append(decision)
            
            # Sonuçları sınırla
            results["laws"] = results["laws"][:10]
            results["court_decisions"] = results["court_decisions"][:10]
            
            return results
            
        except Exception as e:
            print(f"İlgili kanun ve karar bulma hatası: {str(e)}")
            return {"laws": [], "court_decisions": [], "keywords": []}
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Metinden anahtar kelimeleri çıkarır.
        Basit bir implementasyon - gerçek uygulamada daha gelişmiş
        NLP teknikleri kullanılabilir.
        
        Args:
            text: Metin
            
        Returns:
            Anahtar kelimeler listesi
        """
        # Metni temizle
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        
        # Gereksiz kelimeleri kaldır (stopwords)
        stopwords = ["ve", "veya", "ile", "bir", "bu", "şu", "o", "ki", "da", "de", "mi", "mu", "mı"]
        words = [word for word in text.split() if word not in stopwords and len(word) > 3]
        
        # Tekrar eden kelimeleri kaldır ve en sık kullanılan kelimeleri seç
        word_freq = {}
        for word in words:
            if word in word_freq:
                word_freq[word] += 1
            else:
                word_freq[word] = 1
        
        # Frekansa göre sırala ve en yüksek 10 kelimeyi döndür
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        keywords = [word for word, freq in sorted_words[:10]]
        
        return keywords
    
    async def populate_sample_data(self):
        """
        Test için örnek veriler ekler.
        Gerçek uygulamada bu, bir API veya diğer bir veri kaynağından yapılır.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Örnek kanunlar
            sample_laws = [
                ("6098", "Türk Borçlar Kanunu", "Borçlar Hukuku", "Borçlar hukukuna ilişkin genel hükümler...", "2011-02-04", "2021-01-01"),
                ("4721", "Türk Medeni Kanunu", "Medeni Hukuk", "Kişiler hukuku, aile hukuku, miras hukuku...", "2001-12-08", "2021-01-01"),
                ("5237", "Türk Ceza Kanunu", "Ceza Hukuku", "Ceza hukukuna ilişkin genel hükümler...", "2004-10-12", "2021-01-01"),
                ("4857", "İş Kanunu", "İş Hukuku", "İş hukukuna ilişkin genel hükümler...", "2003-06-10", "2021-01-01"),
                ("6100", "Hukuk Muhakemeleri Kanunu", "Usul Hukuku", "Hukuk davalarında uygulanacak usul ve esaslar...", "2011-02-04", "2021-01-01"),
                ("6502", "Tüketicinin Korunması Hakkında Kanun", "Tüketici Hukuku", "Tüketici işlemleri ile tüketiciye yönelik uygulamalar hakkında düzenlemeler...", "2013-11-28", "2022-01-01"),
                ("6102", "Türk Ticaret Kanunu", "Ticaret Hukuku", "Ticari işletme, ticaret şirketleri, kıymetli evrak...", "2011-02-14", "2021-01-01"),
                ("2577", "İdari Yargılama Usulü Kanunu", "İdare Hukuku", "İdari yargı mercilerince idari davaların açılması ve çözümlenmesi...", "1982-01-06", "2021-01-01")
            ]
            
            cursor.executemany('''
            INSERT INTO laws (law_no, name, category, content, publication_date, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', sample_laws)
            
            # Kanun ID'lerini al
            cursor.execute("SELECT id, law_no FROM laws")
            law_ids = {row[1]: row[0] for row in cursor.fetchall()}
            
            # Örnek kanun maddeleri
            sample_articles = [
                # Borçlar Kanunu
                (law_ids["6098"], "1", "Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur."),
                (law_ids["6098"], "2", "Taraflar sözleşmenin esaslı noktalarında uyuşmuşlarsa, ikinci derecedeki noktalarda uyuşamama durumunda hâkim, bu noktaları sözleşmenin niteliğine göre karara bağlar."),
                (law_ids["6098"], "49", "Kusurlu ve hukuka aykırı bir fiille başkasına zarar veren, bu zararı gidermekle yükümlüdür. Zarar verici fiili yasaklayan bir hukuk kuralı bulunmasa bile, ahlaka aykırı bir fiille başkasına kasten zarar veren de, bu zararı gidermekle yükümlüdür."),
                (law_ids["6098"], "112", "Borç hiç veya gereği gibi ifa edilmezse borçlu, kendisine hiçbir kusurun yüklenemeyeceğini ispat etmedikçe, alacaklının bundan doğan zararını gidermekle yükümlüdür."),
                
                # Medeni Kanun
                (law_ids["4721"], "1", "Medeni haklardan yararlanma ehliyeti, tüm insanlar için eşittir."),
                (law_ids["4721"], "2", "Herkes medeni haklardan yararlanır ve bu hakları kullanmakta eşittir."),
                (law_ids["4721"], "166", "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir. Evlilik birliğinin temelinden sarsılmış sayılması için, ortak hayatın sürdürülmesi eşlerden beklenmemeli ve evliliğin devamında eşlerin yararı kalmamalıdır."),
                (law_ids["4721"], "167", "Boşanma davası açmaya hakkı olan eş, dilerse boşanma, dilerse ayrılık isteyebilir."),
                (law_ids["4721"], "168", "Boşanma veya ayrılık davası açılınca hâkim, davanın devamı süresince gerekli olan, özellikle eşlerin barınmasına, geçimine, eşlerin mallarının yönetimine ve çocukların bakım ve korunmasına ilişkin geçici önlemleri resen alır."),
                (law_ids["4721"], "169", "Boşanma veya ayrılık davası açılınca, mahkeme, dava süresince gerekli olan, özellikle eşlerin barınmasına, geçimine, eşlerin mallarının yönetimine ve çocukların bakım ve korunmasına ilişkin geçici önlemleri resen alır."),
                (law_ids["4721"], "170", "Boşanma sebebi ispatlanmış olursa, hâkim boşanmaya veya ayrılığa karar verir."),
                (law_ids["4721"], "171", "Boşanmanın fer'î sonuçlarına ilişkin anlaşmalar, hâkim tarafından onaylanmadıkça geçerli olmaz."),
                (law_ids["4721"], "172", "Boşanma davası reddedilen taraf, kusurunun belirlenmemiş olması durumunda da bir yıl geçmedikçe yeniden dava açamaz."),
                (law_ids["4721"], "173", "Boşanma yüzünden maddî veya manevî zarara uğrayan kusursuz veya daha az kusurlu taraf, kusurlu taraftan uygun bir maddî tazminat isteyebilir."),
                (law_ids["4721"], "174", "Mevcut veya beklenen menfaatleri boşanma yüzünden zedelenen kusursuz veya daha az kusurlu taraf, kusurlu taraftan uygun bir maddî tazminat isteyebilir. Boşanmaya sebep olan olaylar yüzünden kişilik hakkı saldırıya uğrayan taraf, kusurlu olan diğer taraftan manevî tazminat olarak uygun miktarda bir para ödenmesini isteyebilir."),
                (law_ids["4721"], "175", "Boşanma yüzünden yoksulluğa düşecek taraf, kusuru daha ağır olmamak koşuluyla geçimi için diğer taraftan malî gücü oranında süresiz olarak nafaka isteyebilir. Nafaka yükümlüsünün kusuru aranmaz."),
                (law_ids["4721"], "176", "Maddi tazminat ve yoksulluk nafakasının toptan veya durumun gereklerine göre irat biçiminde ödenmesine karar verilebilir. İrat biçiminde ödenmesine karar verilen maddî tazminat veya nafaka, alacaklı tarafın yeniden evlenmesi ya da taraflardan birinin ölümü hâlinde kendiliğinden kalkar; alacaklı tarafın evlenme olmaksızın fiilen evliymiş gibi yaşaması, yoksulluğunun ortadan kalkması ya da haysiyetsiz hayat sürmesi hâlinde mahkeme kararıyla kaldırılır."),
                
                # Ceza Kanunu
                (law_ids["5237"], "1", "Suç ve cezalar kanunla belirlenir."),
                (law_ids["5237"], "2", "Kanunun açıkça suç saymadığı bir fiil için kimseye ceza verilemez."),
                (law_ids["5237"], "21", "Suçun oluşması kastın varlığına bağlıdır. Kast, suçun kanuni tanımındaki unsurların bilerek ve istenerek gerçekleştirilmesidir."),
                (law_ids["5237"], "22", "Taksirle işlenen fiiller, kanunun açıkça belirttiği hallerde cezalandırılır. Taksir, dikkat ve özen yükümlülüğüne aykırılık dolayısıyla, bir davranışın suçun kanuni tanımında belirtilen neticesi öngörülmeyerek gerçekleştirilmesidir."),
                
                # İş Kanunu
                (law_ids["4857"], "8", "İş sözleşmesi, bir tarafın (işçi) bağımlı olarak iş görmeyi, diğer tarafın (işveren) da ücret ödemeyi üstlenmesinden oluşan sözleşmedir."),
                (law_ids["4857"], "17", "Belirsiz süreli iş sözleşmelerinin feshinden önce durumun diğer tarafa bildirilmesi gerekir."),
                (law_ids["4857"], "18", "Otuz veya daha fazla işçi çalıştıran işyerlerinde en az altı aylık kıdemi olan işçinin belirsiz süreli iş sözleşmesini fesheden işveren, işçinin yeterliliğinden veya davranışlarından ya da işletmenin, işyerinin veya işin gereklerinden kaynaklanan geçerli bir sebebe dayanmak zorundadır."),
                (law_ids["4857"], "24", "Süresi belirli olsun veya olmasın işçi, iş sözleşmesini sürenin bitiminden önce veya bildirim süresini beklemeksizin feshedebilir. İşçinin haklı nedenle derhal fesih hakkı sebepleri arasında, işveren işçinin veya ailesi üyelerinden birinin şeref ve namusuna dokunacak şekilde sözler söyler, davranışlarda bulunursa veya işçiye cinsel tacizde bulunursa sayılmaktadır."),
                (law_ids["4857"], "25", "İşveren, işçinin ahlak ve iyi niyet kurallarına uymayan davranışları nedeniyle iş sözleşmesini haklı nedenle feshedebilir."),
                
                # Hukuk Muhakemeleri Kanunu
                (law_ids["6100"], "114", "Dava şartları şunlardır: a) Türk mahkemelerinin yargı hakkının bulunması. b) Mahkemenin görevli olması. c) Yetkinin kesin olduğu hâllerde, mahkemenin yetkili bulunması..."),
                (law_ids["6100"], "115", "Dava şartlarının eksikliği mahkemece kendiliğinden dikkate alınır."),
                (law_ids["6100"], "200", "Bir hakkın doğumu, düşürülmesi, devri, değiştirilmesi, yenilenmesi, ertelenmesi, ikrarı ve itfası amacıyla yapılan hukuki işlemlerin, yapıldıkları zamanki miktar veya değerleri kanunla belirlenen parasal sınırı aşıyorsa senetle ispat olunması gerekir."),
                
                # Tüketici Kanunu
                (law_ids["6502"], "8", "Ayıplı mal, tüketiciye teslimi anında, taraflarca kararlaştırılmış olan örnek ya da modele uygun olmaması, objektif olarak sahip olması gereken özellikleri taşımaması, teknik düzenlemesinde tespit edilen niteliklere sahip olmaması veya satıcı tarafından bildirilen nitelikleri taşımaması durumlarından birinin varlığı hâlinde ayıplı kabul edilir."),
                (law_ids["6502"], "9", "Ayıplı maldan sorumluluk süresi malın tüketiciye teslim tarihinden itibaren iki yıldır."),
                (law_ids["6502"], "11", "Malın ayıplı olduğunun anlaşılması durumunda tüketici; a) Satılanı geri vermeye hazır olduğunu bildirerek sözleşmeden dönme, b) Satılanı alıkoyup ayıp oranında satış bedelinden indirim isteme, c) Aşırı bir masraf gerektirmediği takdirde, bütün masrafları satıcıya ait olmak üzere satılanın ücretsiz onarılmasını isteme, ç) İmkân varsa, satılanın ayıpsız bir misli ile değiştirilmesini isteme, seçimlik haklarından birini kullanabilir."),
                
                # Ticaret Kanunu
                (law_ids["6102"], "18", "Tacir, her türlü borcu için iflasa tabidir; ayrıca kanuna uygun bir ticaret unvanı seçmek, ticari işletmesini ticaret siciline tescil ettirmek ve bu Kanun hükümleri uyarınca gerekli ticari defterleri tutmakla da yükümlüdür."),
                (law_ids["6102"], "124", "Ticaret şirketleri; kolektif, komandit, anonim, limited ve kooperatif şirketlerden ibarettir."),
                (law_ids["6102"], "329", "Anonim şirket, sermayesi belirli ve paylara bölünmüş olan, borçlarından dolayı yalnız malvarlığıyla sorumlu bulunan şirkettir."),
                
                # İdari Yargılama Usulü Kanunu
                (law_ids["2577"], "7", "Dava açma süresi, özel kanunlarında ayrı süre gösterilmeyen hallerde Danıştayda ve idare mahkemelerinde altmış ve vergi mahkemelerinde otuz gündür."),
                (law_ids["2577"], "10", "İlgililer, haklarında idari davaya konu olabilecek bir işlem veya eylemin yapılması için idari makamlara başvurabilirler.")
            ]
            
            cursor.executemany('''
            INSERT INTO law_articles (law_id, article_no, content)
            VALUES (?, ?, ?)
            ''', sample_articles)
            
            # Örnek Yargıtay kararları
            sample_decisions = [
                # İş Hukuku Kararları
                ("2019/1234", "2019-06-15", "Yargıtay 9. Hukuk Dairesi", "İş akdinin feshi", "İşçinin işyerinde kavga etmesi haklı fesih sebebidir. İşveren, iş akdini İş Kanunu'nun 25/II-d maddesi uyarınca feshetmiştir. İşçi, işyerinde amiriyle tartışmış ve fiziksel olarak saldırmıştır. Bu durum haklı fesih sebebi olarak kabul edilmiştir.", "işten çıkarma, haklı fesih, kavga"),
                ("2020/8765", "2020-09-22", "Yargıtay 9. Hukuk Dairesi", "Kıdem tazminatı", "İşçinin emeklilik nedeniyle iş akdini feshetmesi halinde kıdem tazminatına hak kazanır. Dosya kapsamındaki bilgi ve belgelere göre, davacı işçi emeklilik nedeniyle iş akdini feshetmiş olup, 4857 sayılı İş Kanunu'nun 120. maddesi uyarınca yürürlüğü devam eden 1475 sayılı İş Kanunu'nun 14. maddesi gereğince kıdem tazminatına hak kazandığı anlaşılmıştır.", "kıdem tazminatı, emeklilik, fesih"),
                ("2021/3456", "2021-03-14", "Yargıtay 22. Hukuk Dairesi", "Mobbing", "İşyerinde psikolojik taciz (mobbing), işçinin kişilik haklarına saldırı niteliğindedir. Dosya kapsamında tanık beyanları ve diğer deliller değerlendirildiğinde, davacı işçinin mobbing mağduru olduğu, bu nedenle iş akdini haklı nedenle feshettiği anlaşılmıştır. 4857 sayılı İş Kanunu'nun 24/II-b maddesi uyarınca, davacının kıdem tazminatına hak kazandığına hükmedilmiştir.", "mobbing, psikolojik taciz, haklı fesih"),
                
                # Aile Hukuku Kararları
                ("2018/9876", "2018-11-10", "Yargıtay 2. Hukuk Dairesi", "Boşanma - Evlilik birliğinin sarsılması", "Taraflar arasındaki evlilik birliğinin temelinden sarsılmış olduğu anlaşılmaktadır. Tanık beyanları, ortak yaşamın sürdürülemeyeceğini göstermektedir. Türk Medeni Kanunu'nun 166/1. maddesi uyarınca boşanmaya karar verilmesi gerekir.", "boşanma, evlilik birliğinin sarsılması, TMK 166"),
                ("2019/8765", "2019-05-25", "Yargıtay 2. Hukuk Dairesi", "Velayet", "Çocuğun üstün yararı ilkesi gereğince, velayet düzenlemesi yapılırken çocuğun sağlıklı gelişimi, eğitimi ve duygusal bağları dikkate alınmalıdır. Dosya kapsamındaki bilgi ve belgelere göre, 8 yaşındaki çocuğun velayetinin anneye verilmesi, çocuğun üstün yararına uygun düşmektedir.", "velayet, çocuğun üstün yararı, boşanma"),
                ("2020/4321", "2020-06-18", "Yargıtay 2. Hukuk Dairesi", "Yoksulluk nafakası", "Boşanma yüzünden yoksulluğa düşecek tarafın, kusuru daha ağır olmamak şartıyla, geçimi için diğer taraftan mali gücü oranında süresiz olarak nafaka talep etme hakkı vardır. Somut olayda, davacının boşanma sonucu yoksulluğa düşeceği, davalıya göre daha az kusurlu olduğu anlaşıldığından, TMK 175. maddesi uyarınca yoksulluk nafakasına hükmedilmiştir.", "yoksulluk nafakası, TMK 175, boşanma"),
                ("2021/7654", "2021-09-28", "Yargıtay 2. Hukuk Dairesi", "Maddi ve manevi tazminat", "Boşanma davalarında, boşanmaya sebep olan olaylarda daha az kusurlu olan taraf, kusurlu olan diğer taraftan TMK 174. maddesi uyarınca maddi ve manevi tazminat talep edebilir. Somut olayda, davalının ağır kusurlu olduğu, davacının kişilik haklarına saldırı niteliğindeki davranışlarda bulunduğu anlaşıldığından, davacı lehine maddi ve manevi tazminata hükmedilmesi gerekir.", "boşanma, maddi tazminat, manevi tazminat, TMK 174"),
                
                # Borçlar Hukuku Kararları
                ("2020/5678", "2020-03-22", "Yargıtay 4. Hukuk Dairesi", "Tazminat davası", "Trafik kazasında meydana gelen zararın tazmini talep edilmiştir. TBK 49. madde uyarınca, kusurlu ve hukuka aykırı bir fiil ile başkasına zarar veren, bu zararı gidermekle yükümlüdür. Dosyadaki deliller ışığında, davalının kusurlu olduğu tespit edilmiş olup, davacının maddi ve manevi zararlarını tazmin etmesi gerektiğine karar verilmiştir.", "tazminat, trafik kazası, TBK 49"),
                ("2019/2345", "2019-09-12", "Yargıtay 13. Hukuk Dairesi", "Ayıplı mal", "Satın alınan üründe ayıp tespit edilmiştir. TBK 219. madde uyarınca, satıcı, satılanın ayıplarından sorumludur. Davacı, ayıp ihbarını yasal süre içinde yapmış olup, satın aldığı ürünün ücretsiz onarımını talep etme hakkına sahiptir.", "ayıplı mal, tüketici hukuku, TBK 219"),
                
                # Ticaret Hukuku Kararları
                ("2018/9012", "2018-11-05", "Yargıtay 11. Hukuk Dairesi", "Ticari marka ihlali", "Davacıya ait tescilli markanın, davalı tarafından izinsiz kullanılması, marka hakkına tecavüz oluşturur. 6769 sayılı Sınai Mülkiyet Kanunu'nun 29. maddesi uyarınca, marka hakkına tecavüz eden kişiye karşı dava açılabilir.", "marka ihlali, ticari marka, tecavüz"),
                
                # Ceza Hukuku Kararları
                ("2021/3456", "2021-01-30", "Yargıtay 2. Ceza Dairesi", "Hırsızlık suçu", "Hırsızlık suçunda nitelikli hal değerlendirmesi yapılmıştır. TCK 142. maddesi uyarınca, hırsızlık suçunun gece vakti işlenmesi nitelikli hal olarak kabul edilmiştir. Sanığın, mağdurun evine gece vakti girerek hırsızlık yapması nedeniyle, TCK 142/1-b maddesi uyarınca cezalandırılması gerekmektedir.", "hırsızlık, nitelikli hal, TCK 142"),
                
                # İdare Hukuku Kararları
                ("2020/7890", "2020-09-10", "Yargıtay 12. Hukuk Dairesi", "İcra takibi", "İcra takibinde zamanaşımı itirazı değerlendirilmiştir. İİK 168. madde uyarınca, borçlunun zamanaşımı itirazı incelenmiş ve alacağın zamanaşımına uğradığı tespit edilmiştir.", "icra takibi, zamanaşımı, İİK 168")
            ]
            
            cursor.executemany('''
            INSERT INTO court_decisions (decision_no, decision_date, chamber, subject, content, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', sample_decisions)
            
            conn.commit()
            conn.close()
            
            print("Örnek veriler başarıyla eklendi.")
            
        except Exception as e:
            print(f"Örnek veri ekleme hatası: {str(e)}") 

    async def reset_database(self) -> bool:
        """
        Veritabanını sıfırlar ve tabloları yeniden oluşturur.
        Dikkat: Bu işlem tüm verileri siler.
        
        Returns:
            İşlemin başarılı olup olmadığı
        """
        try:
            conn = self.connect_db()
            cursor = conn.cursor()
            
            # Tabloları sil
            cursor.execute("DROP TABLE IF EXISTS law_articles")
            cursor.execute("DROP TABLE IF EXISTS court_decisions")
            cursor.execute("DROP TABLE IF EXISTS laws")
            
            # Tabloları yeniden oluştur
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS laws (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                law_no TEXT,
                name TEXT NOT NULL,
                category TEXT,
                content TEXT,
                publication_date TEXT,
                last_updated TEXT
            )
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS law_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                law_id INTEGER NOT NULL,
                article_no TEXT,
                content TEXT,
                FOREIGN KEY (law_id) REFERENCES laws (id) ON DELETE CASCADE
            )
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS court_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                decision_no TEXT,
                decision_date TEXT,
                chamber TEXT,
                subject TEXT,
                content TEXT,
                keywords TEXT
            )
            """)
            
            conn.commit()
            conn.close()
            
            print("Veritabanı başarıyla sıfırlandı.")
            return True
            
        except Exception as e:
            print(f"Veritabanı sıfırlama hatası: {str(e)}")
            return False 

    def connect_db(self) -> sqlite3.Connection:
        """Veritabanı bağlantısı oluşturur."""
        return sqlite3.connect(self.db_path) 