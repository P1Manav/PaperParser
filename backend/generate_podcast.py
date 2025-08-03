import sys
import os
import subprocess
import json
import re
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables
load_dotenv()

# Define Groq model (Ensure you have the correct API key set in .env)
groq_api_key = os.getenv("GROQ_API_KEY")
client = ChatGroq(model="deepseek-r1-distill-llama-70b", groq_api_key=groq_api_key) # Pass API key

# Function to process the uploaded PDF file
def process_pdf(input_pdf_path):
    print(f"Processing file at path: {input_pdf_path}")
    loader = PyPDFLoader(input_pdf_path)
    dataset = loader.load()
    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        separators=["\n\n", "\n", " "], chunk_size=1000, chunk_overlap=200
    )
    print("Processing document into chunks...")
    docs = text_splitter.split_documents(dataset)
    print("Document processed.")
    vectorstore = Chroma.from_documents(
        documents=docs,
        collection_name="rag-chroma",
        embedding=OllamaEmbeddings(model="mxbai-embed-large"),
    )
    return vectorstore.as_retriever()

# Main function to process the uploaded PDF and generate the podcast
def process_uploaded_pdf_and_generate_podcast(input_pdf_path, output_mp3_path):
    retriever = process_pdf(input_pdf_path)
    # Define the RAG prompt for the podcast
    rag_template = """
    Create a two-person podcast conversation discussing the key points of the research paper.
    One person will ask questions to guide the discussion, while the other will provide detailed answers
    based solely on the given paper. Ensure the conversation flows naturally and covers all important aspects
    without adding any information beyond what is provided in the paper.
    ### Format the response strictly as a JSON array:
    [
    {{"speaker": "Alice", "text": "Hello, welcome to our podcast!"}},
    {{"speaker": "Bob", "text": "Thanks! Today, we are discussing the research paper on AI advancements."}},
    ...
    ]
    Do not include any other text or explanations—only return a valid JSON array.
    {context}
    Question:
    {question}"""
    rag_prompt = ChatPromptTemplate.from_template(rag_template)
    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | rag_prompt
        | client
        | StrOutputParser()
    )
    # Query for podcast generation
    query = "Generate a two-person podcast-style conversation discussing the key points of the research paper."
    def extract_json(text):
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group(0) if match else None
    response = rag_chain.invoke(query)
    # Extract JSON part
    response_json = extract_json(response)
    if response_json:
        conversation_json = json.loads(response_json)
    else:
        print("Error: Could not extract valid JSON from model response.")
        conversation_json = []

    print("Generated Podcast JSON Script:")
    print(json.dumps(conversation_json, indent=4))

    # Define the data directory and ensure it exists
    data_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(data_directory, exist_ok=True) # Create the directory if it doesn't exist

    # Define the JSON file path
    json_file_path = os.path.join(data_directory, "conversation.json")
    # Save the conversation JSON to the data folder
    with open(json_file_path, "w") as json_file:
        json.dump(conversation_json, json_file, indent=4)
    print(f"Conversation JSON saved to {json_file_path}")

    # Run voice.py after saving the conversation JSON
    voice_script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice.py")
    if os.path.exists(voice_script_path):
        print(f"Running voice.py script: {voice_script_path}")
        try:
            # Pass the JSON file path and the desired output MP3 path to voice.py
            subprocess.run(["python", voice_script_path, json_file_path, output_mp3_path], check=True)
            print(f"voice.py executed successfully. MP3 saved to {output_mp3_path}")
        except subprocess.CalledProcessError as e:
            print(f"Error running voice.py: {e}")
            raise
    else:
        print(f"voice.py not found at {voice_script_path}, please check the path.")
        raise FileNotFoundError(f"voice.py not found at {voice_script_path}")

# Main entry point to handle the command line arguments
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_podcast.py <input_pdf_path> <output_mp3_path>")
        sys.exit(1)

    input_pdf_path = sys.argv[1]
    output_mp3_path = sys.argv[2]
    print(f"Received input PDF path: {input_pdf_path}")
    print(f"Received output MP3 path: {output_mp3_path}")

    process_uploaded_pdf_and_generate_podcast(input_pdf_path, output_mp3_path)
