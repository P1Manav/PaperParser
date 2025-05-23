
# 📄🎙️ PaperParser  

**PaperParser** is an innovative tool designed to transform academic research papers into accessible formats such as **podcasts** 🎧 and **PowerPoint presentations** 📊. By leveraging advanced language models and text-to-speech technologies, PaperParser aims to make scholarly content more digestible and engaging for a broader audience.  

## 🚀 Features  

- **🎙️ Podcast Generation:** Converts academic papers into audio podcasts, allowing users to listen to research content on the go.  
- **📊 Presentation Creation:** Automatically generates PowerPoint presentations summarizing key points from academic papers, facilitating easier comprehension and sharing.  

## 🛠️ Technologies Used  

### **Backend:**  
- 🐍 **Python:** Core programming language for backend development.  
- 🌐 **Flask:** Web framework used to build the API.  
- 🗣️ **gTTS (Google Text-to-Speech):** Converts text extracted from papers into speech for podcast generation.  
- 📄 **PyPDF2:** Extracts text from PDF documents.  
- 🖼️ **python-pptx:** Creates PowerPoint presentations programmatically.  
- 🧠 **LangChain:** Facilitates interactions with language models to generate summaries and content.  

### **Frontend:**  
- ⚛️ **React.js:** JavaScript library for building user interfaces.  
- 🔷 **TypeScript:** Enhances JavaScript with static typing for improved developer experience.  
- 🎨 **CSS:** Styles the frontend components for a responsive and visually appealing design.  

## 🏗️ Installation  

To set up the PaperParser project locally, follow these steps:  

1. **📥 Clone the Repository:**  
   ```bash
   git clone https://github.com/P1Manav/PaperParser.git
   ```
2. **📂 Navigate to the Project Directory:**  
   ```bash
   cd PaperParser
   ```
3. **🛠️ Backend Setup:**  
   - **Create a Virtual Environment:**  
     ```bash
     python3 -m venv venv
     source venv/bin/activate  # On Windows use `venv\Scripts\activate`
     ```
   - **Install Dependencies:**  
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Set Environment Variables:**  
     Create a `.env` file in the `backend` directory with the following content:  
     ```env
     FLASK_APP=app.py
     FLASK_ENV=development
     ```
   - **Run the Flask Server:**  
     ```bash
     cd backend
     flask run
     ```

4. **🎨 Frontend Setup:**  
   - **Navigate to the Frontend Directory:**  
     ```bash
     cd frontend
     ```
   - **Install Dependencies:**  
     ```bash
     npm install
     ```
   - **Start the React Development Server:**  
     ```bash
     npm start
     ```

## 🎯 Usage  

1. **📄 Upload a PDF:** Use the web interface to upload an academic paper in PDF format.  
2. **⚙️ Select Output Format:** Choose between generating a podcast or a PowerPoint presentation.  
3. **📥 Download or Stream:** Once processed, download the generated presentation or stream the podcast directly from the application.  

## 🙌 Acknowledgments  

Special thanks to the open-source community and the developers of the libraries and frameworks used in this project.  

## 📌 Contributing  

We welcome contributions! Feel free to open **issues** and **pull requests** to improve the project.  

## 🏆 Hackathon Participation  

This project was built as part of a **hackathon** to showcase **AI-powered design validation**. 🏅  

---

🎉 **Happy Parsing!** 🚀  
