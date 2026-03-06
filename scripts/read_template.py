import docx
import os

def read_docx(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

template_path = r"D:\1下载\功能测试过程的设计与实现 论文章节撰写模板+对应撰写方法.docx"
text = read_docx(template_path)

with open('template_content.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print("Template extracted to template_content.txt")
