import { TTSService } from './TTSServices';
import * as Haptics from 'expo-haptics';

export type CommandType = 'playback' | 'navigation' | 'control';

export interface VoiceCommand {
  patterns: string[];
  action: string;
  type: CommandType;
  priority: number;
}

export class GlobalVoiceCommandService {
  private static navigation: any = null;
  private static currentPlaybackState: 'playing' | 'paused' | 'stopped' = 'stopped';
  private static onPlaybackCommand?: (command: string) => void;
  private static onNavigationCommand?: (command: string) => void;

  private static commands: VoiceCommand[] = [
    {
      patterns: ['stop', 'stop reading', 'stop talking', 'quiet'],
      action: 'stop',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['pause', 'hold', 'wait'],
      action: 'pause',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['continue', 'resume', 'go on', 'keep going'],
      action: 'resume',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['repeat', 'again', 'read again', 'say again'],
      action: 'repeat',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['faster', 'speed up', 'read faster'],
      action: 'faster',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['slower', 'slow down', 'read slower'],
      action: 'slower',
      type: 'playback',
      priority: 1,
    },
    {
      patterns: ['save', 'save this', 'save document'],
      action: 'save',
      type: 'control',
      priority: 2,
    },
    {
      patterns: ['go home', 'home', 'main menu', 'home screen'],
      action: 'navigate_home',
      type: 'navigation',
      priority: 3,
    },
    {
      patterns: ['scan', 'scan document', 'take photo', 'capture', 'new scan'],
      action: 'navigate_scan',
      type: 'navigation',
      priority: 3,
    },
    {
      patterns: ['library', 'saved documents', 'my documents', 'show library'],
      action: 'navigate_library',
      type: 'navigation',
      priority: 3,
    },
    {
      patterns: ['settings', 'preferences', 'options'],
      action: 'navigate_settings',
      type: 'navigation',
      priority: 3,
    },
    {
      patterns: ['history', 'show history', 'recent scans'],
      action: 'navigate_history',
      type: 'navigation',
      priority: 3,
    },
    {
      patterns: ['help', 'what can you do', 'commands', 'instructions'],
      action: 'help',
      type: 'control',
      priority: 2,
    },
    {
      patterns: ['close', 'back', 'go back'],
      action: 'back',
      type: 'navigation',
      priority: 2,
    },
  ];

  static initialize(
    navigation: any,
    onPlaybackCommand?: (command: string) => void,
    onNavigationCommand?: (command: string) => void
  ) {
    this.navigation = navigation;
    this.onPlaybackCommand = onPlaybackCommand;
    this.onNavigationCommand = onNavigationCommand;
  }

  static setPlaybackState(state: 'playing' | 'paused' | 'stopped') {
    this.currentPlaybackState = state;
  }

  static async processCommand(commandText: string): Promise<boolean> {
    const lowerCommand = commandText.toLowerCase().trim();
    console.log('Processing global command:', lowerCommand);

    const matchedCommand = this.findMatchingCommand(lowerCommand);
    
    if (!matchedCommand) {
      TTSService.speak(`I didn't understand "${commandText}". Say Help for available commands.`);
      return false;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (matchedCommand.type === 'playback' && this.currentPlaybackState !== 'stopped') {
      return this.handlePlaybackCommand(matchedCommand.action);
    }

    if (matchedCommand.type === 'navigation') {
      return this.handleNavigationCommand(matchedCommand.action);
    }

    if (matchedCommand.type === 'control') {
      return this.handleControlCommand(matchedCommand.action);
    }

    return false;
  }

  private static findMatchingCommand(text: string): VoiceCommand | null {
    const matches = this.commands.filter(cmd =>
      cmd.patterns.some(pattern => 
        text.includes(pattern) || 
        this.calculateSimilarity(text, pattern) > 0.7
      )
    );

    if (matches.length === 0) return null;

    matches.sort((a, b) => a.priority - b.priority);
    
    return matches[0];
  }

  private static handlePlaybackCommand(action: string): boolean {
    console.log('Playback command:', action);
    
    if (this.onPlaybackCommand) {
      this.onPlaybackCommand(action);
      return true;
    }

    switch (action) {
      case 'stop':
        TTSService.stop();
        TTSService.speak('Stopped');
        this.currentPlaybackState = 'stopped';
        return true;
      
      case 'pause':
        TTSService.pause();
        TTSService.speak('Paused');
        this.currentPlaybackState = 'paused';
        return true;
      
      case 'resume':
        TTSService.resume();
        this.currentPlaybackState = 'playing';
        return true;
      
      case 'repeat':
        TTSService.repeatLast();
        this.currentPlaybackState = 'playing';
        return true;
      
      default:
        return false;
    }
  }

  private static handleNavigationCommand(action: string): boolean {
    console.log('Navigation command:', action);

    if (this.onNavigationCommand) {
      this.onNavigationCommand(action);
    }

    if (!this.navigation) {
      console.warn('Navigation not initialized');
      return false;
    }

    switch (action) {
      case 'navigate_home':
        TTSService.speak('Going to home screen');
        this.navigation.navigate('index');
        return true;
      
      case 'navigate_scan':
        TTSService.speak('Opening scanner');
        this.navigation.navigate('scan');
        return true;
      
      case 'navigate_library':
        TTSService.speak('Opening library');
        this.navigation.navigate('library');
        return true;
      
      case 'navigate_settings':
        TTSService.speak('Opening settings');
        this.navigation.navigate('settings');
        return true;
      
      case 'navigate_history':
        TTSService.speak('Opening history');
        this.navigation.navigate('history');
        return true;
      
      case 'back':
        TTSService.speak('Going back');
        this.navigation.goBack();
        return true;
      
      default:
        return false;
    }
  }

  private static handleControlCommand(action: string): boolean {
    switch (action) {
      case 'help':
        this.speakHelp();
        return true;
      
      case 'save':
        TTSService.speak('Saving document');
        return true;
      
      default:
        return false;
    }
  }

  private static speakHelp() {
    const helpText = `Available commands: 
    While reading, say Pause, Stop, Resume, Repeat, Faster, or Slower. 
    Anytime, say Go Home, Scan Document, Library, Settings, or Help.`;
    TTSService.speak(helpText);
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  static getAvailableCommands(): string[] {
    return this.commands.map(cmd => cmd.patterns[0]);
  }
}

