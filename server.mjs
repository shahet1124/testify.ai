import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec, spawn } from 'child_process';
import { Console } from "console";
// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { exec } = require("child_process");
// const { Console } = require("console");
import { fileURLToPath } from "url";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


const port = 3000;
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Ensure directories exist
const uploadDir = path.join(__dirname, "uploads");
const textDataDir = path.join(__dirname, "dataintext");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(textDataDir)) fs.mkdirSync(textDataDir);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Route to handle PDF upload, text extraction, and summarization
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
    console.log("🛠️ Received request:", req.body);
  
    const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;
  
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
  
    const pdfFilename = req.file.filename;
    const pdfFilePath = path.join(uploadDir, pdfFilename);
    const textFilePath = path.join(textDataDir, `${pdfFilename}.txt`);
    const summaryFilePath = path.join(textDataDir, "summary.txt");
  
    console.log("📂 Uploaded PDF File:", pdfFilePath);
  
    try {
      // Trigger text extraction
      console.log("🔍 Extracting text from PDF...");
      exec(`node extractText.js ${pdfFilename}`, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Text extraction failed:", err);
          return res.status(500).json({ error: "Failed to extract text from PDF" });
        }
        console.log("✅ Text extraction completed:", stdout);
  
        // Trigger summarization after text extraction
        console.log("📝 Starting summarization...");
        exec("node summarizeSRS.js", (err, stdout, stderr) => {
          if (err) {
            console.error("❌ Summarization failed:", err);
            console.error("stderr from summarizeSRS.js:", stderr); // Added stderr logging
            return res.status(500).json({ error: "Failed to summarize text" });
          }
          console.log("✅ Summarization completed:", stdout);
          if (stderr) {
            console.warn("⚠️ summarizeSRS.js produced stderr:", stderr); // Warn if stderr is present
          }
  
          // Send response only after summarization is complete
          res.json({
            message: "File uploaded, text extracted, and summarization completed",
            pdfPath: `/uploads/${pdfFilename}`,
            textFilePath: `/dataintext/${pdfFilename}.txt`,
            summaryFilePath: `/dataintext/summary.txt`
          });
        });
      });
    } catch (err) {
      res.status(500).json({ error: "Unexpected error occurred" });
    }
  });

  app.post("/execute-temp", (req, res) => {
    console.log("📥 Received /execute-temp request");
    console.log("🔍 Full Request Body:", JSON.stringify(req.body, null, 2));

    const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;

    if (!figmaToken || !figmaProjectUrl || !frontendUrl) {
        console.error("❌ Missing required parameters!", req.body);
        return res.status(400).json({ error: "Missing required parameters" });
    }

    // Create a detached process that will continue even if the server restarts
    const tempProcess = spawn('node', [
        'temp.mjs', 
        figmaToken,
        figmaProjectUrl,
        frontendUrl
    ], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Capture some initial output before we respond
    let stdoutChunks = [];
    let stderrChunks = [];
    
    tempProcess.stdout.on('data', (data) => {
        stdoutChunks.push(data.toString());
        console.log(`📋 Output: ${data.toString()}`);
    });
    
    tempProcess.stderr.on('data', (data) => {
        stderrChunks.push(data.toString());
        console.error(`❌ Error: ${data.toString()}`);
    });
    
    // Return quickly with a response indicating the process has started
    setTimeout(() => {
        // Unref the child process so the parent can exit independently
        tempProcess.unref();
        
        res.json({ 
            message: "Process started successfully", 
            initialOutput: stdoutChunks.join(''),
            initialError: stderrChunks.join('')
        });
    }, 1000); // Give it 1 second to capture initial output
});

//   app.post("/execute-temp", (req, res) => {
//     console.log("📥 Received /execute-temp request");
//     console.log("🔍 Full Request Body:", JSON.stringify(req.body, null, 2));

//     const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;

//     if (!figmaToken || !figmaProjectUrl || !frontendUrl) {
//         console.error("❌ Missing required parameters!", req.body);
//         return res.status(400).json({ error: "Missing required parameters" });
//     }

//     // Prepare the arguments, ensuring they're properly quoted
//     // Using arrays and JSON.stringify for proper escaping
//     const args = [
//         JSON.stringify(figmaToken),
//         JSON.stringify(figmaProjectUrl),
//         JSON.stringify(frontendUrl)
//     ].join(' ');
    
//     const command = `node temp.mjs ${args}`;
//     console.log("🚀 Executing command:", command);

//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             console.error("❌ Execution failed:", error.message);
//             console.error("⚠️ stderr:", stderr);
//             return res.status(500).json({ error: error.message, stderr, stdout });
//         }

//         console.log("✅ temp.js executed successfully:", stdout);
//         res.json({ message: "Executed successfully", output: stdout });
//     });
// });

//   app.post("/execute-temp", (req, res) => {
//     console.log("📥 Received /execute-temp request");
//     console.log("🔍 Full Request Body:", JSON.stringify(req.body, null, 2));

//     const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;

//     if (!figmaToken || !figmaProjectUrl || !frontendUrl) {
//         console.error("❌ Missing required parameters!", req.body);
//         return res.status(400).json({ error: "Missing required parameters" });
//     }

//     // Double-check parameter values
//     console.log("Token (first few chars):", figmaToken.substring(0, 5) + "...");
//     console.log("Project URL/ID:", figmaProjectUrl);
//     console.log("Frontend URL:", frontendUrl);

//     // Use child_process which you've already imported at the top
//     //import { spawn } from 'child_process';
//     // OR if you already have exec imported, use destructuring to add spawn:
//     // import { exec, spawn } from 'child_process';
    
//     console.log("🚀 Executing temp.js with parameters");
    
//     const process = spawn('node', [
//         'temp.js', 
//         figmaToken, 
//         figmaProjectUrl, 
//         frontendUrl
//     ]);
    
//     let stdout = '';
//     let stderr = '';
    
//     process.stdout.on('data', (data) => {
//         const output = data.toString();
//         stdout += output;
//         console.log(`📤 stdout: ${output}`);
//     });
    
//     process.stderr.on('data', (data) => {
//         const output = data.toString();
//         stderr += output;
//         console.error(`⚠️ stderr: ${output}`);
//     });
    
//     process.on('close', (code) => {
//         console.log(`🏁 Child process exited with code ${code}`);
        
//         if (code !== 0) {
//             return res.status(500).json({ 
//                 error: "Execution failed", 
//                 exitCode: code,
//                 stdout,
//                 stderr 
//             });
//         }
        
//         res.json({ 
//             message: "Executed successfully", 
//             output: stdout 
//         });
//     });
// });
  //   app.post("/execute-temp", (req, res) => {
//     console.log("📥 Received /execute-temp request");
//     console.log("🔍 Full Request Body:", JSON.stringify(req.body, null, 2)); // Debug full request

//     const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;

//     if (!figmaToken || !figmaProjectUrl || !frontendUrl) {
//         console.error("❌ Missing required parameters!", req.body);
//         return res.status(400).json({ error: "Missing required parameters" });
//     }

//     console.log("🚀 Executing temp.js with:", figmaToken, figmaProjectUrl, frontendUrl);
//     const command = `node temp.js '${figmaToken}' '${figmaProjectUrl}' '${frontendUrl}'`;

//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             console.error("❌ Execution failed:", error.message);
//             console.error("⚠️ stderr:", stderr);
//             return res.status(500).json({ error: error.message, stderr });
//         }

//         console.log("✅ temp.js executed successfully:", stdout);
//         res.json({ message: "Executed successfully", output: stdout });
//     });
// });


// Route to get the summarized text
app.get("/summary", (req, res) => {
  console.log("📥 Received summary request");

  if (!fs.existsSync(summaryFilePath)) {
    return res.status(404).json({ error: "Summary not found. Try again later." });
  }

  const summaryText = fs.readFileSync(summaryFilePath, "utf-8");
  res.json({ summary: summaryText });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
