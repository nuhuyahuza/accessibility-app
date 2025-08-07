import { Contact } from '@/types';
import * as Contacts from 'expo-contacts';

export class ContactService {
  private static contacts: Contact[] = [];
  private static pendingCall: Contact | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        await this.loadContacts();
        this.isInitialized = true;
      } else {
        console.warn('Contacts permission not granted');
        // Use mock contacts for demo
        this.loadMockContacts();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing contacts:', error);
      this.loadMockContacts();
      this.isInitialized = true;
    }
  }

  private static async loadContacts(): Promise<void> {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      this.contacts = data
        .filter(contact => 
          contact.name && 
          contact.phoneNumbers && 
          contact.phoneNumbers.length > 0
        )
        .map(contact => ({
          id: contact.id || Math.random().toString(),
          name: contact.name || 'Unknown',
          phoneNumber: contact.phoneNumbers![0].number || '',
          email: contact.emails?.[0]?.email,
        }))
        .slice(0, 50); // Limit to first 50 contacts for performance

      console.log(`Loaded ${this.contacts.length} contacts`);
    } catch (error) {
      console.error('Error loading contacts:', error);
      this.loadMockContacts();
    }
  }

  private static loadMockContacts(): void {
    this.contacts = [
      {
        id: '1',
        name: 'John Smith',
        phoneNumber: '+1234567890',
        email: 'john.smith@email.com'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        phoneNumber: '+1987654321',
        email: 'sarah.johnson@email.com'
      },
      {
        id: '3',
        name: 'Mike Davis',
        phoneNumber: '+1122334455',
        email: 'mike.davis@email.com'
      },
      {
        id: '4',
        name: 'Emily Wilson',
        phoneNumber: '+1555666777',
        email: 'emily.wilson@email.com'
      },
      {
        id: '5',
        name: 'David Brown',
        phoneNumber: '+1777888999',
        email: 'david.brown@email.com'
      },
      {
        id: '6',
        name: 'Lisa Anderson',
        phoneNumber: '+1999000111',
        email: 'lisa.anderson@email.com'
      },
      {
        id: '7',
        name: 'Simon Taylor',
        phoneNumber: '+1444555666',
        email: 'simon.taylor@email.com'
      },
      {
        id: '8',
        name: 'Anna Martinez',
        phoneNumber: '+1333444555',
        email: 'anna.martinez@email.com'
      }
    ];
  }

  static async getContacts(): Promise<Contact[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return [...this.contacts];
  }

  static async findContactByName(name: string): Promise<Contact | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const searchTerm = name.toLowerCase().trim();
    
    // Exact match first
    let contact = this.contacts.find(c => 
      c.name.toLowerCase() === searchTerm
    );
    
    if (contact) return contact;

    // Partial match
    contact = this.contacts.find(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(c.name.toLowerCase())
    );
    
    if (contact) return contact;

    // Fuzzy match (for voice recognition errors)
    contact = this.contacts.find(c => 
      this.calculateSimilarity(c.name.toLowerCase(), searchTerm) > 0.6
    );
    
    return contact || null;
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

  static setPendingCall(contact: Contact): void {
    this.pendingCall = contact;
  }

  static getPendingCall(): Contact | null {
    return this.pendingCall;
  }

  static clearPendingCall(): void {
    this.pendingCall = null;
  }

  static async searchContacts(query: string): Promise<Contact[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const searchTerm = query.toLowerCase().trim();
    
    return this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.phoneNumber.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm))
    );
  }

  static async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const newContact: Contact = {
      ...contact,
      id: Math.random().toString(36).substring(7)
    };
    
    this.contacts.push(newContact);
    return newContact;
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const index = this.contacts.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    this.contacts[index] = { ...this.contacts[index], ...updates };
    return this.contacts[index];
  }

  static async deleteContact(id: string): Promise<boolean> {
    const index = this.contacts.findIndex(c => c.id === id);
    
    if (index === -1) return false;
    
    this.contacts.splice(index, 1);
    return true;
  }

  static getContactsCount(): number {
    return this.contacts.length;
  }

  static async refreshContacts(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}