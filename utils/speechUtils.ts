import * as Speech from 'expo-speech';

export const speak = (
  text: string,
  pitch: number = 1.0,
  rate: number = 1.0,
  language: string = 'en-US'
) => {
  Speech.speak(text, {
    pitch,
    rate,
    language,
  });
};
