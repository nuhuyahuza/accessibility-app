import Constants from "expo-constants";

const extractTextFromImage = async (
  base64Image: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(10);

    // OCR.space API endpoint
    const apiUrl =
      Constants.expoConfig?.extra?.OCR_API_URL ||
      "https://api.ocr.space/parse/image";

    // Your free API key (get from https://ocr.space/ocrapi)
    const apiKey = Constants.expoConfig?.extra?.OCR_API_KEY; // Replace with your actual API key

    onProgress?.(20);

    // Prepare form data
    const formData = new FormData();

    // Add base64 image (ensure it has the proper data URL format)
    const base64Data = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    formData.append("base64Image", base64Data);
    formData.append("language", "eng"); // English
    formData.append("isOverlayRequired", "false"); // Set to 'true' if you need word coordinates
    formData.append("detectOrientation", "false"); // Set to 'true' if you need orientation detection
    formData.append("scale", "true"); // Better accuracy for small text
    formData.append("OCREngine", "2"); // Engine 2 is better for general text recognition
    formData.append("filetype", "JPG"); // Specify file type explicitly

    onProgress?.(40);

    // Make the API call
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apikey: apiKey, // API key goes in header
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    onProgress?.(70);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    onProgress?.(90);

    // Check for API-level errors
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "OCR processing failed");
    }

    // Extract text from parsed results
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const parsedResult = result.ParsedResults[0];

      // Check individual result status
      if (parsedResult.FileParseExitCode === 1) {
        onProgress?.(100);
        return parsedResult.ParsedText || "";
      } else {
        throw new Error(parsedResult.ErrorMessage || "Failed to parse image");
      }
    }

    throw new Error("No text found in image");
  } catch (error: any) {
    console.error("OCR Error:", error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

// // Enhanced version with more options
// const extractTextFromImageAdvanced = async (
//   base64Image: string,
//   options: {
//     language?: string;
//     detectOrientation?: boolean;
//     isOverlayRequired?: boolean;
//     ocrEngine?: 1 | 2;
//     scale?: boolean;
//     isTable?: boolean;
//   } = {},
//   onProgress?: (progress: number) => void
// ): Promise<{
//   text: string;
//   confidence?: number;
//   orientation?: number;
//   overlay?: any; // Word coordinates if isOverlayRequired is true
// }> => {
//   try {
//     onProgress?.(10);

//     const apiUrl = "https://api.ocr.space/parse/image";
//     const apiKey = Constants?.expoConfig?.extra?.OCR_API_KEY, // Get from ocr.space

//     onProgress?.(20);

//     const formData = new FormData();

//     // Ensure base64 has proper format
//     const base64Data = base64Image.startsWith("data:")
//       ? base64Image
//       : `data:image/jpeg;base64,${base64Image}`;

//     formData.append("base64Image", base64Data);
//     formData.append("language", options.language || "eng");
//     formData.append(
//       "isOverlayRequired",
//       String(options.isOverlayRequired || false)
//     );
//     formData.append(
//       "detectOrientation",
//       String(options.detectOrientation || false)
//     );
//     formData.append("scale", String(options.scale !== false)); // Default true
//     formData.append("OCREngine", String(options.ocrEngine || 2));
//     formData.append("filetype", "JPG");

//     if (options.isTable) {
//       formData.append("isTable", "true");
//     }

//     onProgress?.(40);

//     const response = await fetch(apiUrl, {
//       method: "POST",
//       headers: {
//         apikey: apiKey,
//         "Content-Type": "multipart/form-data",
//       },
//       body: formData,
//     });

//     onProgress?.(70);

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();

//     onProgress?.(90);

//     if (result.IsErroredOnProcessing) {
//       throw new Error(result.ErrorMessage || "OCR processing failed");
//     }

//     if (result.ParsedResults && result.ParsedResults.length > 0) {
//       const parsedResult = result.ParsedResults[0];

//       if (parsedResult.FileParseExitCode === 1) {
//         onProgress?.(100);

//         return {
//           text: parsedResult.ParsedText || "",
//           orientation: parsedResult.TextOrientation || 0,
//           overlay: parsedResult.TextOverlay || null,
//         };
//       } else {
//         throw new Error(parsedResult.ErrorMessage || "Failed to parse image");
//       }
//     }

//     throw new Error("No text found in image");
//   } catch (error) {
//     console.error("OCR Error:", error);
//     throw new Error(`Failed to extract text from image: ${error.message}`);
//   }
// };

// Usage examples:
const handleBasicOCR = async (base64Image: string) => {
  try {
    const text = await extractTextFromImage(base64Image, (progress) => {
      console.log(`OCR Progress: ${progress}%`);
    });
    console.log("Extracted text:", text);
  } catch (error: any) {
    console.error("Error:", error.message);
  }
};

// const handleAdvancedOCR = async (base64Image: string) => {
//   try {
//     const result = await extractTextFromImageAdvanced(
//       base64Image,
//       {
//         language: "eng",
//         detectOrientation: true,
//         isOverlayRequired: true, // Get word coordinates
//         ocrEngine: 2, // Use engine 2 for better accuracy
//         scale: true,
//         isTable: false, // Set to true for table recognition
//       },
//       (progress) => {
//         console.log(`OCR Progress: ${progress}%`);
//       }
//     );

//     console.log("Extracted text:", result.text);
//     console.log("Text orientation:", result.orientation);
//     if (result.overlay) {
//       console.log("Word coordinates available");
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//   }
// };

export { extractTextFromImage };
