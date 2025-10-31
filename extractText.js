// const pdfParse = require("pdf-parse");
// const fs = require("fs");
// const path = require("path");

// const uploadDir = path.join(__dirname, "../NODE_BACKEND/uploads");
// const textDataDir = path.join(__dirname, "../NODE_BACKEND/dataintext");

// if (!fs.existsSync(textDataDir)) {
//    fs.mkdirSync(textDataDir, { recursive: true });
// }

// const extractTextFromStoredPDF = async (pdfFilename) => {
//    const pdfFilePath = path.join(uploadDir, pdfFilename);
//    const textFilePath = path.join(textDataDir, "extracted_text.txt");

//    try {
//       if (!fs.existsSync(pdfFilePath)) {
//          console.error(`❌ PDF file not found: ${pdfFilePath}`);
//          return;
//       }

//       const pdfBuffer = fs.readFileSync(pdfFilePath);
//       const pdfData = await pdfParse(pdfBuffer);

//       console.log(`📄 Extracted text from ${pdfFilename}:`);
//       console.log(pdfData.text);

//       fs.writeFileSync(textFilePath, pdfData.text, "utf-8");
//       console.log(`✅ Extracted text saved to: ${textFilePath}`);
//    } catch (err) {
//       console.error(`❌ Error extracting text from ${pdfFilename}:`, err);
//    }
// };

// const pdfFilename = process.argv[2]; 
// if (!pdfFilename) {
//    console.error("❌ No filename provided!");
//    process.exit(1);
// }

// extractTextFromStoredPDF(pdfFilename);

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

// Paths
const uploadDir = path.join(__dirname, "./uploads");
const textDataDir = path.join(__dirname, "./dataintext");

// Ensure the 'dataintext' directory exists
if (!fs.existsSync(textDataDir)) {
   fs.mkdirSync(textDataDir, { recursive: true });
}

// Function to extract text from a stored PDF
const extractTextFromStoredPDF = async (pdfFilename) => {
   const pdfFilePath = path.join(uploadDir, pdfFilename);
   const textFilePath = path.join(textDataDir, "extracted_text.txt");

   try {
      if (!fs.existsSync(pdfFilePath)) {
         console.error(`❌ PDF file not found: ${pdfFilePath}`);
         return;
      }

      // Read and parse the PDF
      const pdfBuffer = fs.readFileSync(pdfFilePath);
      const pdfData = await pdfParse(pdfBuffer);

      console.log(`📄 Extracted text from ${pdfFilename}:`);
      console.log(pdfData.text);

      // Save the extracted text to a file
      fs.writeFileSync(textFilePath, pdfData.text, "utf-8");
      console.log(`✅ Extracted text saved to: ${textFilePath}`);
   } catch (err) {
      console.error(`❌ Error extracting text from ${pdfFilename}:`, err);
   }
};
const pdfFilename = process.argv[2]; // Get the filename from CLI argument
if (!pdfFilename) {
   console.error("❌ No filename provided!");
   process.exit(1);
}
extractTextFromStoredPDF(pdfFilename);
