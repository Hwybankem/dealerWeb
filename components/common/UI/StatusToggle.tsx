import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StatusToggleProps {
  status: 'active' | 'inactive';
  onStatusChange: (status: 'active' | 'inactive') => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ status, onStatusChange }) => (
  <View style={styles.statusContainer}>
    <TouchableOpacity
      style={[styles.statusButton, status === 'active' && styles.statusButtonActive]}
      onPress={() => onStatusChange('active')}
    >
      <Text style={[styles.statusButtonText, status === 'active' && styles.statusButtonTextActive]}>
        Active
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.statusButton, status === 'inactive' && styles.statusButtonInactive]}
      onPress={() => onStatusChange('inactive')}
    >
      <Text style={[styles.statusButtonText, status === 'inactive' && styles.statusButtonTextInactive]}>
        Inactive
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  statusButtonInactive: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  statusButtonTextInactive: {
    color: '#fff',
  },
});