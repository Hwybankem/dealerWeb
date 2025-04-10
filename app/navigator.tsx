import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useFirestore } from '../context/storageFirebase';
import { useAuth } from '../context/AuthContext';
import Storage from '@/components/utils/storage';

interface Vendor {
  id: string;
  name: string;
  address: string;
  phone: string;
  authorizedUsers: string[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { getDocuments } = useFirestore();
  const { user, logout } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendorData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err: any) {
      console.error("Logout error:", err.message);
    }
  };

  const loadVendorData = async () => {
    try {
      console.log(user?.uid)
      if (!user?.uid) {
        setError('Không tìm thấy thông tin người dùng');
        setIsLoading(false);
        return;
      }

      const vendorsData = await getDocuments('vendors');
      console.log('Vendors data:', vendorsData);

      const userVendor = vendorsData.find((doc: any) => {
        return Array.isArray(doc.authorizedUsers) &&
          doc.authorizedUsers.some((u: any) => u.userId === user.uid);
      });
      

      console.log('Found vendor:', userVendor);

      if (!userVendor) {
        setError('Bạn không có quyền truy cập vào cửa hàng nào');
        setIsLoading(false);
        return;
      }

      // Lưu vendor ID vào Storage
      await Storage.setItem('vendorId', userVendor.id);

      setVendor({
        id: userVendor.id,
        name: userVendor.name || '',
        address: userVendor.address || '',
        phone: userVendor.phone || '',
        authorizedUsers: userVendor.authorizedUsers || []
      });

    } catch (error) {
      console.error('Error loading vendor data:', error);
      setError('Không thể tải thông tin cửa hàng');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin cửa hàng'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleLogout}
          >
            <Text style={styles.retryButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2b49" />
      <View style={styles.header}>
      <TouchableOpacity
            style={styles.retryButton}
            onPress={handleLogout}
          />
        <Text style={styles.headerTitle}>Quản lý hệ thống</Text>
      </View>
      
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{vendor.name}</Text>
        <Text style={styles.vendorAddress}>{vendor.address}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Chào mừng đến với hệ thống quản lý</Text>
        <Text style={styles.subText}>Vui lòng chọn mục bạn muốn truy cập</Text>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/products/product')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3498db' }]}>
              <Ionicons name="cube-outline" size={32} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Sản phẩm</Text>
              <Text style={styles.menuDescription}>Quản lý danh sách sản phẩm</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/orders/index')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3498db' }]}>
              <Ionicons name="cube-outline" size={32} color="white" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn hàng</Text>
              <Text style={styles.menuDescription}>Quản lý danh sách đơn hàng</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Hệ thống quản lý</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#1a2b49',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  vendorInfo: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e4e7',
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2b49',
    marginBottom: 5,
  },
  vendorAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2b49',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  menuContainer: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2b49',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e4e7',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
