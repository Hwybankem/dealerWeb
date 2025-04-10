import { Stack } from 'expo-router';
import { AuthContextProvider } from "../context/AuthContext";
import { FirestoreProvider } from "../context/storageFirebase";

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <FirestoreProvider>
        <Stack screenOptions={{ headerShown: false, headerBackVisible: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="navigator" options={{ headerShown: false }} />
          <Stack.Screen name="products" options={{ headerShown: false }} /> 
        </Stack>
      </FirestoreProvider>
    </AuthContextProvider>
  );
}