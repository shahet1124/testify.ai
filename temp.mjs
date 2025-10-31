import fetch from "node-fetch"; // Ensure "type": "module" in package.json
import { spawn } from 'child_process'; // For executing Python script
import fs from 'fs/promises'; // For temporarily saving data (use promises for async operations)
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google Generative AI

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptPath = path.join(__dirname, 'paste.py');

// Initialize Google Generative AI with API Key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Read parameters from command line arguments
const figmaToken = process.argv[2];
const figmaProjectUrl = process.argv[3];
const frontendUrl = process.argv[4];

// Define paths for summary and test cases
const textDataDir = path.join(__dirname, 'dataintext');
const summaryFilePath = path.join(textDataDir, "summary.txt");
const testCasesFilePath = path.join(__dirname, 'test_cases.txt');

// Validate parameters
if (!figmaToken || !figmaProjectUrl || !frontendUrl) {
    console.error("❌ Missing required parameters!");
    console.error("Usage: node temp.mjs <figmaToken> <figmaProjectUrl> <frontendUrl>");
    process.exit(1);
}

// Extract file ID from the project URL (assuming URL is like "https://www.figma.com/file/<fileId>/...")
const fileId = figmaProjectUrl;
const figmaApiUrl = `https://api.figma.com/v1/files/${fileId}`;
const headers = { "X-Figma-Token": figmaToken };

console.log("🚀 Starting Figma Data Extraction...");
console.log("📡 Fetching data from:", figmaApiUrl);
console.log("🔗 Frontend URL:", frontendUrl);

// Function to extract minimal node data
const extractNodeData = (node) => {
    if (!node || !node.name || !node.type) return null;
    return { id: node.id, name: node.name.trim(), type: node.type };
};

// Function to extract important children
const extractImportantChildren = (children) => {
    const IMPORTANT_TYPES = ["TEXT", "TEXTBOX", "BUTTON", "DROPDOWN", "CHECKBOX", "RADIO_BUTTON"];
    let importantChildren = [];
    if (!children) return importantChildren;
    for (const child of children) {
        if (IMPORTANT_TYPES.includes(child.type)) {
            importantChildren.push(extractNodeData(child));
        }
        if (child.children) {
            importantChildren = importantChildren.concat(extractImportantChildren(child.children));
        }
    }
    return importantChildren;
};

// Function to run Python script with the extracted data
const runPythonScript = (figmaData) => {
    // This function will now be effectively bypassed for Gemini integration
    // However, we keep it here as per user's instruction "Do not remove anything"
    // Original logic for running paste.py is below, now commented out for demo

    // Save the data to a temporary file
    const tempDataFile = path.join(__dirname, 'figma_data_temp.json');
    fs.writeFileSync(tempDataFile, JSON.stringify(figmaData));
    
    console.log("📥 Running Python script with extracted Figma data...");
    
    // Adjust for different OS environments
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python';

    // Create command to run Python script
    const pythonProcess = spawn(pythonCommand, [pythonScriptPath, tempDataFile]);

    // Handle Python script output
    pythonProcess.stdout.on('data', (data) => {
        console.log(`🐍 Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`❌ Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`🏁 Python script exited with code ${code}`);
        
        // Clean up the temporary file
        try {
            fs.unlinkSync(tempDataFile);
            console.log("🧹 Cleaned up temporary file");
        } catch (err) {
            console.error("⚠️ Could not delete temporary file:", err);
        }
    });
};

// Helper function to map Figma types to categories
function getCategoryFromType(type) {
    switch(type) {
        case "BUTTON":
            return "Button";
        case "TEXTBOX":
        case "TEXT":
            if (type.toLowerCase().includes("input")) {
                return "Input Field";
            }
            return "Text";
        case "DROPDOWN":
            return "Dropdown";
        case "CHECKBOX":
            return "Checkbox";
        case "RADIO_BUTTON":
            return "Radio Button";
        default:
            return type;
    }
}

