import json
import os
import pymupdf4llm
from pptx import Presentation
from langchain_community.document_loaders import PyMuPDFLoader
from google import genai
from dotenv import load_dotenv
from helper.image_extractor import extract_combined_images_with_captions
load_dotenv()





#  Phase -1 Data extraction from the ppt //////////////////////////////////////////////////
 
# file = "paper.pdf"
file = "2.pdf"
loader = PyMuPDFLoader(file)
docs = loader.load()
text= ""
for doc in docs:
    text+=doc.page_content

print("\n Phase-1 Text Extraction is completed\n")
# Phase -2 Take the extracted data and generate a ppt text for according to pages /////////////////////////////////////////////////////////////////////////

# type_pdf = input("\n.....Enter the pdf type... \n" )    
type_pdf ="Research Paper"
#input of pdf type i.e research paper or any standard doc


# length_of_ppt = input("\n..Enter the lenght of ppt means short / medium / long..\n")

length_of_ppt = "long"
system_prompt_1 = f"""


You are a smart document structuring assistant. Your task is to take the complete extracted text from a PDF file and preprocess it in a way that it becomes well-organized, logically grouped, and ready for PowerPoint slide generation in the next phase.

Here are the inputs:

-----------------------------------
📄 TYPE OF PDF: {type_pdf}
📊 TARGET PPT LENGTH: {length_of_ppt} (short = 5-6 slides, medium = 7-8 slides, long = 10-12 slides)

📚 FULL RAW TEXT EXTRACTED FROM PDF:
{text}
-----------------------------------

Your goals:

1. Understand and analyze the structure of the document based on its type:
   - For research papers, identify and label sections like: Abstract, Introduction, Problem Statement, Literature Review, Methodology, Results, Conclusion, Future Work, etc.
   - For standard documents (e.g. proposals, business plans), group and label based on logical themes or topics like Overview, Objectives, Key Concepts, Strategies, Implementation, Case Studies, etc.
   - If type is unknown or custom, use best judgment to extract and organize major topics or logical chunks.

2. Group the content into structured labeled sections:
   - Use headers like `## Section: Introduction`, `## Section: Results`, etc.
   - Each section should contain the full detailed text relevant to that label.
   - Preserve important technical or formal tone (especially for research-type PDFs)

3. Adjust the depth and number of sections based on the requested presentation length:
   - If short, limit to 5-6 major sections with concise, focused content.
   - If medium, allow 7-8 moderately detailed sections.
   - If long, include 10-12+ granular sections and sub-sections.

4. Preprocess the content:
   - Clean up repetitions or OCR errors.
   - Merge fragmented lines/sentences.
   - Retain any bullet points, formulas, or figure captions as-is.
   - If figure captions are found, label them clearly as `[Figure Caption: ...]`

5. Do NOT generate slides yet. Just return a well-organized, clean, and structured text document — ready for slide conversion in the next phase.

Return the output in clear Markdown or readable labeled format.

Now process the content accordingly.



"""

gemini_api_key = os.getenv("gemini_api_key")
client = genai.Client(api_key=gemini_api_key)

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=system_prompt_1,
)

print(response.text)


pre_process_text = response.text
print("\n Phase-2 Text Processing Completed \n")


# Phase -3 from the pdf find the images /////////////////////////////


extract_combined_images_with_captions(file)

print("\nPhase-3 Retreive the Images from the Given PDF\n")





# Phase -4 from the text find all the figure_captions ////////////////////////////////////


system_prompt_2 = f"""


You are a figure caption extractor for research papers.

Below is the preprocessed and cleaned full text of a research paper. Your task is to accurately extract all figure captions, which follow standard academic formatting such as:

- "Figure 1: ..."  
- "Fig. 2: ..."  
- Sometimes long captions span multiple lines after the label.
INPUT TEXT:
{pre_process_text}

Your goals:

1. Extract every figure caption that starts with:
   - "Figure X:" (where X is a number)
   - OR "Fig. X:" (alternative abbreviation)

2. If a caption spans multiple lines, combine all the lines until the next paragraph or until the next "Figure"/"Fig." starts.

3. Return a clean ordered list of all figure captions found, in the format:
   - Caption Number (e.g., Figure 4)
   - Full Caption Text (include all lines that belong to it)

4. Do not modify or summarize captions. Just extract exactly what is written after the "Figure" or "Fig." label.

5. Skip any unrelated content.

Format your output like this:
Figure 1
Full caption text...

Figure 2
Another caption text.

"""



response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=system_prompt_2,
)

figure_captions  = response.text

# print(figure_captions)
print("\nPhase-4 All Figures Captions are extracted \n")






# phase 5 /////////////////////////////////////////


with open(r"images\image_captions.json", "r",encoding="utf-8") as f:
    figure_captions_data = json.load(f)


system_prompt_3  = f"""

You are a smart assistant helping to improve and complete image captions for a research paper presentation.

You are given:
1. A dictionary called `image_captions` where each key is an image file name and the value is a partial figure caption that may be incomplete.
2. A list called `figure_captions` that contains the full and clean captions for all figures from the original paper.

Your job is to:
- For every image in `image_captions`, try to match its partial caption with one of the full captions in `figure_captions`.
- If a match is found, replace the partial caption with the full correct caption.
- Do not update or include entries where the caption is "No Figure caption found" or no match is found.
- Preserve the original keys (image filenames), just update the caption values when matched.

Output the final corrected dictionary in JSON format.

Partial image captions (dictionary):
{figure_captions_data}


Full figure captions (list):
{figure_captions}



"""


response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=system_prompt_3
)

image_captions_text = response.text

print("\nPhase-5 Preprocess the figure captions and correct it \n")

# print(image_captions_text)




# Phase 6 clean the generated output of figure captions and store it to json


system_prompt_4 = f"""
You are a data-cleaning and information extraction assistant.

You are given a raw Python dictionary where:
- Keys are image filenames (like "image4.png")
- Values are noisy figure captions extracted from a research paper's OCR-processed or scraped text.
- These captions may repeat multiple times for the same image key, sometimes as incomplete or partial fragments.

Here is the input dictionary:

{image_captions_text}

Your job:
1. Remove duplicate image keys — only keep the most complete, coherent caption per image.
2. If multiple captions exist for the same image, choose the longest and most meaningful version.
3. Clean up line breaks, mid-sentence cutoffs, and basic formatting issues.
4. Ensure the output is a valid **JSON-parseable Python dictionary**, not markdown, not a string, not indented code block.
5. Strictly follow this format in the final output — NO explanation, NO extra notes, ONLY return the final clean dictionary like:

{{
    "image4.png": "Figure 1 Same description as image_captions_text...",
    "image5.png": "Figure 2: image_caption...",

    ...
}}

Make sure:
- The dictionary is syntactically valid Python/JSON
- All values are complete and well-formed captions starting with 'Figure X:'
"""
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=system_prompt_4
)

final_image_captions = response.text
print(final_image_captions)





# now of phase 7 #actual data of pptx

