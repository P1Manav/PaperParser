from groq import Groq
import sys
import json
import subprocess
import os
import re
from google.genai import types
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from gemini_config import client, PODCAST_PROMPT, GENERATE_PROMPT, wave_file, GENERATE_JSON_PROMPT

# Load environment variables
load_dotenv()

def process_pdf_stream(input_pdf_path):
    """
    Stream text from each page of the PDF file.
    Yields text from pages, skipping empty ones.
    """
    with open(input_pdf_path, "rb") as file:
        reader = PdfReader(file)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                yield text

def generate_audio(prompt, output_file):
    """
    Generate audio from the given text and save it to the specified output file.
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                    speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker='Joe',
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name='Kore',
                            )
                        )
                    ),
                    types.SpeakerVoiceConfig(
                        speaker='Jane',
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name='Puck',
                            )
                        )
                    ),
                    ]
                )
            )
        )
    )

    data = response.candidates[0].content.parts[0].inline_data.data
    file_name = output_file
    wave_file(file_name, data)

def generate_high_quality(content, output_audio_path):
    """ 
    Process the uploaded PDF file and generate a podcast conversation based on its content.
    """
    PODCAST_CONTENT = GENERATE_PROMPT + content
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=PODCAST_CONTENT,
    )
    generate_audio(PODCAST_PROMPT + response.text.strip(), output_audio_path)

def generate_low_quality(content):
    """ 
    Process the uploaded PDF file and generate a podcast conversation based on its content.
    """
    PODCAST_CONTENT = GENERATE_JSON_PROMPT + content
    print("Generating podcast conversation JSON...")
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=PODCAST_CONTENT,
    )

    def extract_json(text):
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group(0) if match else None
    
    response_text = response.candidates[0].content.parts[0].text.strip()
    response_json = extract_json(response_text)

    if response_json:
        conversation_json = json.loads(response_json)
    else:
        print("Error: Could not extract valid JSON from model response.")
        conversation_json = []

    print("Generated Podcast JSON Script")
    
    data_directory = "data"
    os.makedirs(data_directory, exist_ok=True)
    json_file_path = os.path.join(data_directory, "conversation.json")

    with open(json_file_path, "w") as json_file:
        json.dump(conversation_json, json_file, indent=4)

    voice_script_path = os.path.join(os.getcwd(), "scripts/voice.py")
    if os.path.exists(voice_script_path):
        print(f"Running voice.py script: {voice_script_path}")
        try:
            subprocess.run(["python", voice_script_path], check=True)
            print("voice.py executed successfully.")
            os.remove(json_file_path)  # Delete conversation.json
            print(f"Deleted: {json_file_path}")
        except subprocess.CalledProcessError as e:
            print(f"Error running voice.py: {e}")
    else:
        print(f"voice.py not found at {voice_script_path}, please check the path.")

# Main entry point to handle the command line arguments
if __name__ == "__main__":
    input_pdf_path = sys.argv[1]
    output_audio_path = sys.argv[2]
    audio_quality = sys.argv[3] if sys.argv[3] is not None else "low"

    content = " ".join(text for text in process_pdf_stream(input_pdf_path))
    if audio_quality == "high":
        generate_high_quality(content, output_audio_path)
    else:
        generate_low_quality(content)