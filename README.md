# 📄🎙️ PaperParser  

**PaperParser** transforms academic research papers into **podcasts** 🎧 and **PowerPoint presentations** 📊.  
By combining **AI summarization** and automated content generation, it makes scholarly content easier to consume and share.  

---

## Demo  

 **[LINK](https://drive.google.com/file/d/1CZZzGf0fnjUsd5mF3ewUkiK8Joub2GMX/view?usp=sharing)**
---

## 🚀 Features  

- 🎧 **Podcast Generation** – Listen to research papers in audio format  
- 📊 **Presentation Creation** – Auto-generate slide decks with key insights  
- 📄 **PDF Parsing** – Extract text and structure from uploaded research papers  
- ☁️ **Cloud Integration** – Secure storage and authentication with Supabase  

---

## 🛠️ Technologies Used  

### 🔙 Backend  
- ⚡ **Node.js + Express.js** – Core API server  
- 🧠 **Gemini API** – Summarization and content generation  
- 📄 **PyMuPDF** – High-quality PDF text parsing  
- ☁️ **Supabase** – Database + authentication layer  
- 🐳 **Docker** – Containerized backend for easy deployment  

### 🎨 Frontend  
- ⚛️ **Next.js (React + TypeScript)** – Modern frontend framework  
- 🌀 **Tailwind CSS** – Utility-first styling for responsive UI  

---

## ⚙️ Installation  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/P1Manav/PaperParser.git
cd PaperParser
```

---

### 2️⃣ Backend Setup (Dockerized 🐳)  

Navigate to backend:  
```bash
cd backend
```

Create a `.env` file (sample):  
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
google_api_key=
PORT=5000
NODE_ENV=
```

Build Docker image:  
```bash
docker build -t paperparser_image .
```

Run the container:  
```bash
docker run --env-file .env -p 5000:5000 --name paperparser_container paperparser_image
```

📌 Backend runs at: [http://localhost:5000](http://localhost:5000)  

---

### 3️⃣ Frontend Setup  

Navigate to frontend:  
```bash
cd ../frontend
```

Create `.env.local` file (sample):  
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Install dependencies:  
```bash
npx yarn install
```

Run development server:  
```bash
npx yarn dev
```

📌 Frontend runs at: [http://localhost:3000](http://localhost:3000)  

---

## 🎯 Usage  

1. 📄 Upload a PDF in the frontend  
2. ⚙️ Choose output → Podcast 🎧 or Presentation 📊  
3. ⬇️ Download or play the result directly  

---

## 🤝 Contributing  

Contributions are welcome! 🚀  
- Open an **issue** for bugs or feature requests  
- Submit a **PR** to help improve PaperParser  

---
