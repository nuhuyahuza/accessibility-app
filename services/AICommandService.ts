// services/AICommandService.ts
export interface CommandResult {
  action: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export class AICommandService {
  private static readonly commandPatterns = {
    // Document reading commands
    'read document': { action: 'scan_document', confidence: 0.9 },
    'scan document': { action: 'scan_document', confidence: 0.9 },
    'read text': { action: 'scan_document', confidence: 0.8 },
    'take picture': { action: 'scan_document', confidence: 0.8 },
    'capture text': { action: 'scan_document', confidence: 0.8 },
    
    // Navigation commands
    'go home': { action: 'navigate_home', confidence: 0.9 },
    'main menu': { action: 'navigate_home', confidence: 0.8 },
    'home screen': { action: 'navigate_home', confidence: 0.8 },
    
    // Help commands
    'help': { action: 'show_help', confidence: 0.9 },
    'what can you do': { action: 'show_help', confidence: 0.8 },
    'commands': { action: 'show_help', confidence: 0.8 },
    
    // Settings commands
    'settings': { action: 'open_settings', confidence: 0.9 },
    'preferences': { action: 'open_settings', confidence: 0.8 },
    
    // Library/History commands
    'history': { action: 'open_history', confidence: 0.9 },
    'library': { action: 'open_history', confidence: 0.9 },
    'recent scans': { action: 'open_history', confidence: 0.8 },
    'previous scans': { action: 'open_history', confidence: 0.8 },
    'saved documents': { action: 'open_history', confidence: 0.8 },
    
    // Voice control commands
    'stop talking': { action: 'stop_speech', confidence: 0.9 },
    'quiet': { action: 'stop_speech', confidence: 0.8 },
    'silence': { action: 'stop_speech', confidence: 0.8 },
    'repeat': { action: 'repeat_last', confidence: 0.9 },
    'say again': { action: 'repeat_last', confidence: 0.8 },
  };

  static processCommand(input: string): CommandResult | null {
    const normalizedInput = input.toLowerCase().trim();
    
    // Direct pattern matching
    for (const [pattern, result] of Object.entries(this.commandPatterns)) {
      if (normalizedInput.includes(pattern)) {
        return {
          action: result.action,
          confidence: result.confidence,
        };
      }
    }

    // Fuzzy matching for common variations
    const fuzzyMatches = this.findFuzzyMatches(normalizedInput);
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      return {
        action: bestMatch.action,
        confidence: bestMatch.confidence * 0.8, // Reduce confidence for fuzzy matches
      };
    }

    // If no match found, return null
    return null;
  }

  private static findFuzzyMatches(input: string): Array<{ action: string; confidence: number }> {
    const matches: Array<{ action: string; confidence: number }> = [];
    
    // Check for partial matches
    for (const [pattern, result] of Object.entries(this.commandPatterns)) {
      const words = pattern.split(' ');
      const inputWords = input.split(' ');
      
      let matchCount = 0;
      for (const word of words) {
        if (inputWords.some(inputWord => 
          this.levenshteinDistance(word, inputWord) <= 2
        )) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const confidence = (matchCount / words.length) * result.confidence;
        matches.push({
          action: result.action,
          confidence,
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
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
    return Object.keys(this.commandPatterns);
  }

  static getCommandHelp(): string {
    const commands = this.getAvailableCommands();
    const groupedCommands = {
      'Document Reading': commands.filter(cmd => cmd.includes('read') || cmd.includes('scan') || cmd.includes('capture')),
      'Navigation': commands.filter(cmd => cmd.includes('home') || cmd.includes('menu')),
      'Help': commands.filter(cmd => cmd.includes('help') || cmd.includes('commands')),
      'Settings': commands.filter(cmd => cmd.includes('settings') || cmd.includes('preferences')),
      'History': commands.filter(cmd => cmd.includes('history') || cmd.includes('recent')),
      'Voice Control': commands.filter(cmd => cmd.includes('stop') || cmd.includes('repeat')),
    };

    let helpText = "Here are the commands I understand:\n\n";
    
    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      if (categoryCommands.length > 0) {
        helpText += `${category}:\n`;
        categoryCommands.forEach(cmd => {
          helpText += `• "${cmd}"\n`;
        });
        helpText += "\n";
      }
    }

    return helpText;
  }
}
