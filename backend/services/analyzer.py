import json
import os
import re
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")



def _safe_json_parse(text: str) -> dict:
    """
    Cleans Gemini output and extracts JSON safely.
    """
    text = text.strip()

    # Remove markdown code fences
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text).strip()

    # Extract JSON object if model adds commentary
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)

    return json.loads(text)


def mock_analysis(text: str) -> dict:
    word_count = len(text.split())
    print("=== USING MOCK ANALYSIS ===")

    return {
        "overall_score": 74,
        "sentiment": "Neutral",
        "content_type": "Educational",
        "word_count": word_count,
        "readability": "Moderate",
        "strengths": [
            "Clear topic focus",
            "Understandable structure",
            "Good base message for improvement"
        ],
        "improvements": [
            {
                "priority": "High",
                "suggestion": "Add a stronger opening hook in the first line",
                "reason": "A stronger hook improves scroll-stop rate and initial engagement"
            },
            {
                "priority": "Medium",
                "suggestion": "Include 3-5 niche-relevant hashtags",
                "reason": "Hashtags improve discoverability on most platforms"
            },
            {
                "priority": "Low",
                "suggestion": "Add a question-based CTA",
                "reason": "Questions encourage comments and interaction"
            }
        ],
        "suggested_hashtags": [
            "#ContentStrategy",
            "#SocialMedia",
            "#CreatorTips",
            "#Growth",
            "#Marketing"
        ],
        "best_platforms": ["LinkedIn", "Instagram"],
        "optimal_post_time": "Tue-Thu, 9-11 AM",
        "rewritten_hook": "Want more engagement on your posts? Start with this one simple change.",
        "cta_suggestion": "What would you improve in this post? Share your take below."
    }

def prompt_builder(text: str) -> str:
    return f"""
You are a professional social media growth strategist.

Analyze the following content and return STRICTLY valid JSON.
Do not include markdown or explanations.

Content:
{text}

Return JSON in exactly this format:
{{
  "overall_score": int (0-100),
  "sentiment": string,
  "content_type": string,
  "word_count": int,
  "readability": string,
  "strengths": [string, string, string],
  "improvements": [
    {{"priority":"High","suggestion":"...","reason":"..."}},
    {{"priority":"Medium","suggestion":"...","reason":"..."}},
    {{"priority":"Low","suggestion":"...","reason":"..."}}
  ],
  "suggested_hashtags": [string, string, string, string, string],
  "best_platforms": [string, string],
  "optimal_post_time": string,
  "rewritten_hook": string,
  "cta_suggestion": string
}}
"""


def analyze_with_gemini(text: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return mock_analysis(text)

    print("=== USING REAL GEMINI (NEW SDK) ===")

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_builder(text)
        )

        print("RAW GEMINI RESPONSE:")
        print(response.text)

        return _safe_json_parse(response.text)

    except Exception as e:
        print("GEMINI ERROR:", e)
        print("Falling back to mock.")
        return mock_analysis(text)
