import { router } from "expo-router";

import { TouchableOpacity, Text, StyleSheet } from "react-native";


export default function BackButton( { path }: { path: string } ) {
    return (
        <TouchableOpacity style={styles.backButton} onPress={ () => router.push(path as any) }>
            <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        marginRight: 20,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
});
