from google import genai
import os
from dotenv import load_dotenv

# Load the variables from the .env file
load_dotenv()

# Initialize the new client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def generate_explanation(data, goal):
    prompt = f"""
    You are a financial AI advisor.

    Portfolio Data:
    {data}

    Goal: {goal}

    Explain risk, forecast and strategy in 4 concise insights.
    """

    # Use the new client generation method
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt
    )

    # Clean up the output into an array of strings
    return [line.strip() for line in response.text.split("\n") if line.strip()]