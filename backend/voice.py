import json
import sys
import os
from gtts import gTTS
import pyttsx3

# This script expects two command-line arguments:
# 1. Path to the conversation JSON file
# 2. Path to the desired output MP3 file

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python voice.py <conversation_json_path> <output_mp3_path>")
        sys.exit(1)

    json_file_path = sys.argv[1]
    output_mp3_path = sys.argv[2]

    if not os.path.exists(json_file_path):
        print(f"Error: Conversation JSON file not found at {json_file_path}")
        sys.exit(1)

    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            conversation_json = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {json_file_path}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading {json_file_path}: {e}")
        sys.exit(1)

    full_text = ""
    for entry in conversation_json:
        speaker = entry.get("speaker", "Unknown")
        text = entry.get("text", "")
        full_text += f"{speaker}: {text}\n"

    if not full_text.strip():
        print("Warning: No text found in conversation JSON to convert to speech.")
        sys.exit(0)

    print(f"Converting text to speech and saving to {output_mp3_path}...")

    try:
        # Using gTTS for online text-to-speech (requires internet)
        tts = gTTS(text=full_text, lang='en', slow=False)
        tts.save(output_mp3_path)
        print(f"Successfully generated MP3 using gTTS: {output_mp3_path}")
    except Exception as e:
        print(f"Error with gTTS: {e}. Falling back to pyttsx3 (offline).")
        try:
            # Fallback to pyttsx3 for offline text-to-speech
            engine = pyttsx3.init()
            # You can set properties like voice, rate, volume here
            # voices = engine.getProperty('voices')
            # engine.setProperty('voice', voices[0].id) # Change index for different voices
            engine.save_to_file(full_text, output_mp3_path)
            engine.runAndWait()
            print(f"Successfully generated MP3 using pyttsx3: {output_mp3_path}")
        except Exception as e_pyttsx3:
            print(f"Error with pyttsx3: {e_pyttsx3}. Could not generate audio.")
            sys.exit(1)

    print("Audio generation complete.")
