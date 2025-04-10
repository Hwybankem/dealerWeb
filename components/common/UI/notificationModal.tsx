import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationModalProps {
    visible: boolean;
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
    visible,
    type,
    message,
    onClose
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[
                    styles.modalView,
                    type === 'success' ? styles.successBorder : styles.errorBorder
                ]}>
                    <View style={styles.iconContainer}>
                        {type === 'success' ? (
                            <Ionicons name="checkmark-circle" size={50} color="#10b981" />
                        ) : (
                            <Ionicons name="close-circle" size={50} color="#ef4444" />
                        )}
                    </View>
                    
                    <Text style={[
                        styles.modalText,
                        type === 'success' ? styles.successText : styles.errorText
                    ]}>
                        {type === 'success' ? 'Thành công' : 'Thất bại'}
                    </Text>
                    
                    <Text style={styles.messageText}>
                        {message}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            type === 'success' ? styles.successButton : styles.errorButton
                        ]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: Platform.OS === 'web' ? '30%' : '80%',
        borderWidth: 2,
    },
    successBorder: {
        borderColor: '#10b981',
    },
    errorBorder: {
        borderColor: '#ef4444',
    },
    iconContainer: {
        marginBottom: 15,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    successText: {
        color: '#10b981',
    },
    errorText: {
        color: '#ef4444',
    },
    messageText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 24,
    },
    button: {
        borderRadius: 10,
        padding: 10,
        paddingHorizontal: 20,
        elevation: 2,
        minWidth: 120,
    },
    successButton: {
        backgroundColor: '#10b981',
    },
    errorButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default NotificationModal; 