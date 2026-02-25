# ContentPulse — Social Media Content Analyzer

ContentPulse is a production-deployed full-stack application that analyzes social media posts and generates structured engagement insights using Google Gemini.

The system supports PDF uploads, image uploads (via OCR), and raw text input. It extracts readable text, cleans system artifacts, and produces structured AI-driven feedback optimized for frontend rendering.

This project is designed with modular backend architecture, strict JSON enforcement, and cloud-ready deployment configuration.

---

## Live Deployment

**Frontend (Vercel)**
https://social-analyzer-six.vercel.app/

**Backend API (Railway)**
https://social-analyzer-production-fe82.up.railway.app

**API Documentation (Swagger UI)**
https://social-analyzer-production-fe82.up.railway.app/docs

---

## Core Features

### 1. Document Upload

- Drag-and-drop interface
- File picker support
- Supports:
  - PDF files
  - PNG / JPG / JPEG images
- Client-side loading indicators
- Backend validation for unsupported file types

---

### 2. Text Extraction Pipeline

#### PDF Parsing

- Implemented using `pdfplumber`
- Extracts structured text from uploaded PDF documents

#### OCR for Images

- Implemented using Tesseract OCR
- Extracts readable text from image uploads

#### Cleaning Layer

Post-processing removes:

- Duplicate lines
- Encoding artifacts
- Symbol-heavy fragments
- Terminal/system noise
- Broken OCR segments

This ensures clean, model-ready text before AI analysis.

---

### 3. AI-Powered Analysis (Google Gemini)

Extracted text is sent to Gemini with strict JSON output enforcement.

The system generates structured insights including:

- Engagement score
- Sentiment classification
- Content type detection
- Readability estimate
- Strengths
- Prioritized improvement suggestions
- Hashtag recommendations
- Platform recommendations
- Optimal posting time
- Rewritten hook
- Call-to-action suggestion

Strict schema enforcement guarantees:

- Reliable JSON parsing
- Stable frontend rendering
- No formatting inconsistencies

---

## Technical Architecture

### Backend — FastAPI (Railway Hosted)

**Stack**

- FastAPI
- Uvicorn
- pdfplumber
- Tesseract OCR
- Google Gemini API
- Nixpacks (for Tesseract installation)

**Architecture Layers**

1. Extraction Layer
2. Cleaning Layer
3. AI Analysis Layer
4. Response Formatting Layer

**Design Principles**

- Modular separation of concerns
- Temporary file handling with cleanup
- Environment variable configuration
- CORS-enabled for frontend integration
- Health check endpoint
- Production-safe cloud deployment setup

---

### Frontend — React (Vercel Hosted)

**Stack**

- React
- Axios
- React Dropzone

**Features**

- Drag-and-drop upload
- Loading states
- Error handling UI
- Structured results display
- Clean component separation

---

## API Endpoints

### POST `/analyze-text`

Analyzes raw text input.

**Request**

```json
{
  "text": "Your social media post here"
}
```

**Response**

```json
{
  "success": true,
  "extracted_text": "...",
  "analysis": {}
}
```

---

### POST `/analyze`

Uploads PDF or image for extraction and analysis.

**Returns**

- Cleaned extracted text
- Character count
- Full AI analysis object

---

### GET `/health`

Health check endpoint.

**Response**

```json
{
  "status": "healthy",
  "gemini_configured": true
}
```

---

## Deployment

### Backend (Railway)

- Hosted on Railway
- Entry command:
  ```
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- Tesseract installed via Nixpacks
- Required environment variable:
  ```
  GEMINI_API_KEY
  ```

---

### Frontend (Vercel)

- Hosted on Vercel
- Required environment variable:
  ```
  REACT_APP_API_URL=https://social-analyzer-production-fe82.up.railway.app
  ```

---

## Error Handling

- Unsupported file type rejection
- Empty file validation
- OCR failure handling
- AI parsing fallback mechanism
- Structured API error responses

---

## System Workflow

1. Accept content (PDF, image, or raw text)
2. Extract readable text (pdfplumber or OCR)
3. Clean extraction artifacts
4. Send structured prompt to Gemini
5. Enforce strict JSON schema
6. Render structured insights in frontend

---

## Design Decisions

- Separation of extraction, cleaning, and AI layers for clarity and extensibility
- Strict JSON enforcement to prevent frontend rendering failures
- Temporary file storage to avoid memory overload
- Model abstraction layer for future AI model replacement
- Cloud-friendly deployment configuration from project inception

---

## Future Improvements

- Multi-language support
- Batch upload support
- User accounts and analysis history
- Engagement benchmarking by platform
- A/B testing across AI models
- Analytics dashboard integration

---

## Summary

ContentPulse simulates a real-world content intelligence pipeline by combining document ingestion, OCR, structured cleaning, and AI-based engagement evaluation into a modular, production-ready system.

The project balances backend engineering discipline, applied AI integration, and cloud deployment best practices while maintaining clean frontend-backend contracts.
