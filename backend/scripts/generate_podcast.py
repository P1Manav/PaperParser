import os
import sys
import asyncio
from pathlib import Path

current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from gemini_config import (
        extract_text_from_pdf,
        split_into_chunks,
        summarize_chunks,
        build_conversation_json,
        save_conversation_json,
        generate_low_quality_audio,
        generate_audio_high,
    )
except ImportError as e:
    print(f"Error importing gemini_config: {e}")
    print("Make sure gemini_config.py is in the same directory")
    sys.exit(1)

def main():
    if len(sys.argv) != 6:
        print("Usage: generate_podcast.py <pdf_path> <output_path> <AlexVoice> <AveryVoice> <quality>")
        print("Example: generate_podcast.py input.pdf output.mp3 sarah david high")
        sys.exit(1)

    pdf_path, output_path, Alex_voice, Avery_voice, quality = sys.argv[1:6]
    quality = quality.lower().strip()

    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)

    if quality not in ['low', 'high']:
        print("Error: <quality> must be 'low' or 'high'")
        sys.exit(1)

    try:
        print(f" Starting podcast generation...")
        print(f" PDF: {pdf_path}")
        print(f" Output: {output_path}")
        print(f" Voices: {Alex_voice}, {Avery_voice}")
        print(f" Quality: {quality}")

        # 1) Extract text from PDF
        print(" Extracting text from PDF...")
        paper_text = extract_text_from_pdf(pdf_path)
        if not paper_text.strip():
            print("Error: No text extracted from PDF")
            sys.exit(1)

        # 2) Split into chunks
        print(" Splitting text into chunks...")
        chunks = split_into_chunks(paper_text, max_chars=3000)

        # 3) Summarize with Gemini
        print(" Summarizing with Gemini...")
        summary = summarize_chunks(chunks)

        # 4) Build conversation JSON
        print(" Building conversation...")
        conversation = build_conversation_json(summary)

        # 5) Save conversation JSON
        base, ext = os.path.splitext(output_path)
        json_path = base + ".conversation.json"
        save_conversation_json(conversation, json_path)
        print(f" Conversation saved to: {json_path}")

        # 6) Generate audio
        print(f" Generating {quality} quality audio...")
        if quality == "low":
            # MP3 format
            asyncio.run(generate_low_quality_audio(conversation, Alex_voice, Avery_voice, output_path))
            print(f" Low quality MP3 created at: {output_path}")
        elif quality == "high":
            # WAV format
            if not output_path.lower().endswith(".wav"):
                print("[WARN] High quality expects .wav output. Writing WAV bytes to the provided path anyway.")
            asyncio.run(generate_audio_high(conversation, Alex_voice, Avery_voice, output_path))
            print(f" High quality WAV created at: {output_path}")

        print(" Podcast generation completed successfully!")

    except Exception as e:
        print(f" Error during podcast generation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
