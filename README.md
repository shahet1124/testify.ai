# Node.js Backend for SRS and Figma Integration

This project provides a Node.js backend that automates the generation of Playwright test cases from Software Requirements Specification (SRS) documents and Figma designs. It uses Google Generative AI and a local LLM to achieve this.

## Features

*   **PDF to Text Extraction**: Extracts text content from uploaded PDF files (SRS documents).
*   **SRS Summarization**: Summarizes the extracted SRS text using Google Generative AI.
*   **Figma Design Data Extraction**: Fetches and processes Figma design data, identifying key UI elements.
*   **Test Case Generation**: Generates structured Playwright test cases based on the SRS summary and Figma design data, utilizing a local LLM.
*   **Playwright Test File Creation**: Converts generated text-based test cases into executable Playwright JavaScript files using Google Generative AI.

## Project Structure

*   `server.mjs`: The main Express server that handles API requests.
*   `extractText.js`: Extracts text from PDF files.
*   `summarizeSRS.js`: Summarizes extracted SRS text using Google Generative AI.
*   `temp.mjs`: Fetches Figma design data and orchestrates the call to `paste.py`.
*   `paste.py`: Processes Figma data, integrates with a local LLM for test case generation, and saves them to `test_cases.txt`.
*   `ConvertTest.mjs`: Converts `test_cases.txt` into Playwright JavaScript test files using Google Generative AI.
*   `uploads/`: Directory for uploaded PDF files.
*   `dataintext/`: Directory for extracted text and SRS summaries.
*   `test_cases.txt`: Stores generated test cases in a structured text format.
*   `playwright_tests2.js`: Stores the final Playwright JavaScript test code.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd node_backend
    ```

2.  **Install Node.js dependencies**:
    ```bash
    npm install
    ```

3.  **Install Python dependencies**:
    Ensure you have `requests` installed for Python.
    ```bash
    pip install requests
    ```

4.  **Environment Variables**:
    *   Create a `.env` file in the project root.
    *   Add your Google Generative AI API key:
        ```
        GOOGLE_API_KEY="YOUR_GOOGLE_GENERATIVE_AI_API_KEY"
        ```
        *   (Optional but recommended) Configure your local LLM API URL if it differs from the default:
            ```
            LLM_API_URL="http://10.21.19.17:1234/v1/completions"
            ```
            *Note: The local LLM is now bypassed in favor of Google Generative AI for test case generation, but `paste.py` remains in the project. The `LLM_API_URL` environment variable is no longer actively used for test case generation within `temp.mjs`.*

5.  **Local LLM Setup (if applicable)**:
    Ensure your local LLM server is running and accessible at the configured `LLM_API_URL`.

## Usage

**For Demonstration Purposes (using Google Generative AI for Test Cases):**
`temp.mjs` now uses Google Generative AI (`gemini-2.5-flash`) to generate the `test_cases.txt` file after fetching Figma data. This simplifies the setup as no local LLM is required.

1.  **Start the Node.js backend server**:
    ```bash
    nodemon server.mjs
    ```
    The server will run on `http://localhost:3000`.

2.  **Upload a PDF (SRS Document)**:
    Send a POST request to `http://localhost:3000/upload` with a `pdfFile` (multipart/form-data).
    Example using `curl`:
    ```bash
    curl -X POST -H "Content-Type: multipart/form-data" -F "pdfFile=@path/to/your/srs.pdf" -F "figmaToken=YOUR_FIGMA_TOKEN" -F "figmaProjectUrl=YOUR_FIGMA_PROJECT_URL" -F "frontendUrl=YOUR_FRONTEND_URL" http://localhost:3000/upload
    ```
    *Note: `figmaToken`, `figmaProjectUrl`, and `frontendUrl` are primarily used in the `/execute-temp` endpoint.*

3.  **Trigger Figma Data Extraction and Test Case Generation (using Gemini)**:
    Send a POST request to `http://localhost:3000/execute-temp` with `figmaToken`, `figmaProjectUrl`, and `frontendUrl` in the request body.
    Example using `curl`:
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{ "figmaToken": "YOUR_FIGMA_TOKEN", "figmaProjectUrl": "YOUR_FIGMA_PROJECT_ID", "frontendUrl": "http://localhost:4000" }' http://localhost:3000/execute-temp
    ```
    This will initiate the Figma data extraction and then use Google Generative AI to generate the `test_cases.txt` file.

4.  **Generate Playwright Test Files**:
    Manually run `ConvertTest.mjs` to convert the `test_cases.txt` into a Playwright test file.
    ```bash
    node ConvertTest.mjs
    ```
    This will create or update `playwright_tests2.js` with the Playwright test code.

5.  **Retrieve SRS Summary**:
    Send a GET request to `http://localhost:3000/summary` to get the summarized SRS text.
    ```bash
    curl http://localhost:3000/summary
    ```

## Development

*   The project uses `nodemon` for automatic server restarts during development.
*   Ensure all necessary environment variables are set for proper functioning.

---
