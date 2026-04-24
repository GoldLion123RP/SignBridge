import sys
import io
from pypdf import PdfReader

# Set stdout to use utf-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_text_from_pdf(pdf_path, start_line, end_line):
    reader = PdfReader(pdf_path)
    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + "\n"
    
    lines = all_text.splitlines()
    target_lines = lines[start_line-1 : end_line]
    for line in target_lines:
        print(line)

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    start_line = int(sys.argv[2])
    end_line = int(sys.argv[3])
    extract_text_from_pdf(pdf_path, start_line, end_line)
