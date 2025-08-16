import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { NotificationTestUtils } from '../services/NotificationTestUtils';

interface NotificationTestPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationTestPanel: React.FC<NotificationTestPanelProps> = ({
  visible,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const runTest = async (testName: string, testFunction: () => Promise<void> | void) => {
    try {
      addResult(`🧪 Running ${testName}...`);
      await testFunction();
      addResult(`✅ ${testName} completed`);
    } catch (error) {
      addResult(`❌ ${testName} failed: ${error}`);
    }
  };

  const tests = [
    {
      name: 'Check Status',
      description: 'Check notification system status',
      action: () => runTest('Status Check', () => {
        const status = NotificationTestUtils.getNotificationStatus();
        addResult(`Navigation callback: ${status.hasNavigationCallback ? '✅' : '❌'}`);
        addResult(`Custom notification: ${status.hasCustomNotificationCallback ? '✅' : '❌'}`);
        addResult(`Current user: ${status.currentUser}`);
        addResult(`Subscriptions: ${status.globalSubscriptions}`);
      })
    },
    {
      name: 'Test Custom Notification',
      description: 'Show a test notification',
      action: () => runTest('Custom Notification', () => {
        NotificationTestUtils.testCustomNotification();
        addResult('Test notification should appear at top of screen');
      })
    },
    {
      name: 'Test Navigation',
      description: 'Test notification navigation',
      action: () => runTest('Navigation Test', () => {
        NotificationTestUtils.testNavigationCallback();
        addResult('Check if chat screen navigation worked');
      })
    },
    {
      name: 'Simulate Message',
      description: 'Simulate incoming message',
      action: () => runTest('Message Simulation', async () => {
        await NotificationTestUtils.simulateTestMessage();
        addResult('Simulated message notification sent');
      })
    },
    {
      name: 'Clear Results',
      description: 'Clear test results',
      action: () => {
        setTestResults([]);
        addResult('Test results cleared');
      }
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Notification Testing</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>Available Tests:</Text>
          {tests.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testButton}
              onPress={test.action}
            >
              <Text style={styles.testButtonText}>{test.name}</Text>
              <Text style={styles.testDescription}>{test.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Test Results:</Text>
          <ScrollView style={styles.resultsScroll}>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
            {testResults.length === 0 && (
              <Text style={styles.noResults}>No test results yet</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  testsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  resultsScroll: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default NotificationTestPanel;
