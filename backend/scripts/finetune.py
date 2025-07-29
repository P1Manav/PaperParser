from langchain_ollama import OllamaLLM
from groq import Groq
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

# groq_api_key = os.environ.get("GROQ_API_KEY")
# client = Groq(api_key=groq_api_key)
# fine_tune_model = ChatGroq(model = "deepseek-r1-distill-llama-70b")


fine_tune_model = OllamaLLM(model="deepseek-r1:7b")


def fine_tune_output(res):
    print("\n")
    print("\n")
    print("------Refining your response by another LLM---------")

    prompt = (
        f"Refine the following text to ensure accuracy, clarity, and completeness. "
        f"Make it concise, professional, and well-structured, while preserving all key details:\n\n{res}"
    )


    print("\n")
    

    refined_output = fine_tune_model.invoke(prompt)
    return refined_output