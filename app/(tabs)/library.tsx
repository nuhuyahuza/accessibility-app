import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	Alert,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

interface SavedText {
  id: string;
  text: string;
  timestamp: number;
  title: string;
}

export default function LibraryScreen() {
  const router = useRouter();
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTexts, setFilteredTexts] = useState<SavedText[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  useEffect(() => {
    loadSavedTexts();
  }, []);

  useEffect(() => {
    filterTexts();
  }, [searchQuery, savedTexts, sortBy]);

  const loadSavedTexts = async () => {
    try {
      const savedData = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json'
      ).catch(() => '[]');
      const texts = JSON.parse(savedData);
      setSavedTexts(texts);
    } catch (error) {
      console.log('Error loading saved texts:', error);
    }
  };

  const filterTexts = () => {
    let filtered = savedTexts.filter(
      (text) =>
        text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        text.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort texts
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.timestamp - a.timestamp;
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredTexts(filtered);
  };

  const deleteSavedText = async (id: string) => {
    Alert.alert(
      'Delete Text',
      'Are you sure you want to delete this saved text?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedTexts = savedTexts.filter((text) => text.id !== id);
            setSavedTexts(updatedTexts);

            try {
              await FileSystem.writeAsStringAsync(
                FileSystem.documentDirectory + 'saved_texts.json',
                JSON.stringify(updatedTexts)
              );
            } catch (error) {
              console.log('Error deleting saved text:', error);
            }
          },
        },
      ]
    );
  };

  const openText = (savedText: SavedText) => {
    router.push({
      pathname: '/(tabs)/processing',
      params: { 
        savedText: JSON.stringify(savedText),
        fromLibrary: 'true'
      },
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <Text style={styles.headerSubtitle}>
          {savedTexts.length} saved {savedTexts.length === 1 ? 'text' : 'texts'}
        </Text>
      </View>

      {/* Search and Sort */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search texts..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Ionicons name="time-outline" size={16} color={sortBy === 'date' ? 'white' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'date' && styles.sortTextActive]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
            onPress={() => setSortBy('title')}
          >
            <Ionicons name="text-outline" size={16} color={sortBy === 'title' ? 'white' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'title' && styles.sortTextActive]}>
              Title
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTexts.length > 0 ? (
          <View style={styles.textsList}>
            {filteredTexts.map((savedText) => (
              <TouchableOpacity
                key={savedText.id}
                style={styles.textItem}
                onPress={() => openText(savedText)}
              >
                <View style={styles.textContent}>
                  <Text style={styles.textTitle}>{savedText.title}</Text>
                  <Text style={styles.textPreview} numberOfLines={2}>
                    {savedText.text}
                  </Text>
                  <Text style={styles.textDate}>
                    {formatDate(savedText.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSavedText(savedText.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching with different keywords
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="library-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No saved texts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your saved texts will appear here
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <Text style={styles.emptyButtonText}>Start Scanning</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 6,
  },
  sortButtonActive: {
    backgroundColor: '#667eea',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  sortTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  textsList: {
    padding: 20,
  },
  textItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textContent: {
    flex: 1,
    padding: 16,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  textPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  textDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }

});