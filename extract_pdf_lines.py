from pypdf import PdfReader
import sys

pdf_path = r'E:\Documents\Rahul Pal\Coding\Hackathon\SignBridge\docs\Indian-Sign-Language-230.pdf'
reader = PdfReader(pdf_path)

all_lines = []
for page in reader.pages:
    text = page.extract_text()
    if text:
        all_lines.extend(text.splitlines())

start_line = 2001
end_line = 3000

# Lines are 1-indexed in user request usually, or 0-indexed? 
# If start_line: 2001, end_line: 3000, we usually mean [2000:3000] in 0-indexing
output_lines = all_lines[start_line-1:end_line]

for line in output_lines:
    print(line)
