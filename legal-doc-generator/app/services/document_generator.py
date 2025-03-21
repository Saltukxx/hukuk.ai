# app/services/document_generator.py
from typing import Dict, Any, Optional, List
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, Flowable, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
import io
import os

class LineBreak(Flowable):
    """Custom line break with thickness control"""
    def __init__(self, width, thickness=0.5):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness

    def draw(self):
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)

class DocumentGenerator:
    """Enhanced legal document generator with professional formatting"""
    
    def __init__(self):
        self._setup_fonts()
        self._setup_styles()
        self._setup_colors()
        
    def _setup_fonts(self):
        """Setup professional fonts with Turkish support"""
        try:
            # Primary font
            pdfmetrics.registerFont(TTFont('TimesNewRoman', 'C:/Windows/Fonts/times.ttf'))
            pdfmetrics.registerFont(TTFont('TimesNewRomanBold', 'C:/Windows/Fonts/timesbd.ttf'))
            pdfmetrics.registerFont(TTFont('TimesNewRomanItalic', 'C:/Windows/Fonts/timesi.ttf'))
            
            self.main_font = 'TimesNewRoman'
            self.bold_font = 'TimesNewRomanBold'
            self.italic_font = 'TimesNewRomanItalic'
        except:
            # Fallback fonts
            print("Warning: Times New Roman not found, using fallback font")
            self.main_font = 'Helvetica'
            self.bold_font = 'Helvetica-Bold'
            self.italic_font = 'Helvetica-Oblique'

    def _setup_colors(self):
        """Setup professional color scheme"""
        self.colors = {
            'header': colors.HexColor('#000000'),  # Pure black for headers
            'text': colors.HexColor('#1A1A1A'),    # Soft black for body text
            'accent': colors.HexColor('#2C3E50'),  # Professional blue for accents
            'line': colors.HexColor('#34495E')     # Darker blue for lines
        }

    def _setup_styles(self):
        """Setup enhanced document styles"""
        self.styles = getSampleStyleSheet()
        
        # Main Header (Court Information)
        self.styles.add(ParagraphStyle(
            name='CourtHeader',
            fontName=self.bold_font,
            fontSize=14,
            alignment=TA_CENTER,
            spaceAfter=20,
            leading=16,
            textColor=self.colors['header']
        ))
        
        # Section Headers
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontName=self.bold_font,
            fontSize=12,
            alignment=TA_LEFT,
            spaceAfter=12,
            spaceBefore=12,
            leading=14,
            textColor=self.colors['header']
        ))
        
        # Normal Text
        self.styles.add(ParagraphStyle(
            name='NormalText',
            fontName=self.main_font,
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
            leading=14,
            textColor=self.colors['text']
        ))
        
        # Party Information
        self.styles.add(ParagraphStyle(
            name='PartyInfo',
            fontName=self.main_font,
            fontSize=11,
            alignment=TA_LEFT,
            spaceAfter=3,
            leading=14,
            leftIndent=20,
            textColor=self.colors['text']
        ))
        
        # List Items
        self.styles.add(ParagraphStyle(
            name='ListItem',
            fontName=self.main_font,
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
            leading=14,
            leftIndent=20,
            bulletIndent=12,
            textColor=self.colors['text']
        ))
        
        # Signature Block
        self.styles.add(ParagraphStyle(
            name='Signature',
            fontName=self.main_font,
            fontSize=11,
            alignment=TA_RIGHT,
            spaceAfter=30,
            leading=14,
            textColor=self.colors['text']
        ))

    def generate_dilekce(self, template_data: Dict[str, Any]) -> bytes:
        """Generate an enhanced dilekçe with professional formatting"""
        buffer = io.BytesIO()
        
        # Create document with refined margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2.5*cm,
            leftMargin=2.5*cm,
            topMargin=2.5*cm,
            bottomMargin=2.5*cm,
            title=template_data.get('subject', 'Dilekçe'),
            author=template_data.get('plaintiff', {}).get('name', '')
        )
        
        story = []
        
        # Add letterhead if provided
        if template_data.get('letterhead'):
            story.append(Image(template_data['letterhead'], width=18*cm, height=2*cm))
            story.append(Spacer(1, 1*cm))
        
        # Court Header with enhanced formatting
        court_header = []
        court_header.append("T.C.")
        court_header.append(f"{template_data.get('city', '')} ")
        court_header.append(f"{template_data.get('court_type', '')} MAHKEMESİ")
        court_header.append("SAYIN HAKİMLİĞİNE")
        
        for line in court_header:
            story.append(Paragraph(line, self.styles['CourtHeader']))
        
        story.append(HRFlowable(
            width="100%",
            thickness=0.5,
            color=self.colors['line'],
            spaceBefore=10,
            spaceAfter=20
        ))
        
        # Party Information with enhanced layout
        for party_type, party_data in [
            ("DAVACI", template_data.get('plaintiff', {})),
            ("DAVALI", template_data.get('defendant', {}))
        ]:
            story.append(Paragraph(party_type, self.styles['SectionHeader']))
            party_info = self._format_party_info(party_data)
            for line in party_info:
                story.append(Paragraph(line, self.styles['PartyInfo']))
            story.append(Spacer(1, 0.5*cm))
        
        # Subject with visual separator
        story.append(HRFlowable(
            width="100%",
            thickness=0.3,
            color=self.colors['line'],
            spaceBefore=10,
            spaceAfter=10
        ))
        story.append(Paragraph(
            f"KONU: {template_data.get('subject', '')}",
            self.styles['SectionHeader']
        ))
        
        # Facts with enhanced formatting
        story.append(Paragraph("AÇIKLAMALAR:", self.styles['SectionHeader']))
        facts = template_data.get('facts', [])
        for i, fact in enumerate(facts, 1):
            story.append(Paragraph(
                f"{i}. {fact}",
                self.styles['ListItem']
            ))
        
        # Legal Grounds with professional numbering
        if template_data.get('legal_grounds'):
            story.append(Paragraph("HUKUKİ SEBEPLER:", self.styles['SectionHeader']))
            for ground in template_data['legal_grounds']:
                story.append(Paragraph(
                    f"• {ground}",
                    self.styles['ListItem']
                ))
        
        # Evidence with clear separation
        if template_data.get('evidence'):
            story.append(Paragraph("DELİLLER:", self.styles['SectionHeader']))
            evidence_table_data = [[f"• {item}"] for item in template_data['evidence']]
            evidence_table = Table(
                evidence_table_data,
                colWidths=[doc.width],
                style=TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), self.main_font),
                    ('FONTSIZE', (0, 0), (-1, -1), 11),
                    ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['text']),
                    ('LEFTPADDING', (0, 0), (-1, -1), 20),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ])
            )
            story.append(evidence_table)
        
        # Requests with enhanced visibility
        story.append(Paragraph("SONUÇ VE İSTEM:", self.styles['SectionHeader']))
        requests = template_data.get('requests', [])
        for request in requests:
            story.append(Paragraph(
                f"• {request}",
                self.styles['ListItem']
            ))
        
        # Professional signature block
        date = template_data.get('date', datetime.now().strftime("%d/%m/%Y"))
        signature_block = [
            Spacer(1, 1*cm),
            Paragraph(date, self.styles['Signature']),
            Spacer(1, 1*cm),
            Paragraph(
                f"Davacı<br/>{template_data.get('plaintiff', {}).get('name', '')}",
                self.styles['Signature']
            )
        ]
        story.extend(signature_block)
        
        # Build PDF with enhanced metadata
        doc.build(
            story,
            onFirstPage=self._add_page_number,
            onLaterPages=self._add_page_number
        )
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    def _add_page_number(self, canvas, doc):
        """Add professional page numbering"""
        page_num = canvas.getPageNumber()
        text = f"Sayfa {page_num}"
        canvas.saveState()
        canvas.setFont(self.main_font, 9)
        canvas.setFillColor(self.colors['text'])
        canvas.drawRightString(
            doc.pagesize[0] - doc.rightMargin,
            doc.bottomMargin/2,
            text
        )
        canvas.restoreState()

    def _format_party_info(self, party: Dict[str, Any]) -> List[str]:
        """Format party information with enhanced layout"""
        info = []
        
        if party.get('name'):
            info.append(f"<b>Adı Soyadı:</b> {party['name']}")
        
        if party.get('tc_no'):
            info.append(f"<b>T.C. Kimlik No:</b> {party['tc_no']}")
            
        if party.get('address'):
            info.append(f"<b>Adres:</b> {party['address']}")
            
        if party.get('vekil'):
            info.append(f"<b>Vekili:</b> {party['vekil']}")
            
        if party.get('email'):
            info.append(f"<b>E-posta:</b> {party['email']}")
            
        if party.get('phone'):
            info.append(f"<b>Telefon:</b> {party['phone']}")
            
        return info