from services.extractor import extract_text_from_image

samples = ["sample.png", "sample2.png", "sample3.png"]

for name in samples:
    print(f"\n--- {name} ---")
    try:
        with open(name, "rb") as f:
            data = f.read()
        text = extract_text_from_image(data)
        print(repr(text))
    except Exception as e:
        print("Error:", e)
