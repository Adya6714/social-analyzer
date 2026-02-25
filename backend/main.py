from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

import os

from services.extractor import extract_text_from_pdf, extract_text_from_image
from services.analyzer import analyze_with_gemini

# Load env vars from backend/.env
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="Social Media Content Analyzer API",
    version="1.0.0",
    description="Upload PDFs/images or paste text to get engagement improvement suggestions.",
)

# CORS (fine for demo/local; restrict later in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MIN_TEXT_LENGTH = 10
MAX_TEXT_LENGTH = 50_000


class TextAnalyzeRequest(BaseModel):
    text: str


@app.get("/")
async def root():
    return {"status": "ok", "message": "Social Media Content Analyzer API"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


import shutil
import uuid
from pathlib import Path

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        # Create unique file path
        file_extension = file.filename.split(".")[-1]
        temp_filename = f"{uuid.uuid4()}.{file_extension}"
        temp_path = UPLOAD_DIR / temp_filename

        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        if file_extension.lower() in ["png", "jpg", "jpeg"]:
            extracted_text = extract_text_from_image(str(temp_path))
            file_type = "image"
        elif file_extension.lower() == "pdf":
            extracted_text = extract_text_from_pdf(str(temp_path))
            file_type = "pdf"
        else:
            return {"error": "Unsupported file type"}

        # Run Gemini
        analysis = analyze_with_gemini(extracted_text)

        # Cleanup
        temp_path.unlink(missing_ok=True)

        return {
            "success": True,
            "filename": file.filename,
            "file_type": file_type,
            "extracted_text": extracted_text,
            "char_count": len(extracted_text),
            "analysis": analysis
        }

    except Exception as e:
        return {"detail": f"Text extraction failed: {str(e)}"}


@app.post("/analyze-text")
async def analyze_text(body: TextAnalyzeRequest):
    """
    Analyze raw pasted text directly.
    """
    text = body.text.strip()

    if len(text) < MIN_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text is too short to analyze (minimum {MIN_TEXT_LENGTH} characters).",
        )

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text is too long (maximum {MAX_TEXT_LENGTH} characters).",
        )

    try:
        analysis = analyze_with_gemini(text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )

    return JSONResponse(
        {
            "success": True,
            "extracted_text": text[:2000],
            "char_count": len(text),
            "analysis": analysis,
        }
    )
