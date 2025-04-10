import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import Login from "./login"
import HomeScreen from "./navigator";
export default function Home() {
const { user} = useAuth();


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {user ? (
        <HomeScreen />
      ) : (
        <Login />
      )}
    </View>
  );
}