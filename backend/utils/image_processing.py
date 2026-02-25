import cv2
import numpy as np


def decode_image(file_bytes: bytes):
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image file")
    return img


def build_ocr_variants(file_bytes: bytes):
    img = decode_image(file_bytes)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale to help OCR
    gray_up = cv2.resize(gray, None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC)

    variants = {}

    # Plain grayscale
    variants["gray_up"] = gray_up

    # Otsu threshold
    _, otsu = cv2.threshold(gray_up, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants["otsu"] = otsu

    # Adaptive threshold
    adaptive = cv2.adaptiveThreshold(
        gray_up,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )
    variants["adaptive"] = adaptive

    # Denoise + threshold
    denoised = cv2.medianBlur(gray_up, 3)
    _, denoise_otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants["denoise_otsu"] = denoise_otsu

    return variants
