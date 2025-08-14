"""
This file sets up the Gemini client and defines prompts for generating podcast conversations.
"""


from google import genai
from google.genai import types
import wave
import os
from dotenv import load_dotenv
load_dotenv()


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PODCAST_PROMPT = """TTS the following conversation between Alice and Bob with a normal pace, avoiding fast delivery:"""

GENERATE_PROMPT = """
    - Create a two-person podcast conversation discussing the key points of the research paper, with Alice as the host asking questions to guide the discussion and Bob providing detailed answers based solely on the given paper. 
    - Ensure the conversation flows naturally, covers all important aspects of the paper without adding external information, and remains engaging for a general audience. 
    - The total conversation must not exceed 32,000 tokens to comply with the TTS model's context window limit. 
    - Structure the output as a single continuous text string where each speaker's line includes a natural language instruction for the TTS style (e.g., "Say cheerfully:", "Say informatively:") followed by the speaker's name and their text, formatted as follows:
        Say [style]: [Speaker Name]: [Text]
        For example:
        Say cheerfully: Alice: Hello, welcome to our podcast!
        Say excitedly: Bob: Thanks! Today, we are discussing the research paper on AI advancements!
    - Use a balanced dialogue between Alice and Bob, ensuring they alternate speaking roles naturally.
    - Avoid repetitive phrasing and keep the output concise yet comprehensive.
    Use only styles that suit the sentence's tone and context (e.g., cheerfully for greetings, informatively for explanations, curiously for questions), avoiding unnecessary or mismatched styles. Do not include any JSON formatting, explanations, additional text, or unnecessary elements—only the styled conversation lines. Maintain a balanced dialogue between Alice and Bob, avoiding repetitive phrasing, and keep the output concise yet comprehensive within the 32k token limit.
    Instruction:
    Generate a two-person podcast-style conversation discussing the key points of the research paper, with styled speech instructions for TTS that suit each sentence.

    Content : \n
"""

GENERATE_JSON_PROMPT = """
- Create a two-person podcast conversation discussing the key points of the research paper, with Alice as the host asking guiding questions and Bob providing detailed answers strictly based on the paper's content.
- The dialogue must be informative, natural, and engaging for a general audience, covering all important aspects of the paper without adding any external information.
- Format the entire response strictly as a **valid JSON array** of objects, where each object has the following structure:

    {
        "speaker": "Alice" or "Bob",
        "text": "The actual dialogue line spoken by the speaker"
    }

- The output must alternate between Alice and Bob, forming a flowing conversation. Ensure a balanced contribution between speakers without overly long responses.
- Avoid repetitive phrases and do not exceed 32,000 tokens in total.
- Do not include any metadata, introductory or closing remarks, or commentary—only return a clean and valid JSON array as described.
- Do NOT wrap the response in markdown or explanations. No headings, no prose—just the raw JSON array as output.

Instruction:
Generate a structured JSON array representing a two-person podcast conversation (between Alice and Bob) discussing the paper content below.

Content:\n
"""


def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   """
   Save PCM audio data to a WAV file.
   """
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

__all__ = ["client", "PODCAST_PROMPT", "GENERATE_PROMPT", "wave_file", "GENERATE_JSON_PROMPT"]