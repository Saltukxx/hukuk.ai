# app/services/pdf_processor.py
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from pypdf import PdfReader
import io
import logging
import re

class DocumentType(Enum):
    """Types of legal documents"""
    DILEKCE = "dilekçe"
    KARAR = "karar"
    SOZLESME = "sözleşme"
    IHTARNAME = "ihtarname"
    RAPOR = "rapor"
    BILIRKISI = "bilirkişi raporu"
    TEMYIZ = "temyiz dilekçesi"
    CEVAP = "cevap dilekçesi"
    DAVA = "dava dilekçesi"
    OTHER = "diğer"

@dataclass
class LegalParty:
    """Represents a legal party in the document"""
    name: str
    role: str
    vekil: Optional[str] = None
    address: Optional[str] = None
    tc_no: Optional[str] = None

@dataclass
class LegalReference:
    """Represents a legal reference"""
    type: str
    number: str
    description: str
    full_text: str

class PDFProcessor:
    """PDF processor for Turkish legal documents"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.turkish_chars = {
            'İ': 'İ', 'I': 'I', 'ı': 'ı', 'i': 'i',
            'Ğ': 'Ğ', 'ğ': 'ğ',
            'Ü': 'Ü', 'ü': 'ü',
            'Ş': 'Ş', 'ş': 'ş',
            'Ö': 'Ö', 'ö': 'ö',
            'Ç': 'Ç', 'ç': 'ç'
        }

    async def extract_text(self, pdf_file: bytes) -> str:
        """Extract text from PDF with proper Turkish character handling"""
        try:
            pdf_stream = io.BytesIO(pdf_file)
            reader = PdfReader(pdf_stream)
            
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                page_text = self._fix_turkish_chars(page_text)
                text += page_text + "\n"
                
            return text.strip()
            
        except Exception as e:
            self.logger.error(f"PDF text extraction error: {str(e)}")
            raise

    def _fix_turkish_chars(self, text: str) -> str:
        """Fix common Turkish character encoding issues"""
        replacements = {
            '■': 'İ',
            'ý': 'ı',
            'þ': 'ş',
            'ð': 'ğ',
            'Ý': 'İ',
            'Þ': 'Ş',
            'Ð': 'Ğ',
            'ü': 'ü',
            'ö': 'ö',
            'ç': 'ç'
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
            
        return text

    def _clean_turkish_text(self, text: str) -> str:
        """Clean and normalize Turkish text"""
        text = self._fix_turkish_chars(text)
        
        special_cases = {
            'Istanbul': 'İstanbul',
            'sura': 'şura',
            'gundem': 'gündem',
            'TURKIYE': 'TÜRKİYE'
        }
        
        for eng, tr in special_cases.items():
            text = text.replace(eng, tr)
            
        return text

    def _identify_document_type(self, text: str) -> DocumentType:
        """Identify type of legal document"""
        patterns = {
            DocumentType.DILEKCE: r'DİLEKÇE|HAKİMLİĞİNE|SAYIN',
            DocumentType.KARAR: r'KARAR|GEREKÇE|HÜKÜM',
            DocumentType.SOZLESME: r'SÖZLEŞME|TARAFLAR|YÜKÜMLÜLÜKLER',
            DocumentType.IHTARNAME: r'İHTARNAME|TEBLİĞ|MUHATAP',
            DocumentType.RAPOR: r'RAPOR|TESPİT|SONUÇ',
            DocumentType.BILIRKISI: r'BİLİRKİŞİ|UZMAN|İNCELEME',
            DocumentType.TEMYIZ: r'TEMYİZ|YARGITAY|BOZMA',
            DocumentType.CEVAP: r'CEVAP|YANIT|İTİRAZ',
            DocumentType.DAVA: r'DAVA|MÜDDEİ|TALEP'
        }
        
        for doc_type, pattern in patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                return doc_type
        return DocumentType.OTHER

    def _extract_court_info(self, text: str) -> Dict[str, str]:
        """Extract court information"""
        court_info = {
            "mahkeme_adi": "",
            "esas_no": "",
            "karar_no": "",
            "hakim": "",
            "dosya_no": ""
        }
        
        patterns = {
            "mahkeme_adi": r'(?:SAYIN\s+)?([^0-9\n]+(?:MAHKEMESİ|HUKUK|CEZA|TİCARET)[^\n]*)',
            "esas_no": r'ESAS\s*NO\s*:?\s*(\d+/\d+)',
            "karar_no": r'KARAR\s*NO\s*:?\s*(\d+/\d+)',
            "hakim": r'HAKİM\s*:?\s*([^\n]+)',
            "dosya_no": r'DOSYA\s*NO\s*:?\s*([^\n]+)'
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                court_info[key] = match.group(1).strip()
                
        return court_info

    def _extract_parties(self, text: str) -> List[LegalParty]:
        """Extract legal parties"""
        parties = []
        party_patterns = {
            "davacı": r'DAVACI\s*:?\s*([^\n]+)',
            "davalı": r'DAVALI\s*:?\s*([^\n]+)',
            "müşteki": r'MÜŞTEKİ\s*:?\s*([^\n]+)',
            "sanık": r'SANIK\s*:?\s*([^\n]+)'
        }
        
        for role, pattern in party_patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                name = match.group(1).strip()
                parties.append(LegalParty(name=name, role=role))
                
        return parties

    def _extract_references(self, text: str) -> List[LegalReference]:
        """Extract legal references"""
        references = []
        ref_patterns = [
            (r'(\d+)\s*sayılı\s*([^,\n]+)', 'kanun'),
            (r'madde\s*(\d+)', 'madde'),
            (r'(\d+/\d+)\s*esas', 'içtihat')
        ]
        
        for pattern, ref_type in ref_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                number = match.group(1)
                description = match.group(0)
                references.append(LegalReference(
                    type=ref_type,
                    number=number,
                    description=description,
                    full_text=match.group(0)
                ))
                
        return references

    def _generate_summary(self, text: str) -> Dict[str, Any]:
        """Generate document summary"""
        return {
            "özet": self._extract_summary(text),
            "anahtar_noktalar": self._extract_key_points(text),
            "önemli_tarihler": self._extract_dates(text)
        }

    def _extract_summary(self, text: str) -> str:
        """Extract summary from text"""
        # Get first paragraph after common headers
        summary_patterns = [
            r'AÇIKLAMALAR\s*:([^\n]+)',
            r'GEREKÇE\s*:([^\n]+)',
            r'KONU\s*:([^\n]+)'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        # Fallback to first paragraph
        paragraphs = text.split('\n\n')
        return paragraphs[0] if paragraphs else ""

    def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points"""
        key_points = []
        patterns = [
            r'(?:TALEP|İSTEM)\s*:([^\n]+)',
            r'(?:SONUÇ|HÜKÜM)\s*:([^\n]+)',
            r'(?:KARAR|GEREKÇE)\s*:([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                key_points.append(match.group(1).strip())
                
        return key_points

    def _extract_dates(self, text: str) -> List[Dict[str, str]]:
        """Extract dates with context"""
        dates = []
        date_pattern = r'(\d{2}[./]\d{2}[./]\d{4})'
        
        for match in re.finditer(date_pattern, text):
            date_str = match.group(1)
            context = text[max(0, match.start()-30):min(len(text), match.end()+30)]
            dates.append({
                "tarih": date_str,
                "bağlam": context.strip()
            })
            
        return dates

    def _analyze_risks(self, text: str) -> List[Dict[str, str]]:
        """Analyze legal risks"""
        risks = []
        risk_patterns = {
            "süre_aşımı": ("yüksek", r'süre\s*aşımı|zamanaşımı'),
            "yetki": ("orta", r'yetki\s*itirazı|yetkisizlik'),
            "delil": ("yüksek", r'delil\s*yetersiz|ispat\s*edilememiş')
        }
        
        for risk_type, (severity, pattern) in risk_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                risks.append({
                    "tür": risk_type,
                    "önem": severity
                })
                
        return risks

    def _validate_document(self, text: str) -> Dict[str, List[str]]:
        """Validate document structure and content"""
        validation = {
            "eksik_bilgiler": [],
            "format_hataları": [],
            "öneriler": []
        }
        
        required = {
            "mahkeme_bilgisi": r'MAHKEMESİ',
            "taraflar": r'DAVACI|DAVALI',
            "tarih": r'\d{2}[./]\d{2}[./]\d{4}'
        }
        
        for element, pattern in required.items():
            if not re.search(pattern, text, re.IGNORECASE):
                validation["eksik_bilgiler"].append(element)
        
        return validation

    async def process_document(self, pdf_file: bytes) -> Dict[str, Any]:
        """Process the entire document"""
        try:
            text = await self.extract_text(pdf_file)
            
            return {
                "document_type": self._identify_document_type(text),
                "metadata": {
                    "processed_at": datetime.now().isoformat(),
                    "word_count": len(text.split()),
                    "confidence_score": self._calculate_confidence_score(text)
                },
                "structure": {
                    "court_info": self._extract_court_info(text),
                    "parties": self._extract_parties(text),
                    "references": self._extract_references(text)
                },
                "analysis": {
                    "summary": self._generate_summary(text),
                    "risks": self._analyze_risks(text)
                },
                "validation": self._validate_document(text)
            }
            
        except Exception as e:
            self.logger.error(f"Document processing error: {str(e)}")
            raise

    def _calculate_confidence_score(self, text: str) -> float:
        """Calculate confidence score for processing quality"""
        score = 1.0
        
        # Check text quality
        if len(text.split()) < 50:
            score -= 0.3
            
        # Check for required elements
        required_patterns = [
            r'MAHKEMESİ',
            r'DAVACI|DAVALI',
            r'\d{2}[./]\d{2}[./]\d{4}'
        ]
        
        for pattern in required_patterns:
            if not re.search(pattern, text, re.IGNORECASE):
                score -= 0.2
                
        return max(0.0, min(1.0, score))