// import Tesseract from 'tesseract.js';

// const extractTextFromImage = async (base64Image: string): Promise<string> => {
//   const { data: { text } } = await Tesseract.recognize(
//     `data:image/jpeg;base64,${base64Image}`,
//     'eng',
//     {
//       logger: m => console.log(m) // Progress logging
//     }
//   );
//   return text;
// };