import os
import re
import json
import asyncio
import tempfile
from typing import List, Dict
import time
from dotenv import load_dotenv
import fitz  # PyMuPDF
from google.api_core.exceptions import ResourceExhausted
import google.generativeai as genai
from pathlib import Path
import sys

current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from voice import (
        tts_edge_single_speaker,
        merge_mp3_files,
        tts_gemini_multi_speaker,
    )
except ImportError as e:
    print(f"Warning: Could not import voice functions: {e}")
    print("Voice generation will not be available")

load_dotenv()

# ---------- Gemini client setup ----------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables.")

# Initialize Gemini client
genai.configure(api_key=GOOGLE_API_KEY)

def get_model(model_name="gemini-2.0-flash-exp"):
    """Get Gemini model with fallback options"""
    try:
        return genai.GenerativeModel(model_name)
    except Exception:
        # Fallback to older model if new one fails
        return genai.GenerativeModel("gemini-1.5-flash")

# ---------- Text generation helper ----------
def _gen_model_text(prompt, model_name="gemini-2.0-flash-exp", temperature=0.5, max_retries=3):
    """Generate text with retry logic and better error handling"""
    for attempt in range(max_retries):
        try:
            # create a fresh model each time (safe)
            m = get_model(model_name)
            resp = m.generate_content(
                prompt, 
                generation_config=genai.types.GenerationConfig(temperature=temperature)
            )
            if resp.text:
                return resp.text
            else:
                print(f"Empty response on attempt {attempt + 1}")
                continue
        except ResourceExhausted:
            wait_time = 10 * (attempt + 1)  # Exponential backoff
            print(f"Quota hit, waiting {wait_time}s before retry...")
            time.sleep(wait_time)
        except Exception as e:
            print(f"Error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(5)
    
    raise Exception(f"Failed to generate text after {max_retries} attempts")

# ---------- PDF -> text ----------
def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF with error handling"""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    try:
        doc = fitz.open(pdf_path)
        pages = []
        for page in doc:
            text = page.get_text()
            if text.strip():  # Only add non-empty pages
                pages.append(text)
        doc.close()
        
        if not pages:
            raise ValueError("No text content found in PDF")
            
        return "\n".join(pages)
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {e}")

# ---------- chunk ----------
def split_into_chunks(text: str, max_chars: int = 3000) -> List[str]:
    """Split text into chunks with improved logic"""
    if not text.strip():
        return []
        
    lines = text.splitlines()
    chunks, cur = [], []
    cur_len = 0
    
    for ln in lines:
        add = len(ln) + 1
        if cur_len + add > max_chars and cur:
            chunks.append("\n".join(cur))
            cur, cur_len = [ln], add
        else:
            cur.append(ln)
            cur_len += add
    
    if cur:
        chunks.append("\n".join(cur))
    
    # Filter out very small chunks
    return [chunk for chunk in chunks if len(chunk.strip()) > 50]

# ---------- summarize ----------
def summarize_chunks(chunks: List[str]) -> str:
    """Summarize text chunks with better error handling"""
    if not chunks:
        raise ValueError("No chunks to summarize")
    
    summaries = []
    for i, chunk in enumerate(chunks):
        print(f"Summarizing chunk {i+1}/{len(chunks)}...")
        prompt = f"""
You are an expert science communicator explaining research papers to an educated but non-specialist audience.
Read the following section of a paper and create a teaching-style summary:
- 5–7 sentences.
- Explain technical terms briefly if needed.
- Preserve important details about definitions, methods, results, and context.
- Be clear and engaging, like explaining to graduate students or podcast listeners.

SECTION:
{chunk}
"""
        try:
            summary = _gen_model_text(prompt, model_name="gemini-2.0-flash-exp", temperature=0.5)
            if summary.strip():
                summaries.append(summary)
        except Exception as e:
            print(f"Warning: Failed to summarize chunk {i+1}: {e}")
            continue

    if not summaries:
        raise Exception("Failed to summarize any chunks")

    combined = " ".join(summaries)

    compress_prompt = f"""
Combine the following summaries into a single coherent overview (15–20 sentences).
Write it as if preparing detailed notes for a podcast discussion:
- Cover definitions, motivation, methods, key results, limitations, and implications.
- Maintain clarity and logical flow.
- Avoid bullet points or list formatting; use natural paragraphs.

SUMMARIES:
{combined}
"""
    return _gen_model_text(compress_prompt, model_name="gemini-2.0-flash-exp", temperature=0.4)

# ---------- conversation JSON ----------
CONVO_PROMPT_TEMPLATE = """
Return a STRICT JSON array where each element is:
{{"speaker": "Alex" or "Avery", "text": "<1–3 sentence natural utterance>"}}

Rules:
- Alternate speakers naturally and evenly.
- Keep style friendly but informed; no stage directions.
- Use only facts from the paper summary provided.
- Do NOT include metadata, headings, Markdown, or prose outside the JSON.
- The text must be ONLY what the speaker says (no "Alex:" prefixes in text).

Paper summary to base the conversation on:
{summary}
"""

def _try_parse_json_array(s: str) -> List[Dict[str, str]]:
    """Parse JSON array with better error handling"""
    # Clean up common JSON formatting issues
    s = s.strip()
    if s.startswith('```json'):
        s = re.sub(r'^```json\s*', '', s)
    if s.endswith('```'):
        s = re.sub(r'\s*```$', '', s)
    
    try:
        data = json.loads(s)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}")
    
    if not isinstance(data, list):
        raise ValueError("Root is not a list.")
    
    # Validate and clean items
    out = []
    for item in data:
        if not isinstance(item, dict):
            continue
        sp = item.get("speaker", "").strip()
        tx = item.get("text", "").strip()
        if sp in ("Alex", "Avery") and tx:
            out.append({"speaker": sp, "text": tx})
    
    if not out:
        raise ValueError("No valid conversation items found.")
    
    return out

def build_conversation_json(summary: str) -> List[Dict[str, str]]:
    """Build conversation JSON with multiple retry strategies"""
    if not summary.strip():
        raise ValueError("Empty summary provided")
    
    # 1st attempt
    try:
        raw = _gen_model_text(
            CONVO_PROMPT_TEMPLATE.format(summary=summary), 
            model_name="gemini-2.0-flash-exp", 
            temperature=0.5
        )
        return _try_parse_json_array(raw)
    except Exception as e:
        print(f"First attempt failed: {e}")

    # Try to extract JSON array substring
    try:
        m = re.search(r'\[.*\]', raw, flags=re.DOTALL)
        if m:
            return _try_parse_json_array(m.group(0))
    except Exception as e:
        print(f"JSON extraction failed: {e}")

    # Last-chance repair prompt
    try:
        repair_prompt = f"""
You produced JSON-like text but it was invalid.
Rewrite the following so that it is ONLY a valid JSON array of objects with exactly:
  - "speaker": "Alex" or "Avery"
  - "text": string
No commentary. No Markdown. Just the JSON array.

INPUT:
{raw}
"""
        repaired = _gen_model_text(repair_prompt, model_name="gemini-2.0-flash-exp", temperature=0.0)
        return _try_parse_json_array(repaired)
    except Exception as e:
        print(f"Repair attempt failed: {e}")
        raise Exception("Failed to generate valid conversation JSON after all attempts")

def save_conversation_json(conversation: List[Dict[str, str]], json_path: str) -> None:
    """Save conversation JSON with error handling"""
    try:
        os.makedirs(os.path.dirname(json_path) or ".", exist_ok=True)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(conversation, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise Exception(f"Failed to save conversation JSON: {e}")

# ---------- audio generation ----------
async def generate_low_quality_audio(conversation: List[Dict[str, str]],
                                     Alex_voice_label: str,
                                     Avery_voice_label: str,
                                     output_mp3_path: str) -> None:
    """
    Low-quality path with better error handling:
    - Make one MP3 per dialogue line (speaker speaks ONLY their text).
    - Merge into a single MP3.
    """
    if not conversation:
        raise ValueError("Empty conversation provided")
    
    tmpdir = tempfile.mkdtemp(prefix="podcast_segments_")
    seg_paths: List[str] = []
    
    try:
        print(f"Generating {len(conversation)} audio segments...")
        for idx, turn in enumerate(conversation, 1):
            speaker = turn["speaker"]
            text = turn["text"]
            voice_label = Alex_voice_label if speaker == "Alex" else Avery_voice_label
            seg_path = os.path.join(tmpdir, f"seg_{idx:04d}.mp3")
            
            print(f"Generating segment {idx}/{len(conversation)} ({speaker})")
            await tts_edge_single_speaker(text, voice_label, seg_path)
            
            if os.path.exists(seg_path) and os.path.getsize(seg_path) > 0:
                seg_paths.append(seg_path)
            else:
                print(f"Warning: Failed to generate segment {idx}")

        if not seg_paths:
            raise Exception("No audio segments were generated successfully")

        print("Merging audio segments...")
        merge_mp3_files(seg_paths, output_mp3_path)
        
        if not os.path.exists(output_mp3_path):
            raise Exception("Failed to create merged audio file")
            
    finally:
        # clean temp files
        for p in seg_paths:
            try:
                os.remove(p)
            except Exception:
                pass
        try:
            os.rmdir(tmpdir)
        except Exception:
            pass

async def generate_audio_high(conversation: List[Dict[str, str]],
                              Alex_voice_label: str,
                              Avery_voice_label: str,
                              output_wav_path: str) -> None:
    """
    High-quality path with better error handling (Gemini multi-speaker, single shot):
    - Build 'Alex: ...\\nAvery: ...' transcript (labels route to correct voice).
    - Produce a WAV at output_wav_path.
    """
    if not conversation:
        raise ValueError("Empty conversation provided")
    
    try:
        convo_text = "\n".join(f"{turn['speaker']}: {turn['text']}" for turn in conversation)
        print("Generating high-quality audio with Gemini TTS...")
        await tts_gemini_multi_speaker(convo_text, Alex_voice_label, Avery_voice_label, output_wav_path)
        
        if not os.path.exists(output_wav_path):
            raise Exception("Failed to create high-quality audio file")
            
    except Exception as e:
        raise Exception(f"High-quality audio generation failed: {e}")
