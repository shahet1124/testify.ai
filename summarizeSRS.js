import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Define file paths
const dataTextDir = path.join(__dirname, "dataintext");
const extractedTextPath = path.join(dataTextDir, "extracted_text.txt");
const summaryFilePath = path.join(dataTextDir, "summary.txt");

async function extractRequirementsFromTextFile() {
  try {
    // Ensure the dataintext directory exists
    await fs.mkdir(dataTextDir, { recursive: true });

    // Read the extracted text
    const text = await fs.readFile(extractedTextPath, "utf-8");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze the following text and extract key functional and non-functional requirements also give url for frontend source if present.
      Ignore diagrams, metadata, and unrelated information.
      
      Text:
      ${text}
      
      Output:
      - Provide requirement statements in a simple bullet format.
      - Ensure clarity and relevance.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log(`Debug: Attempting to save summary to path: ${summaryFilePath}`);
    console.log(`Debug: Summary content (first 100 chars): ${summary.substring(0, 100)}...`);

    // Save summary to file
    await fs.writeFile(summaryFilePath, summary, "utf-8");

    console.log("✅ Summary saved successfully!");
  } catch (error) {
    console.error("❌ Error processing text file:", error);
    console.error("Full error details:", error);
  }
}

// Run the function
extractRequirementsFromTextFile();
