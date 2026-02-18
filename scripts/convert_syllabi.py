import os
from docx import Document

def convert_txt_to_docx(txt_path, docx_path):
    doc = Document()
    with open(txt_path, 'r') as f:
        for line in f:
            doc.add_paragraph(line.strip())
    doc.save(docx_path)
    print(f"Converted {txt_path} to {docx_path}")

def main():
    base_dir = "backend/data/test_data/syllabi"
    files = [f for f in os.listdir(base_dir) if f.endswith('.txt')]
    
    for filename in files:
        txt_path = os.path.join(base_dir, filename)
        docx_path = os.path.join(base_dir, filename.replace('.txt', '.docx'))
        convert_txt_to_docx(txt_path, docx_path)

if __name__ == "__main__":
    main()
