from pymongo import MongoClient
from datetime import datetime


client = MongoClient("mongodb://localhost:27017/")  
db = client["chat_history"]  # Database name
collection = db["conversations"]  # Collection name

def save_to_mongo(query , response):
    conversation = {
        "query":query,
        "response":response,
        "timestamp":datetime.now()

    }
    collection.insert_one(conversation)
    # print("Converstion saved to MongoDB")

def get_conversation_history():

    
    conversations = collection.find().sort("timestamp", -1)  # Most recent first
    for convo in conversations:
        print(f"Query: {convo['query']}\nResponse: {convo['response']}\nTime: {convo['timestamp']}\n")