import asyncio
import os
import wave
import tempfile
from typing import List

import edge_tts
from google import genai
from google.genai import types

# ---------- Voice mapping (Gemini label -> Edge TTS voice id) ----------
EDGE_TTS_VOICE_MAP = {
    "Zephyr": "en-US-GuyNeural",
    "Puck": "en-US-GuyNeural",
    "Charon": "en-US-GuyNeural",
    "Kore": "en-US-JennyNeural",
    "Fenrir": "en-US-GuyNeural",
    "Leda": "en-US-JennyNeural",
    "Orus": "en-US-GuyNeural",
    "Aoede": "en-US-JennyNeural",
    "Callirrhoe": "en-US-JennyNeural",
    "Autonoe": "en-US-JennyNeural",
    "Enceladus": "en-US-JennyNeural",
    "Iapetus": "en-US-GuyNeural",
    "Umbriel": "en-US-GuyNeural",
    "Algieba": "en-US-JennyNeural",
    "Despina": "en-US-JennyNeural",
    "Erinome": "en-US-JennyNeural",
    "Algenib": "en-US-GuyNeural",
    "Rasalgethi": "en-US-GuyNeural",
    "Laomedeia": "en-US-JennyNeural",
    "Achernar": "en-US-JennyNeural",
    "Alnilam": "en-US-GuyNeural",
    "Schedar": "en-US-GuyNeural",
    "Gacrux": "en-US-GuyNeural",
    "Pulcherrima": "en-US-GuyNeural",
    "Achird": "en-US-JennyNeural",
    "Zubenelgenubi": "en-US-GuyNeural",
    "Vindemiatrix": "en-US-JennyNeural",
    "Sadachbia": "en-US-GuyNeural",
    "Sadaltager": "en-US-GuyNeural",
    "Sulafat": "en-US-JennyNeural",
}

def normalize_voice_name(voice_label: str) -> str:
    """Take 'Puck -- Upbeat' -> 'Puck'."""
    return voice_label.split("--")[0].strip() if voice_label else ""

# ---------- Edge TTS (Low Quality) ----------
async def tts_edge_single_speaker(text: str, voice_label: str, output_file: str) -> None:
    """
    Generate a single MP3 with Edge TTS.
    voice_label is a Gemini voice name (e.g., 'Puck' or 'Puck -- Upbeat').
    """
    base = normalize_voice_name(voice_label)
    mapped = EDGE_TTS_VOICE_MAP.get(base)
    if not mapped:
        raise ValueError(f"Invalid voice '{voice_label}' (base '{base}' not found in EDGE_TTS_VOICE_MAP)")
    communicate = edge_tts.Communicate(text, mapped)
    await communicate.save(output_file)

def merge_mp3_files(input_files: List[str], output_file: str) -> None:
    """
    Merge MP3 segments. Uses pydub if available; falls back to naive concat.
    """
    try:
        from pydub import AudioSegment
        if not input_files:
            raise ValueError("No input files to merge.")
        combined = AudioSegment.from_file(input_files[0], format="mp3")
        for f in input_files[1:]:
            seg = AudioSegment.from_file(f, format="mp3")
            combined += seg
        combined.export(output_file, format="mp3")
    except Exception:
        # Fallback: byte concat (simple, not gapless but works without deps)
        with open(output_file, "wb") as w:
            for f in input_files:
                with open(f, "rb") as r:
                    w.write(r.read())

# ---------- Gemini Multi-speaker TTS (High Quality) ----------
def _wave_write_bytes(filepath: str, pcm_bytes: bytes, channels=1, rate=24000, sample_width=2) -> None:
    with wave.open(filepath, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm_bytes)

async def tts_gemini_multi_speaker(conversation_text: str,
                                   Alex_voice_label: str,
                                   Avery_voice_label: str,
                                   output_wav_path: str) -> None:
    """
    One-shot high-quality WAV using Gemini multi-speaker TTS.
    conversation_text should look like:
        'Alex: ...\\nAvery: ...\\nAlex: ...'
    """
    Alex_base = normalize_voice_name(Alex_voice_label)
    Avery_base = normalize_voice_name(Avery_voice_label)

    client = genai.Client()  # expects GOOGLE_API_KEY in env (or is configured elsewhere)

    resp = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=conversation_text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                    speaker_voice_configs=[
                        types.SpeakerVoiceConfig(
                            speaker="Alex",
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=Alex_base)
                            ),
                        ),
                        types.SpeakerVoiceConfig(
                            speaker="Avery",
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=Avery_base)
                            ),
                        ),
                    ]
                )
            )
        ),
    )

    audio_bytes = resp.candidates[0].content.parts[0].inline_data.data
    _wave_write_bytes(output_wav_path, audio_bytes)