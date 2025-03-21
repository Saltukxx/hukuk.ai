import PyPDF2
from fastapi import UploadFile
import logging
from typing import Optional
import io
import pytesseract
from PIL import Image
import pdf2image
from app.core.config import settings

logger = logging.getLogger(__name__)

class PDFExtractor:
    def __init__(self):
        # Configure Tesseract for Turkish language
        self.tesseract_config = r'--oem 3 --psm 6 -l tur'

    async def extract_text(self, file: UploadFile) -> str:
        """
        Extract text from a PDF file, handling both searchable and scanned PDFs.
        """
        try:
            # Read the uploaded file into memory
            content = await file.read()
            pdf_file = io.BytesIO(content)
            
            # Try regular PDF extraction first
            text = self._extract_searchable_pdf(pdf_file)
            
            # If no text found, treat as scanned PDF
            if not text.strip():
                logger.info("No text found in PDF, attempting OCR...")
                text = await self._process_scanned_pdf(pdf_file)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
        finally:
            await file.seek(0)  # Reset file pointer

    def _extract_searchable_pdf(self, pdf_file: io.BytesIO) -> str:
        """Extract text from a searchable PDF."""
        try:
            text = ""
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
            
        except Exception as e:
            logger.error(f"Error in searchable PDF extraction: {str(e)}")
            return ""

    async def _process_scanned_pdf(self, pdf_file: io.BytesIO) -> str:
        """Process scanned PDF using OCR."""
        try:
            text = ""
            # Convert PDF to images
            images = pdf2image.convert_from_bytes(pdf_file.getvalue())
            
            # Process each page
            for image in images:
                # Perform OCR
                page_text = pytesseract.image_to_string(
                    image, 
                    lang='tur',  # Turkish language
                    config=self.tesseract_config
                )
                text += page_text + "\n"
            
            return text
            
        except Exception as e:
            logger.error(f"Error in OCR processing: {str(e)}")
            raise