# tests/utils/create_test_pdfs.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
import sys

def setup_font():
    """Setup a font that supports Turkish characters"""
    try:
        # Try to find Arial Unicode MS (Windows)
        if sys.platform == 'win32':
            font_path = "C:/Windows/Fonts/ARIALUNI.TTF"
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont('ArialUnicode', font_path))
                return 'ArialUnicode'
        
        # Try to find Ubuntu font (Linux)
        linux_font = "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"
        if os.path.exists(linux_font):
            pdfmetrics.registerFont(TTFont('Ubuntu', linux_font))
            return 'Ubuntu'
        
        # If no Unicode fonts found, warn and use default
        print("Warning: No suitable Unicode font found. Turkish characters may not display correctly.")
        return 'Helvetica'
    
    except Exception as e:
        print(f"Font registration error: {str(e)}")
        return 'Helvetica'

def create_test_pdfs():
    """Create sample PDFs for testing"""
    # Setup font
    font_name = setup_font()
    
    # Create test files directory
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_files_dir = os.path.join(current_dir, "test_files")
    os.makedirs(test_files_dir, exist_ok=True)
    
    # Create samples
    create_dilekce_sample(test_files_dir, font_name)
    create_karar_sample(test_files_dir, font_name)

def create_dilekce_sample(test_files_dir: str, font_name: str):
    """Create a sample dilekçe PDF with proper Turkish characters"""
    pdf_path = os.path.join(test_files_dir, "dilekce_sample.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    
    # Set font
    c.setFont(font_name, 12)
    
    # Add content with proper Turkish encoding
    content = [
        (100, 750, "İSTANBUL ASLİYE HUKUK MAHKEMESİ"),
        (100, 730, "SAYIN HAKİMLİĞİNE"),
        (100, 700, "DAVACI: Ahmet Yılmaz"),
        (100, 680, "T.C. Kimlik No: 12345678901"),
        (100, 650, "DAVALI: Mehmet Öz"),
        (100, 600, "KONU: Alacak Davası Hk."),
        (100, 550, "AÇIKLAMALAR:"),
        (100, 500, "1. Örnek açıklama metni"),
        (100, 450, "2. Türkiye Cumhuriyeti Kanunları"),
        (100, 400, "3. Borçlar Kanunu madde 112"),
        (100, 350, "Tarih: 01/03/2024")
    ]
    
    # Write content with UTF-8 encoding
    for x, y, text in content:
        try:
            # Ensure proper encoding
            text = text.encode('utf-8').decode('utf-8')
            c.drawString(x, y, text)
        except Exception as e:
            print(f"Error writing text '{text}': {str(e)}")
            # Fallback to ASCII
            c.drawString(x, y, text.encode('ascii', 'replace').decode())
    
    c.save()

def create_karar_sample(test_files_dir: str, font_name: str):
    """Create a sample mahkeme kararı PDF with proper Turkish characters"""
    pdf_path = os.path.join(test_files_dir, "karar_sample.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    
    # Set font
    c.setFont(font_name, 12)
    
    # Add content with proper Turkish encoding
    content = [
        (100, 750, "T.C."),
        (100, 730, "İSTANBUL"),
        (100, 710, "ASLİYE HUKUK MAHKEMESİ"),
        (100, 690, "ESAS NO: 2024/123"),
        (100, 670, "KARAR NO: 2024/456"),
        (100, 630, "GEREKÇE:"),
        (100, 610, "Davacının iddialarına göre..."),
        (100, 590, "HÜKÜM:"),
        (100, 570, "Yukarıda açıklanan nedenlerle..."),
        (100, 550, "Tarih: 01/03/2024")
    ]
    
    # Write content with UTF-8 encoding
    for x, y, text in content:
        try:
            # Ensure proper encoding
            text = text.encode('utf-8').decode('utf-8')
            c.drawString(x, y, text)
        except Exception as e:
            print(f"Error writing text '{text}': {str(e)}")
            # Fallback to ASCII
            c.drawString(x, y, text.encode('ascii', 'replace').decode())
    
    c.save()

if __name__ == "__main__":
    create_test_pdfs()