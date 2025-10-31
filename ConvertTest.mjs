import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with API Key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Function to convert test cases using Gemini API
async function convertToPlaywright(inputTxtFile, outputJsFile) {
  try {
    // Read test cases from input file
    const testCases = fs.readFileSync(inputTxtFile, "utf-8").trim();

    // Enhanced Prompt for Automated Testing
    const prompt = `
You are an expert in Playwright test automation. Convert the following manual test steps into a structured **Playwright JavaScript test file**.

### **Instructions:**
- **Group tests logically** using \`test.describe()\`.
- Each test should have a **meaningful name**, like:  
  \`✅ User should be able to log in successfully\`
- Use **parameterized inputs** to fill forms dynamically.
- Ensure **correct selectors** (e.g., \`#email\`, \`button[type="submit"]\`).
- Use **async/await** properly for Playwright actions.
- Implement **data-driven testing** by iterating over multiple test inputs.
- Follow best practices for **Playwright assertions**.
- **Return only the Playwright JavaScript test file** without explanations.

### **Input Test Steps:**
${testCases}

### **Expected Output Format:**
\`\`\`javascript
import { test, expect } from '@playwright/test';

const testData = [
  { email: 'test1@example.com', password: 'password123', expectedUrl: 'http://localhost:3000/home' },
  { email: 'test2@example.com', password: 'wrongpass', expectedError: 'Invalid email or password' }
];

test.describe('Login Tests', () => {
  testData.forEach(({ email, password, expectedUrl, expectedError }) => {
    test(\`Login Test - \${email}\`, async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      
      if (expectedUrl) {
        await expect(page).toHaveURL(expectedUrl);
      }
      if (expectedError) {
        await expect(page.locator('.error-message')).toHaveText(expectedError);
      }
    });
  });
});
\`\`\`
`;

    // Generate content using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    // Extract and clean the Playwright code
    const formattedTestCases = result.response
      .text()
      ?.replace(/```javascript|```/g, "")
      .trim();

    if (!formattedTestCases) {
      throw new Error("AI response did not contain valid test cases.");
    }

    // Save formatted test cases to a file
    fs.writeFileSync(outputJsFile, formattedTestCases);
    console.log(`✅ Playwright test cases saved in ${outputJsFile}`);
  } catch (error) {
    console.error("❌ Error generating Playwright test cases:", error);
  }
}

// Example usage
// jsonToTxt("test_cases.json", "output.txt");
// Example usage
convertToPlaywright("test_cases.txt", "playwright_tests2.js");

function jsonToTxt(inputFile, outputFile) {
  // Read the JSON file
  const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  let txtContent = "";

  // Convert JSON to formatted text
  jsonData.forEach((test, index) => {
    txtContent += `Test Case: ${test.testCase}\nSteps:\n`;

    test.steps.forEach((step, i) => {
      if (step.action === "navigate") {
        txtContent += `${i + 1}. Navigate to ${step.value}\n`;
      } else if (step.action === "fill") {
        txtContent += `${i + 1}. Fill ${step.selector} with \"${
          step.value
        }\"\n`;
      } else if (step.action === "click") {
        txtContent += `${i + 1}. Click ${step.selector}\n`;
      } else if (step.action === "waitForNavigation") {
        txtContent += `${i + 1}. Wait for navigation\n`;
      } else if (step.action === "waitForSelector") {
        txtContent += `${i + 1}. Wait for selector ${step.selector}\n`;
      }
    });

    txtContent += `Expected Result: ${test.expectedResult}\n\n`;
  });

  // Write to a text file
  fs.writeFileSync(outputFile, txtContent, "utf-8");
  console.log(`Converted JSON to TXT successfully: ${outputFile}`);
}