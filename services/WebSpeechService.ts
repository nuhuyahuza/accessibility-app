// // src/services/WebSpeechService.ts

// // Declare the types for window.SpeechRecognition and window.webkitSpeechRecognition
// interface Window {
//   webkitSpeechRecognition: typeof SpeechRecognition;
//   SpeechRecognition: typeof SpeechRecognition;
// }

// // Fix missing type for SpeechRecognition
// declare let webkitSpeechRecognition: {
//   new (): SpeechRecognition;
// };

// declare let SpeechRecognition: {
//   new (): SpeechRecognition;
// };

// export class WebSpeechService {
//   static recognition: SpeechRecognition | null = null;

//   static startListening(
//     onResult: (text: string) => void,
//     onEnd?: () => void,
//     onError?: () => void
//   ) {
//     const RecognitionConstructor =
//       (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

//     if (!RecognitionConstructor) {
//       console.error('SpeechRecognition is not supported in this browser.');
//       onError?.();
//       return;
//     }

//     const recognition = new RecognitionConstructor();
//     recognition.continuous = false;
//     recognition.lang = 'en-US';
//     recognition.interimResults = false;

//     recognition.onresult = (event: SpeechRecognitionEvent) => {
//       const transcript = event.results[0][0].transcript;
//       onResult(transcript);
//     };

//     recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
//       console.error('Speech recognition error:', e);
//       onError?.();
//     };

//     recognition.onend = () => {
//       onEnd?.();
//     };

//     recognition.start();
//     this.recognition = recognition;
//   }

//   static stopListening() {
//     if (this.recognition) {
//       this.recognition.stop();
//       this.recognition = null;
//     }
//   }
// }