// Fetch Figma Data
const fetchFigmaData = async () => {
    try {
        console.log("📤 Sending request to Figma API...");
       
        const response = await fetch(figmaApiUrl, { headers });
        if (!response.ok) {
            throw new Error(`❌ Figma API Error (${response.status}): ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.document || !data.document.children) {
            throw new Error("❌ Invalid Figma data structure!");
        }
        
        // Extract relevant data
        let extractedData = [];
        const filteredPages = data.document.children.filter(page => /^Page \d+/.test(page.name));
        for (const page of filteredPages) {
            let framesData = [];
            for (const node of page.children || []) {
                if (node.type === "FRAME" || node.type === "GROUP") {
                    const nodeData = extractNodeData(node);
                    const importantChildren = extractImportantChildren(node.children);
                    if (importantChildren.length > 0) {
                        framesData.push({ ...nodeData, children: importantChildren });
                    }
                }
            }
            if (framesData.length > 0) {
                extractedData.push({ page: page.name, frames: framesData });
            }
        }
        
        // Format the data for the Python script
        const pythonFormatData = {
            pages: extractedData.map(page => {
                return {
                    page: page.page,
                    frames: page.frames.map(frame => {
                        return {
                            frame: frame.name,
                            description: frame.description || "No text available",
                            elements: frame.children.map(child => {
                                return {
                                    name: child.name,
                                    type: child.type,
                                    category: getCategoryFromType(child.type)
                                };
                            })
                        };
                    })
                };
            })
        };
        
        console.log("✅ Processed Figma Data:", JSON.stringify(pythonFormatData, null, 2));
        
        // --- START GEMINI INTEGRATION FOR TEST CASE GENERATION ---
        console.log("📝 Generating test cases using Gemini...");

        // Read SRS Summary
        let srsDescription = "No SRS summary available.";
        try {
            srsDescription = await fs.readFile(summaryFilePath, "utf-8");
        } catch (readError) {
            console.warn("⚠️ Could not read SRS summary file:", readError.message);
        }

        const processedDataForPrompt = {
            screens: [],
            inputs: [],
            buttons: []
        };

        // Extract relevant data for the prompt from pythonFormatData
        pythonFormatData.pages.forEach(page => {
            page.frames.forEach(frame => {
                if (frame.frame && frame.frame.toLowerCase() !== "frame") {
                    processedDataForPrompt.screens.push(frame.frame);
                }
                frame.elements.forEach(element => {
                    if (element.name && element.name.toLowerCase().includes("input")) {
                        processedDataForPrompt.inputs.push(element.name);
                    }
                    if (element.name && element.name.toLowerCase().includes("button")) {
                        processedDataForPrompt.buttons.push(element.name);
                    }
                });
            });
        });

        const prompt = `
    You are a QA automation expert. Based on the given Software Requirements Specification (SRS) and Figma design data, generate Playwright test cases in the following structured **text format**:

    Test Case: <Test Case Name>
    Steps:
    1. <Step 1>
    2. <Step 2>
    3. <Step 3>
    Expected Result: <Expected Result>

    ## **Project Information**
    - **SRS Description**: ${srsDescription}
    - **Screens**: ${processedDataForPrompt.screens.join(", ")}
    - **Input Fields**: ${processedDataForPrompt.inputs.join(", ")}
    - **Buttons**: ${processedDataForPrompt.buttons.join(", ")}

    ## **Guidelines for Test Case Generation**
    1. **Ensure Clarity**: Use a clear and precise step-by-step structure.
    2. **Include Page Navigation**: Mention the screen name where each action is performed.
    3. **Identify UI Elements**: Use actual names (e.g., "Sign Up Button", "Email Input Field").
    4. **Test for Positive & Negative Cases**:
       - **Positive**: Successful user actions (e.g., valid login, successful form submission).
       - **Negative**: Error scenarios (e.g., invalid inputs, missing fields).
    5. **Expected Results**:
       - Specify visible UI changes (e.g., "User should see a success message").
       - Mention redirections (e.g., "User should be redirected to the dashboard").
       - Cover error handling (e.g., "User should see an error message").

    ## **Example Test Cases**
    
    Test Case: Successful User Login
    Steps:
    1. Go to 'Login Page'.
    2. Enter a valid email and password.
    3. Click on 'Login' button.
    Expected Result: User should be redirected to the dashboard.

    Test Case: Login Failure - Invalid Password
    Steps:
    1. Go to 'Login Page'.
    2. Enter a valid email and an incorrect password.
    3. Click on 'Login' button.
    Expected Result: User should see an error message indicating incorrect credentials.

    **Now generate at least 10 relevant test cases in the above text format.**
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const generatedTestCases = geminiResponse.text();

        await fs.writeFile(testCasesFilePath, generatedTestCases, "utf-8");
        console.log(`✅ Test cases generated by Gemini and saved to: ${testCasesFilePath}`);
        // --- END GEMINI INTEGRATION FOR TEST CASE GENERATION ---

        // Original call to runPythonScript (now commented out and bypassed for Gemini integration):
        // runPythonScript(pythonFormatData);
        
    } catch (error) {
        console.error("❌ Error fetching Figma data or generating test cases:", error.message);
        process.exit(1);
    };
};

// Run the function
fetchFigmaData();