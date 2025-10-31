import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

// Set your API key
const genAI = new GoogleGenerativeAI("AIzaSyCJmblGytmFTdtylz5CHZzN7l-f94qk1ik");

async function extractRequirementsFromTextFile() {
  try {
    // Read the content of extracted_text.txt
    const text = await fs.readFile("./dataintext/extracted_text.txt", "utf-8");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

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
    console.log(response.text()); // Print extracted requirements
  } catch (error) {
    console.error("Error reading file or generating content:", error);
  }
}

// Run the function
extractRequirementsFromTextFile();
