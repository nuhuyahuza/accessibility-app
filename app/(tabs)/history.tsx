import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	Alert,
	RefreshControl,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

interface HistoryItem {
  id: string;
  type: 'document' | 'qr' | 'barcode' | 'voice';
  title: string;
  preview: string;
  timestamp: number;
  status: 'success' | 'processing' | 'failed';
  extractedText?: string;
  confidence?: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'document' | 'qr' | 'voice'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Mock history data - replace with actual data loading
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          type: 'document',
          title: 'Business Contract',
          preview: 'This agreement is made between parties...',
          timestamp: Date.now() - 3600000,
          status: 'success',
          extractedText: 'Full contract text here...',
          confidence: 0.95,
        },
        {
          id: '2',
          type: 'qr',
          title: 'Product QR Code',
          preview: 'https://example.com/product/123',
          timestamp: Date.now() - 7200000,
          status: 'success',
          confidence: 0.99,
        },
        {
          id: '3',
          type: 'document',
          title: 'Recipe Card',
          preview: 'Ingredients: 2 cups flour, 1 cup sugar...',
          timestamp: Date.now() - 86400000,
          status: 'success',
          extractedText: 'Full recipe text here...',
          confidence: 0.88,
        },
        {
          id: '4',
          type: 'voice',
          title: 'Voice Note - Meeting',
          preview: 'Discussed project timeline and deliverables...',
          timestamp: Date.now() - 172800000,
          status: 'processing',
        },
        {
          id: '5',
          type: 'document',
          title: 'Blurry Receipt',
          preview: 'Failed to extract text clearly',
          timestamp: Date.now() - 259200000,
          status: 'failed',
        },
      ];
      setHistoryItems(mockHistory);
    } catch (error) {
      console.log('Error loading history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const filteredItems = historyItems.filter(item => 
    selectedFilter === 'all' || item.type === selectedFilter
  );

  const deleteHistoryItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHistoryItems(items => items.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  const clearAllHistory = () => {
    Alert.alert(
      'Clear History',
      'This will remove all items from your scan history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setHistoryItems([]),
        },
      ]
    );
  };

  const openHistoryItem = (item: HistoryItem) => {
    if (item.status === 'failed') {
      Alert.alert('Failed Scan', 'This scan failed to process. Would you like to try again?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => router.push('/(tabs)/camera') },
      ]);
      return;
    }

    if (item.type === 'qr') {
      Alert.alert('QR Code Result', item.preview, [
        { text: 'Close', style: 'cancel' },
        { text: 'Copy', onPress: () => {} },
        { text: 'Open Link', onPress: () => {} },
      ]);
      return;
    }

    // Navigate to processing screen with the data
    router.push({
      pathname: '/(tabs)/processing',
      params: {
        historyItem: JSON.stringify(item),
        fromHistory: 'true',
      },
    });
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTypeIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'document': return 'document-text';
      case 'qr': return 'qr-code';
      case 'barcode': return 'barcode';
      case 'voice': return 'mic';
      default: return 'document';
    }
  };

  const getStatusColor = (status: HistoryItem['status']) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  const filters = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'document', label: 'Documents', icon: 'document-text' },
    { key: 'qr', label: 'QR Codes', icon: 'qr-code' },
    { key: 'voice', label: 'Voice', icon: 'mic' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>
              {historyItems.length} total scans
            </Text>
          </View>
          {historyItems.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearAllHistory}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={18} 
                color={selectedFilter === filter.key ? 'white' : '#666'} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length > 0 ? (
          <View style={styles.historyList}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => openHistoryItem(item)}
              >
                <View style={[styles.typeIndicator, { backgroundColor: getStatusColor(item.status) }]}>
                  <Ionicons 
                    name={getTypeIcon(item.type)} 
                    size={20} 
                    color="white" 
                  />
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemTime}>{getTimeAgo(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.itemPreview} numberOfLines={2}>
                    {item.preview}
                  </Text>
                  <View style={styles.itemFooter}>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                    {item.confidence && (
                      <Text style={styles.confidenceText}>
                        {Math.round(item.confidence * 100)}% confidence
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteItemButton}
                  onPress={() => deleteHistoryItem(item.id)}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#ccc" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#667eea20', '#764ba220']}
              style={styles.emptyIcon}
            >
              <Ionicons name="time-outline" size={48} color="#667eea" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'all' ? 'No scan history yet' : `No ${selectedFilter} scans`}
            </Text>
            <Text style={styles.emptySubtitle}>
              Your scan history will appear here as you use the app
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/camera')}
            >
              <Text style={styles.emptyButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
	confidenceText: {
		fontSize: 12,
		color: '#667eea',
		marginLeft: 12,
	},
	deleteItemButton: {
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 80,
		paddingHorizontal: 32,
	},
	emptyIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#667eea',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 24,
		textAlign: 'center',
	},
	emptyButton: {
		backgroundColor: '#667eea',
		borderRadius: 24,
		paddingHorizontal: 32,
		paddingVertical: 12,
	},
	emptyButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffe5e5',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 10,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  historyList: {
    marginBottom: 60,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
  itemPreview: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export { styles };
