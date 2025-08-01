// import axios from "axios";
// import Constants from "expo-constants";

// export const extractTextFromImage = async (
//   base64Image: string
// ): Promise<string> => {
//   const response = await axios.post(
//     `https://vision.googleapis.com/v1/images:annotate?key=${Constants.expoConfig?.extra?.GOOGLE_VISION_API_KEY}`,
//     {
//       requests: [
//         {
//           image: { content: base64Image },
//           features: [{ type: "TEXT_DETECTION" }],
//         },
//       ],
//     }
//   );

//   const annotations = response.data.responses[0]?.textAnnotations;
//   return annotations?.[0]?.description || "";
// };
