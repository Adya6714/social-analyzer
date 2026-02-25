import pytesseract
from PIL import Image
import pdfplumber
import re


# -------------------------------
# 1️⃣ RAW EXTRACTION FUNCTIONS
# -------------------------------

def extract_raw_text_from_image(file_path: str) -> str:
    image = Image.open(file_path)
    raw_text = pytesseract.image_to_string(image)
    return raw_text


def extract_raw_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


# -------------------------------
# 2️⃣ CLEANING FUNCTION
# -------------------------------

def clean_extracted_text(text: str) -> str:
    lines = text.split("\n")
    cleaned_lines = []
    seen = set()

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Skip lines mostly symbols
        if len(re.sub(r"[A-Za-z0-9 ]", "", line)) > len(line) * 0.6:
            continue

        # Remove terminal/system noise
        if any(keyword in line.lower() for keyword in [
            "tesseract", "desktop", "dpi", "estimating", "~/", "show"
        ]):
            continue

        # Remove duplicates
        if line in seen:
            continue

        seen.add(line)
        cleaned_lines.append(line)

    cleaned_text = "\n".join(cleaned_lines)

    # Normalize spacing
    cleaned_text = re.sub(r"\n{2,}", "\n", cleaned_text)

    return cleaned_text.strip()


# -------------------------------
# 3️⃣ MAIN EXTRACTION FUNCTIONS (USED BY API)
# -------------------------------

def extract_text_from_image(file_path: str) -> str:
    raw_text = extract_raw_text_from_image(file_path)
    cleaned_text = clean_extracted_text(raw_text)
    return cleaned_text


def extract_text_from_pdf(file_path: str) -> str:
    raw_text = extract_raw_text_from_pdf(file_path)
    cleaned_text = clean_extracted_text(raw_text)
    return cleaned_text
