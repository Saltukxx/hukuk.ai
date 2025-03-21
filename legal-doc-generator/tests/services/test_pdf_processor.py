# tests/services/test_pdf_processor.py
import pytest
import os
from datetime import datetime
from app.services.pdf_processor import PDFProcessor, DocumentType, LegalParty, LegalReference

class TestPDFProcessor:
    @pytest.fixture
    def pdf_processor(self):
        return PDFProcessor()

    @pytest.fixture
    def sample_dilekce(self):
        """Load sample dilekçe PDF"""
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_path = os.path.join(current_dir, "test_files", "dilekce_sample.pdf")
        with open(pdf_path, "rb") as f:
            return f.read()

    @pytest.fixture
    def sample_karar(self):
        """Load sample mahkeme kararı PDF"""
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_path = os.path.join(current_dir, "test_files", "karar_sample.pdf")
        with open(pdf_path, "rb") as f:
            return f.read()

    @pytest.mark.asyncio
    async def test_text_extraction(self, pdf_processor, sample_dilekce):
        """Test basic text extraction and Turkish character handling"""
        text = await pdf_processor.extract_text(sample_dilekce)
        
        # Basic checks
        assert text is not None
        assert isinstance(text, str)
        assert len(text) > 0
        
        # Content checks
        assert "MAHKEMESİ" in text
        assert "SAYIN" in text

    @pytest.mark.asyncio
    async def test_document_type_identification(self, pdf_processor, sample_dilekce, sample_karar):
        """Test document type identification"""
        # Test dilekçe
        dilekce_text = await pdf_processor.extract_text(sample_dilekce)
        doc_type = pdf_processor._identify_document_type(dilekce_text)
        assert doc_type in [DocumentType.DILEKCE, DocumentType.OTHER]
        
        # Test karar
        karar_text = await pdf_processor.extract_text(sample_karar)
        doc_type = pdf_processor._identify_document_type(karar_text)
        assert doc_type in [DocumentType.KARAR, DocumentType.OTHER]

    @pytest.mark.asyncio
    async def test_court_info_extraction(self, pdf_processor, sample_karar):
        """Test court information extraction"""
        text = await pdf_processor.extract_text(sample_karar)
        court_info = pdf_processor._extract_court_info(text)
        
        assert court_info is not None
        assert isinstance(court_info, dict)
        assert "mahkeme_adi" in court_info
        assert "esas_no" in court_info
        assert "karar_no" in court_info

    @pytest.mark.asyncio
    async def test_party_extraction(self, pdf_processor, sample_dilekce):
        """Test party information extraction"""
        text = await pdf_processor.extract_text(sample_dilekce)
        parties = pdf_processor._extract_parties(text)
        
        assert parties is not None
        assert isinstance(parties, list)
        assert all(isinstance(party, LegalParty) for party in parties)
        
        if parties:
            party = parties[0]
            assert hasattr(party, 'name')
            assert hasattr(party, 'role')

    @pytest.mark.asyncio
    async def test_legal_references(self, pdf_processor, sample_karar):
        """Test legal reference extraction"""
        text = await pdf_processor.extract_text(sample_karar)
        references = pdf_processor._extract_references(text)
        
        assert references is not None
        assert isinstance(references, list)
        # Note: Not all documents will have references
        if references:
            ref = references[0]
            assert isinstance(ref, LegalReference)
            assert hasattr(ref, 'type')
            assert hasattr(ref, 'number')

    @pytest.mark.asyncio
    async def test_summary_generation(self, pdf_processor, sample_karar):
        """Test summary generation"""
        text = await pdf_processor.extract_text(sample_karar)
        summary = pdf_processor._generate_summary(text)
        
        assert summary is not None
        assert isinstance(summary, dict)
        assert "özet" in summary
        assert "anahtar_noktalar" in summary
        assert "önemli_tarihler" in summary

    @pytest.mark.asyncio
    async def test_risk_analysis(self, pdf_processor, sample_dilekce):
        """Test risk analysis"""
        text = await pdf_processor.extract_text(sample_dilekce)
        risks = pdf_processor._analyze_risks(text)
        
        assert risks is not None
        assert isinstance(risks, list)
        if risks:
            risk = risks[0]
            assert "tür" in risk
            assert "önem" in risk

    @pytest.mark.asyncio
    async def test_document_validation(self, pdf_processor, sample_dilekce):
        """Test document validation"""
        text = await pdf_processor.extract_text(sample_dilekce)
        validation = pdf_processor._validate_document(text)
        
        assert validation is not None
        assert isinstance(validation, dict)
        assert "eksik_bilgiler" in validation
        assert "format_hataları" in validation
        assert "öneriler" in validation

    @pytest.mark.asyncio
    async def test_invalid_pdf(self, pdf_processor):
        """Test handling of invalid PDF data"""
        invalid_pdf = b"This is not a PDF file"
        
        with pytest.raises(Exception):
            await pdf_processor.extract_text(invalid_pdf)
            
        with pytest.raises(Exception):
            await pdf_processor.process_document(invalid_pdf)

    @pytest.mark.asyncio
    async def test_complete_processing(self, pdf_processor, sample_dilekce):
        """Test complete document processing pipeline"""
        result = await pdf_processor.process_document(sample_dilekce)
        
        assert result is not None
        assert isinstance(result, dict)
        assert "document_type" in result
        assert "metadata" in result
        assert "structure" in result
        assert "analysis" in result
        assert "validation" in result
        
        # Check metadata
        assert "processed_at" in result["metadata"]
        assert "word_count" in result["metadata"]
        assert "confidence_score" in result["metadata"]
        
        # Check structure
        assert "court_info" in result["structure"]
        assert "parties" in result["structure"]
        assert "references" in result["structure"]

    def test_turkish_text_cleaning(self, pdf_processor):
        """Test Turkish text cleaning"""
        test_cases = [
            ("Istanbul", "İstanbul"),
            ("sura", "şura"),
            ("gundem", "gündem"),
            ("TURKIYE", "TÜRKİYE")
        ]
        
        for input_text, expected in test_cases:
            cleaned = pdf_processor._clean_turkish_text(input_text)
            assert cleaned == expected, f"Failed to clean '{input_text}'"