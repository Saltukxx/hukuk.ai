from typing import Dict, List
import pdfplumber
import json
from pathlib import Path
from datetime import datetime
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

class PDFConverter:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )

    def extract_pdf_to_json(self, pdf_path: str) -> Dict:
        """
        Convert PDF to JSON format compatible with our chatbot architecture
        """
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Extract metadata
                metadata = {
                    "source": Path(pdf_path).name,
                    "total_pages": len(pdf.pages),
                    "created_at": datetime.now().isoformat(),
                }

                # Extract and process text
                full_text = ""
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    full_text += text + "\n"

                # Split text into chunks
                chunks = self.text_splitter.split_text(full_text)
                
                # Create document chunks
                documents = []
                for i, chunk in enumerate(chunks):
                    doc = {
                        "page_content": chunk,
                        "metadata": {
                            **metadata,
                            "chunk_id": i
                        }
                    }
                    documents.append(doc)

                # Final JSON structure
                json_output = {
                    "metadata": metadata,
                    "documents": documents
                }

                return json_output

        except Exception as e:
            print(f"Error processing PDF {pdf_path}: {str(e)}")
            return None

    def save_json(self, data: Dict, output_path: str) -> bool:
        """
        Save JSON data to file
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving JSON: {str(e)}")
            return False

    def load_json_to_documents(self, json_path: str) -> List[Document]:
        """
        Load JSON file back into LangChain Document format
        """
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            documents = []
            for doc in data['documents']:
                documents.append(
                    Document(
                        page_content=doc['page_content'],
                        metadata=doc['metadata']
                    )
                )
            return documents
        except Exception as e:
            print(f"Error loading JSON: {str(e)}")
            return []