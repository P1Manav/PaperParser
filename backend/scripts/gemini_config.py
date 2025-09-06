import asyncio
import os
import wave
import tempfile
from typing import List
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Warning: edge_tts not available. Low-quality audio generation will not work.")
    edge_tts = None

try:
    from google import genai
    from google.genai import types
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini client: {e}")
        client = None
except ImportError:
    print("Warning: google-genai not available. High-quality audio generation will not work.")
    genai = None
    types = None
    client = None

# ---------- Voice mapping (Gemini label -> Edge TTS voice id) ----------
EDGE_TTS_VOICE_MAP = {
    "zephyr": "en-US-GuyNeural",
    "puck": "en-US-GuyNeural",
    "charon": "en-US-GuyNeural",
    "kore": "en-US-JennyNeural",
    "fenrir": "en-US-GuyNeural",
    "leda": "en-US-JennyNeural",
    "orus": "en-US-GuyNeural",
    "aoede": "en-US-JennyNeural",
    "callirrhoe": "en-US-JennyNeural",
    "autonoe": "en-US-JennyNeural",
    "enceladus": "en-US-JennyNeural",
    "iapetus": "en-US-GuyNeural",
    "umbriel": "en-US-GuyNeural",
    "algieba": "en-US-JennyNeural",
    "despina": "en-US-JennyNeural",
    "erinome": "en-US-JennyNeural",
    "algenib": "en-US-GuyNeural",
    "rasalgethi": "en-US-GuyNeural",
    "laomedeia": "en-US-JennyNeural",
    "achernar": "en-US-JennyNeural",
    "alnilam": "en-US-GuyNeural",
    "schedar": "en-US-GuyNeural",
    "gacrux": "en-US-GuyNeural",
    "pulcherrima": "en-US-JennyNeural",
    "achird": "en-US-JennyNeural",
    "zubenelgenubi": "en-US-JennyNeural",
    "vindemiatrix": "en-US-JennyNeural",
    "sadachbia": "en-US-JennyNeural",
    "sadaltager": "en-US-JennyNeural",
    "sulafat": "en-US-JennyNeural",
}

def normalize_voice_name(voice_label: str) -> str:
    """Take 'Puck -- Upbeat' -> 'Puck' or handle simple names like 'sarah'."""
    if not voice_label:
        return ""
    base_name = voice_label.split("--")[0].strip()
    return base_name.lower()

# ---------- Edge TTS (Low Quality) ----------
async def tts_edge_single_speaker(text: str, voice_label: str, output_file: str) -> None:
    """
    Generate a single MP3 with Edge TTS.
    voice_label is a Gemini voice name (e.g., 'Puck' or 'sarah').
    """
    if not edge_tts:
        raise RuntimeError("edge_tts not available. Install with: pip install edge-tts")
    
    if not text.strip():
        raise ValueError("Empty text provided for TTS")
    
    base = normalize_voice_name(voice_label)
    mapped = EDGE_TTS_VOICE_MAP.get(base.lower())
    
    if not mapped:
        # Fallback to default voices
        if any(female in base.lower() for female in ['sarah', 'emma', 'jenny', 'aria', 'female']):
            mapped = "en-US-JennyNeural"
        else:
            mapped = "en-US-GuyNeural"
        print(f"Warning: Voice '{voice_label}' not found, using fallback: {mapped}")
    
    try:
        os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
        
        communicate = edge_tts.Communicate(text, mapped)
        await communicate.save(output_file)
        
        # Verify file was created
        if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
            raise Exception(f"Failed to create audio file: {output_file}")
            
    except Exception as e:
        raise Exception(f"TTS generation failed for voice '{voice_label}': {e}")

