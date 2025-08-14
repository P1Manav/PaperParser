# PaperParser

**PaperParser** is a tool designed to transform academic research papers into accessible formats such as audio podcasts and PowerPoint presentations. 
By leveraging advanced language models and text-to-speech technologies, PaperParser makes scholarly content more digestible and engaging for a broader audience.

## Features

- **Podcast Generation:** Converts academic papers into audio podcasts, allowing users to consume research content on the go.
- **Presentation Creation:** Automatically generates PowerPoint presentations summarizing key points from academic papers, enabling easier comprehension and sharing.

## Technologies Used

### Backend
- **Node.js:** Core runtime for backend development.
- **Express.js:** Web framework for building the REST API.
- **edge-tts & (Google Text-to-Speech):** Converts extracted text into speech for podcast generation.
- **PDF Parsing Library:** Extracts text from PDF documents.
- **PPTX Generator:** Creates PowerPoint presentations programmatically.

> Note: The backend may require Python dependencies for specific tasks. Ensure both Node.js and Python are installed if using components dependent on Python packages.

### Frontend
- **Next.js:** Library for building user interfaces.
- **TypeScript:** Adds static typing for improved developer experience.
- **CSS:** Styles frontend components for responsive and visually appealing design.

## Installation

To set up the PaperParser project locally, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/P1Manav/PaperParser.git
   ```

2. **Navigate to the Project Directory:**
   ```bash
   cd PaperParser
   ```

3. **Backend Setup:**
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Install Python dependencies (if required):
     ```bash
     pip install -r requirements.txt
     ```
   - Install Node.js dependencies:
     ```bash
     npm install
     ```
   - Run the backend server:
     ```bash
     node server.js
     ```

4. **Frontend Setup:**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the React development server:
     ```bash
     npm run dev
     ```

## Usage

1. Upload a PDF: Use the web interface to upload an academic paper in PDF format.
2. Select Output Format: Choose between generating a podcast or a PowerPoint presentation.
3. Download or Stream: Once processed, download the generated presentation or stream the podcast directly from the application.

## Acknowledgments

Special thanks to the open-source community and the developers of the libraries and frameworks used in this project.