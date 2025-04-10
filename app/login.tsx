import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "expo-router";
import { User } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [checkRoleError, setCheckRoleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login, user, checkRole, logout} = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (user) {
  //     router.replace("/");
  //   }
  // }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
  
    setIsLoading(true);
    setError(null);
    setCheckRoleError(null);
  
    try {
      console.log("Bắt đầu đăng nhập...");
      const currentUser = await login(email, password);
  
      if (!currentUser.email) {
        throw new Error("Không tìm thấy email người dùng");
      }
  
      console.log("Đăng nhập thành công:", currentUser.email);
  
      // Kiểm tra role ngay sau khi đăng nhập thành công
      const hasRequiredRole = await checkRole("dealer", currentUser.uid);

      console.log("Kết quả kiểm tra role:", hasRequiredRole);
  
      if (hasRequiredRole) {
        console.log("Đăng nhập thành công với quyền admin");
        router.replace("/");
      } else {
        console.log("Không có quyền admin, đăng xuất sau 2 giây...");
        setCheckRoleError("Bạn không có quyền truy cập vào ứng dụng. Vui lòng liên hệ quản trị viên.");
        
        setTimeout(async () => {
          await logout();
        }, 2000);
      }
    } catch (err: any) {
      console.log("Lỗi đăng nhập:", err.message);
      setError(err.message);
    } finally {
      console.log("Đã kết thúc quá trình xử lý login");
      setIsLoading(false); // Quan trọng: đảm bảo trạng thái này được cập nhật
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng Nhập</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {checkRoleError && (
        <View style={[styles.errorContainer, styles.warningContainer]}>
          <Text style={[styles.errorText, styles.warningText]}>{checkRoleError}</Text>
          <Text style={styles.warningSubText}>Nếu bạn là quản trị viên, vui lòng kiểm tra lại thông tin đăng nhập.</Text>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Nhập email của bạn"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#999"
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#d32f2f", // Đổi màu viền input thành đỏ khi có lỗi
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "#ffe6e6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: "#333",
  },
  linkText: {
    fontSize: 14,
    color: "#007bff",
    textDecorationLine: "underline",
  },
  warningContainer: {
    backgroundColor: "#fff3e0",
    borderColor: "#ff9800",
  },
  warningText: {
    color: "#f57c00",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  warningSubText: {
    color: "#f57c00",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
});