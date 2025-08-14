import json
import os
import asyncio
import edge_tts

# Paths
CONVO_PATH = "data/conversation.json"
OUTPUT_DIR = os.path.join(os.getcwd(), "outputs")
VOICES_DIR = os.path.join(os.getcwd(), "voices")
FINAL_AUDIO_PATH = os.path.join(OUTPUT_DIR, "final_conversation.mp3")

# Voice Mapping
VOICE_MAP = {
    "Alice": "en-US-JennyNeural",
    "Bob": "en-US-GuyNeural"
}

# Load conversation JSON
def load_conversation():
    """
    Load the conversation JSON from the specified path.
    """

    with open(CONVO_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

# Convert text to speech asynchronously
async def text_to_speech(text, speaker, index):
    """
    Convert text to speech using edge_tts and save it to a file.
    """

    voice = VOICE_MAP.get(speaker, "en-US-JennyNeural")
    output_file = os.path.join(VOICES_DIR, f"{speaker.lower()}_{index}.mp3")
    try:
        tts = edge_tts.Communicate(text, voice)
        await tts.save(output_file)
    except Exception as e:
        print(f"Error generating speech for {speaker}: {e}")

# Generate all speech files
async def generate_speech(conversation):
    """
    Generate speech files for each line in the conversation.
    """

    os.makedirs(VOICES_DIR, exist_ok=True)
    tasks = []
    for index, line in enumerate(conversation, start=1):
        tasks.append(text_to_speech(line["text"], line["speaker"], index))
    await asyncio.gather(*tasks)
    print("Speech generation complete.")

# Merge MP3 files and delete chunks
def merge_audio(conversation):
    """
    Merge all generated MP3 files into a single audio file.
    """
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    combined_data = bytearray()
    pause_duration_ms = 800
    pause_bytes = int(128000 / 8 * pause_duration_ms / 1000) * b'\x00'

    for index, line in enumerate(conversation, start=1):
        speaker = line["speaker"]
        audio_path = os.path.join(VOICES_DIR, f"{speaker.lower()}_{index}.mp3")
        if not os.path.exists(audio_path):
            print(f"Missing: {audio_path}")
            continue
        with open(audio_path, 'rb') as f:
            combined_data.extend(f.read())
            combined_data.extend(pause_bytes)
        os.remove(audio_path)  # Delete the chunk file
        # print(f"Deleted: {audio_path}")

    with open(FINAL_AUDIO_PATH, 'wb') as output:
        output.write(combined_data)
    print(f"Final audio saved to: {FINAL_AUDIO_PATH}")

# Run full pipeline
async def run_pipeline():
    conversation = load_conversation()
    await generate_speech(conversation)
    merge_audio(conversation)

if __name__ == "__main__":
    asyncio.run(run_pipeline())