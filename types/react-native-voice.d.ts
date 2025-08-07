declare module 'react-native-voice' {
  import { EmitterSubscription } from 'react-native';

  export default class Voice {
    static onSpeechStart: (e: any) => void;
    static onSpeechEnd: (e: any) => void;
    static onSpeechResults: (e: { value: string[] }) => void;
    static onSpeechError: (e: any) => void;

    static isAvailable(): Promise<boolean>;
    static start(locale: string): Promise<void>;
    static stop(): Promise<void>;
    static cancel(): Promise<void>;
    static destroy(): Promise<void>;

    static removeAllListeners(): void;
    static addListener(event: string, callback: (...args: any[]) => void): EmitterSubscription;
  }
}
