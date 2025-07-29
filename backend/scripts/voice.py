import json
import os
import asyncio
import edge_tts
from pydub import AudioSegment

# Paths
CONVO_PATH = r"backend\data\conversation.json"
# OUTPUT_DIR = r"backend\output"
OUTPUT_DIR = "outputs"
VOICES_DIR = r"backend\voices"
FINAL_AUDIO_PATH = os.path.join(OUTPUT_DIR, "final_conversation.mp3")

# Voice Mapping
VOICE_MAP = {
    "Alice": "en-US-JennyNeural",  # Female voice
    "Bob": "en-US-GuyNeural"       # Male voice
}

# Load conversation JSON
def load_conversation():
    with open(CONVO_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

# Convert text to speech asynchronously
async def text_to_speech(text, speaker, index):
    """Generate speech using edge-tts and save as a file."""
    voice = VOICE_MAP.get(speaker, "en-US-JennyNeural")  # Default to Jenny
    output_file = os.path.join(VOICES_DIR, f"{speaker.lower()}_{index}.mp3")

    try:
        print(f"Generating voice for {speaker}: {text}")
        tts = edge_tts.Communicate(text, voice)
        await tts.save(output_file)
        print(f"Saved: {output_file}")
    except Exception as e:
        print(f"Error generating speech for {speaker}: {e}")

# Generate all speech files
async def generate_speech(conversation):
    os.makedirs(VOICES_DIR, exist_ok=True)

    tasks = []
    for index, line in enumerate(conversation, start=1):
        speaker = line["speaker"]
        text = line["text"]
        tasks.append(text_to_speech(text, speaker, index))

    await asyncio.gather(*tasks)
    print("Speech generation complete.")

# Merge all audio files into a single MP3
def merge_audio(conversation):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    final_audio = AudioSegment.silent(duration=0)
    pause = AudioSegment.silent(duration=800)  # Pause between speakers

    for index, line in enumerate(conversation, start=1):
        speaker = line["speaker"]
        audio_file = os.path.join(VOICES_DIR, f"{speaker.lower()}_{index}.mp3")

        if os.path.exists(audio_file):
            audio_segment = AudioSegment.from_file(audio_file)
            final_audio += audio_segment + pause
        else:
            print(f"Warning: Missing audio file {audio_file}")

    final_audio.export(FINAL_AUDIO_PATH, format="mp3")
    print(f"Final conversation saved: {FINAL_AUDIO_PATH}")

# Run the full pipeline
async def run_pipeline():
    conversation = load_conversation()
    await generate_speech(conversation)
    merge_audio(conversation)

if __name__ == "__main__":
    asyncio.run(run_pipeline())