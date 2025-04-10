import { router } from "expo-router";
import { TouchableOpacity, Text, StyleSheet } from "react-native";


export default function AddButton( { path, text }: { path: string, text: string } ) {
    return (
        <TouchableOpacity style={styles.addButton} onPress={ () => router.push(path as any) }>
            <Text style={styles.addButtonText}>Thêm {text}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    addButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});