def merge_mp3_files(input_files: List[str], output_file: str) -> None:
    """
    Merge MP3 segments. Uses pydub if available; falls back to naive concat.
    """
    if not input_files:
        raise ValueError("No input files to merge.")
    
    missing_files = [f for f in input_files if not os.path.exists(f)]
    if missing_files:
        raise FileNotFoundError(f"Missing input files: {missing_files}")
    
    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    
    try:
        from pydub import AudioSegment
        print(f"Merging {len(input_files)} MP3 files using pydub...")
        
        combined = AudioSegment.from_file(input_files[0], format="mp3")
        for i, f in enumerate(input_files[1:], 2):
            print(f"Adding file {i}/{len(input_files)}")
            seg = AudioSegment.from_file(f, format="mp3")
            combined += seg
        
        combined.export(output_file, format="mp3")
        print(f"Successfully merged to: {output_file}")
        
    except ImportError:
        print("pydub not available, using fallback merge method...")
        # Fallback: byte concat (simple, not gapless but works without deps)
        with open(output_file, "wb") as w:
            for i, f in enumerate(input_files, 1):
                print(f"Concatenating file {i}/{len(input_files)}")
                with open(f, "rb") as r:
                    w.write(r.read())
        print(f"Fallback merge completed: {output_file}")
    
    except Exception as e:
        raise Exception(f"Failed to merge MP3 files: {e}")

# ---------- Gemini Multi-speaker TTS (High Quality) ----------
def _wave_write_bytes(filepath: str, pcm_bytes: bytes, channels=1, rate=24000, sample_width=2) -> None:
    """Write PCM bytes to WAV file with error handling"""
    try:
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        
        with wave.open(filepath, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sample_width)
            wf.setframerate(rate)
            wf.writeframes(pcm_bytes)
            
        # Verify file was created
        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            raise Exception(f"Failed to create WAV file: {filepath}")
            
    except Exception as e:
        raise Exception(f"Failed to write WAV file: {e}")

async def tts_gemini_multi_speaker(conversation_text: str,
                                   Alex_voice_label: str,
                                   Avery_voice_label: str,
                                   output_wav_path: str) -> None:
    """
    Generate a high-quality WAV file using Gemini multi-speaker TTS.
    conversation_text should be formatted as:
        'Alex: ...\\nAvery: ...\\nAlex: ...'
    """
    if not client:
        raise RuntimeError("Gemini client not available. Check API key and installation.")
    
    if not conversation_text.strip():
        raise ValueError("Empty conversation text provided")
    
    Alex_base = normalize_voice_name(Alex_voice_label)
    Avery_base = normalize_voice_name(Avery_voice_label)
    
    # Map to proper Gemini voice names if needed
    voice_mapping = {
        'sarah': 'Kore',
        'emma': 'Aoede', 
        'jenny': 'Callirrhoe',
        'aria': 'Autonoe',
        'david': 'Puck',
        'john': 'Charon',
        'mike': 'Zephyr',
        'alex': 'Fenrir'
    }
    
    Alex_gemini = voice_mapping.get(Alex_base, Alex_base.title())
    Avery_gemini = voice_mapping.get(Avery_base, Avery_base.title())

    try:
        print(f"Generating high-quality audio with voices: {Alex_gemini}, {Avery_gemini}")
        
        # Generate content using the new SDK
        response = client.models.generate_content(
            model='gemini-2.5-flash-preview-tts',
            contents=conversation_text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                        speaker_voice_configs=[
                            types.SpeakerVoiceConfig(
                                speaker="Alex",
                                voice_config=types.VoiceConfig(
                                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                        voice_name=Alex_gemini
                                    )
                                ),
                            ),
                            types.SpeakerVoiceConfig(
                                speaker="Avery",
                                voice_config=types.VoiceConfig(
                                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                        voice_name=Avery_gemini
                                    )
                                ),
                            ),
                        ]
                    )
                ),
            ),
        )

        # Extract audio bytes from the response
        if not response.candidates or not response.candidates[0].content.parts:
            raise Exception("No audio content in Gemini response")
            
        audio_bytes = response.candidates[0].content.parts[0].inline_data.data
        if not audio_bytes:
            raise Exception("Empty audio data from Gemini")
            
        _wave_write_bytes(output_wav_path, audio_bytes)
        print(f"High-quality audio generated: {output_wav_path}")
        
    except Exception as e:
        raise Exception(f"Gemini TTS generation failed: {e}")
