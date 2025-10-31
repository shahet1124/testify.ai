const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse"); // Import pdf-parse

// Multer Setup for File Uploads
const storage = multer.diskStorage({
   destination: "./uploads/", // where to store uploaded files
   filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // naming convention for uploaded files
   },
});

const upload = multer({ storage });

// Define the text file path where extracted text will be saved
const textDataFolder = path.join(__dirname, "../dataintext");
if (!fs.existsSync(textDataFolder)) {
   fs.mkdirSync(textDataFolder, { recursive: true });
}

const textFilePath = path.join(textDataFolder, "extracted_text.txt");

router.post("/upload", upload.single("pdfFile"), async (req, res) => {
   console.log("🔹 Received Body:", req.body);
   console.log("🔹 Received File:", req.file);

   if (!req.file) {
      return res.status(400).json({ error: "PDF file is missing" });
   }

   // Validate required fields
   if (!req.body.figmaToken || !req.body.figmaProjectUrl || !req.body.frontendUrl) {
      return res.status(400).json({ error: "Figma token, project URL, and frontend URL are required" });
   }

   const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;
   const pdfFilePath = req.file.filename; // The uploaded file's name
   const pdfFileFullPath = path.join(__dirname, "../uploads", pdfFilePath);

   try {
      // Read the uploaded PDF file
      const pdfBuffer = fs.readFileSync(pdfFileFullPath);
      const pdfData = await pdfParse(pdfBuffer);

      console.log("📄 PDF Content:");
      console.log(pdfData.text); // Logs the extracted text from PDF

      // Write the extracted text to a file (if you want to save it as .txt)
      fs.writeFileSync(textFilePath, pdfData.text, { flag: "w" });

      // Respond with the extracted text
      res.json({
         message: "File uploaded and text extracted successfully",
         extractedText: pdfData.text, // Return extracted text from PDF
         fileUrl: `/uploads/${pdfFilePath}`, // URL to access uploaded PDF
         textFileUrl: `/dataintext/extracted_text.txt`, // URL to the extracted text file
      });
   } catch (err) {
      console.error("❌ Error reading PDF:", err);
      return res.status(500).json({ error: "Failed to read PDF file" });
   }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const pdfParse = require("pdf-parse"); // Import pdf-parse
// const db = require("../db");

// // Multer Setup for File Uploads
// const storage = multer.diskStorage({
//    destination: "./uploads/",
//    filename: (req, file, cb) => {
//       cb(null, Date.now() + path.extname(file.originalname));
//    },
// });
// const upload = multer({ storage });

// // Ensure dataintext folder exists
// const textDataFolder = path.join(__dirname, "../dataintext");
// if (!fs.existsSync(textDataFolder)) {
//    fs.mkdirSync(textDataFolder, { recursive: true });
// }

// // Define text file path
// const textFilePath = path.join(textDataFolder, "extracted_text.txt");

// router.post("/upload", upload.single("pdfFile"), async (req, res) => {
//    console.log("🔹 Received Body:", req.body);
//    console.log("🔹 Received File:", req.file);

//    if (!req.file) {
//       return res.status(400).json({ error: "PDF file is missing" });
//    }
//    if (!req.body.figmaToken || !req.body.figmaProjectUrl || !req.body.frontendUrl) {
//       return res.status(400).json({ error: "Figma token and project URL are required" });
//    }

//    const { figmaToken, figmaProjectUrl, frontendUrl } = req.body;
//    const pdfFilePath = req.file.filename;
//    const pdfFileFullPath = path.join(__dirname, "../uploads", pdfFilePath);

//    try {
//       // Read PDF file
//       const pdfBuffer = fs.readFileSync(pdfFileFullPath);
//       const pdfData = await pdfParse(pdfBuffer);

//       console.log("📄 PDF Content:");
//       console.log(pdfData.text); // Logs the extracted text from PDF

//       // Write/Update extracted text to file
//       fs.writeFileSync(textFilePath, pdfData.text, { flag: "w" });

//       // SQL Insert Query
//       const sql = "INSERT INTO uploads (figmaToken, figmaProjectUrl, pdfFile, frontendUrl) VALUES (?, ?, ?, ?)";
//       db.query(sql, [figmaToken, figmaProjectUrl, pdfFilePath, frontendUrl], (err, result) => {
//          if (err) return res.status(500).json({ error: err.message });

//          res.json({
//             message: "File uploaded successfully",
//             fileUrl: `/uploads/${pdfFilePath}`,
//             textFileUrl: `/dataintext/extracted_text.txt`,
//             pdfText: pdfData.text, // Returning extracted text as well
//          });
//       });
//    } catch (err) {
//       console.error("❌ Error reading PDF:", err);
//       return res.status(500).json({ error: "Failed to read PDF file" });
//    }
// });

// module.exports = router;