// src/screens/ContactScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
	Animated,
	Dimensions,
	Modal,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { AccessibleButton } from '../components/AccessibleButton';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useVoice } from '../contexts/VoiceContext';
import { ContactService } from '../services/ContactService';
import { TTSService } from '../services/TTSService';
import { Contact } from '../types';

const { width } = Dimensions.get('window');

const ContactScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setCurrentScreen, isListening } = useAccessibility();
  const { startListening, stopListening } = useVoice();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const modalAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setCurrentScreen('Contacts');
    loadContacts();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [setCurrentScreen, fadeAnim, slideAnim]);

  useEffect(() => {
    // Filter contacts based on search query
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumber.includes(searchQuery)
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      await ContactService.initialize();
      const contactList = await ContactService.getContacts();
      setContacts(contactList);
      setFilteredContacts(contactList);
      
      TTSService.speak(`Contacts loaded. Found ${contactList.length} contacts. You can search by name or use voice commands to call someone.`);
    } catch (error) {
      console.error('Error loading contacts:', error);
      TTSService.speak('Error loading contacts. Using sample contacts instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() !== '') {
      TTSService.speak(`Searching for ${text}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    TTSService.speak('Search cleared, showing all contacts');
  };

  const handleCallContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowCallModal(true);
    
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    TTSService.speak(`Calling ${contact.name}. Confirm to dial ${contact.phoneNumber}, or cancel to go back.`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const confirmCall = async () => {
    if (selectedContact) {
      try {
        const phoneUrl = `tel:${selectedContact.phoneNumber}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        
        if (canOpen) {
          TTSService.speak(`Calling ${selectedContact.name} now.`);
          await Linking.openURL(phoneUrl);
          closeCallModal();
        } else {
          TTSService.speak('Unable to make phone calls on this device.');
        }
      } catch (error) {
        TTSService.speak('Error making the call. Please try again.');
      }
    }
  };

  const closeCallModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCallModal(false);
      setSelectedContact(null);
    });
  };

  const cancelCall = () => {
    TTSService.speak('Call cancelled.');
    closeCallModal();
  };

  const readContactList = () => {
    if (filteredContacts.length === 0) {
      TTSService.speak('No contacts to read.');
      return;
    }

    const contactList = filteredContacts
      .slice(0, 10) // Limit to first 10 to avoid very long speech
      .map(contact => `${contact.name}, ${contact.phoneNumber}`)
      .join('. ');
    
    const message = filteredContacts.length > 10 
      ? `Reading first 10 of ${filteredContacts.length} contacts. ${contactList}. Say "Call" followed by a name to make a call.`
      : `Reading all ${filteredContacts.length} contacts. ${contactList}. Say "Call" followed by a name to make a call.`;
    
    TTSService.speak(message);
  };

  const handleGoHome = () => {
    navigation.navigate('Home' as never);
  };

  const renderContactCard = (contact: Contact, index: number) => (
    <Animated.View
      key={contact.id}
      style={[
        styles.contactCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, index * 5],
            })
          }]
        }
      ]}
    >
      <BlurView intensity={40} tint="dark" style={styles.contactCardBlur}>
        <View style={styles.contactInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
            {contact.email && (
              <Text style={styles.contactEmail}>{contact.email}</Text>
            )}
          </View>
          
          <AccessibleButton
            title="📞 Call"
            onPress={() => handleCallContact(contact)}
            description={`Call ${contact.name} at ${contact.phoneNumber}`}
            variant="success"
            size="small"
            style={styles.callButton}
          />
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <BlurView intensity={20} tint="light" style={styles.header}>
            <Text style={styles.title}>📞 Contacts</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading contacts...' : `${filteredContacts.length} contacts available`}
            </Text>
          </BlurView>

          {/* Search Section */}
          <BlurView intensity={40} tint="dark" style={styles.searchSection}>
            <Text style={styles.searchLabel}>🔍 Search Contacts</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter name or phone number..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
                accessible={true}
                accessibilityLabel="Search contacts"
                accessibilityHint="Type to search through your contacts"
              />
              {searchQuery.length > 0 && (
                <AccessibleButton
                  title="✕"
                  onPress={clearSearch}
                  description="Clear search"
                  variant="danger"
                  size="small"
                  style={styles.clearButton}
                />
              )}
            </View>
            
            <AccessibleButton
              title="🔊 Read Contact List"
              onPress={readContactList}
              description="Listen to the list of contacts"
              variant="warning"
              size="small"
              style={styles.readButton}
            />
          </BlurView>

          {/* Contacts List */}
          <View style={styles.contactsSection}>
            <Text style={styles.sectionTitle}>
              👥 {searchQuery ? `Search Results (${filteredContacts.length})` : `All Contacts (${filteredContacts.length})`}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            ) : filteredContacts.length === 0 ? (
              <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? '🔍 No contacts match your search' : '📱 No contacts found'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try a different search term' : 'Add contacts to your device to see them here'}
                </Text>
              </BlurView>
            ) : (
              <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
                {filteredContacts.map((contact, index) => renderContactCard(contact, index))}
              </ScrollView>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <AccessibleButton
              title="🏠 Home"
              onPress={handleGoHome}
              description="Return to the main home screen"
              variant="primary"
              size="medium"
            />
            
            <AccessibleButton
              title={isListening ? "🛑 Stop Listening" : "🎤 Voice Commands"}
              onPress={isListening ? stopListening : startListening}
              description={isListening ? "Stop voice recognition" : "Start listening for voice commands like 'Call John'"}
              variant={isListening ? "danger" : "warning"}
              size="medium"
            />
          </View>
        </Animated.View>

        {/* Call Confirmation Modal */}
        <Modal
          visible={showCallModal}
          transparent={true}
          animationType="none"
          onRequestClose={cancelCall}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  opacity: modalAnim,
                  transform: [{
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
                <Text style={styles.modalTitle}>📞 Confirm Call</Text>
                
                {selectedContact && (
                  <View style={styles.modalContactInfo}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.modalContactName}>{selectedContact.name}</Text>
                    <Text style={styles.modalContactPhone}>{selectedContact.phoneNumber}</Text>
                  </View>
                )}
                
                <View style={styles.modalButtons}>
                  <AccessibleButton
                    title="❌ Cancel"
                    onPress={cancelCall}
                    description="Cancel the call and go back"
                    variant="secondary"
                    size="large"
                    style={styles.modalButton}
                  />
                  
                  <AccessibleButton
                    title="📞 Call Now"
                    onPress={confirmCall}
                    description={`Confirm and dial ${selectedContact?.name}`}
                    variant="success"
                    size="large"
                    style={styles.modalButton}
                  />
                </View>
              </BlurView>
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    marginTop: 10,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchSection: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  clearButton: {
    minWidth: 40,
  },
  readButton: {
    alignSelf: 'stretch',
  },
  contactsSection: {
    flex: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  contactsList: {
    flex: 1,
  },
  contactCard: {
    marginBottom: 10,
  },
  contactCardBlur: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#4ecdc4',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#cccccc',
  },
  callButton: {
    minWidth: 80,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 25,
    overflow: 'hidden',
  },
  modalBlur: {
    padding: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalContactInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContactName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalContactPhone: {
    fontSize: 18,
    color: '#4ecdc4',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ContactScreen;