import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Platform, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useFirestore } from '../../context/storageFirebase';
import BackButton from '../../components/common/UI/backButton';
import Storage from '@/components/utils/storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface Order {
    id: string;
    customerId: string;
    customerName: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    shippingAddress: string;
    phoneNumber: string;
}

export default function Orders() {
    const { getDocuments } = useFirestore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    useEffect(() => {
        const loadDataAsync = async () => {
            const id = await vendorId();
            if (id) loadData(id);
        };
        loadDataAsync();
    }, []);

    const vendorId = async () => {
        try {
            const id = await Storage.getItem('vendorId');
            console.log('Vendor ID:', id);
            return id;
        } catch (error) {
            console.error('Lỗi khi lấy Vendor ID:', error);
        }
    };

    useEffect(() => {
        filterOrders(searchQuery, selectedStatus);
    }, [searchQuery, selectedStatus, orders]);

    const loadData = async (vendorId: string) => {
        try {
            setLoading(true);
            const ordersData = await getDocuments('orders');
            const formattedOrders: Order[] = ordersData
                .filter((order: any) => order.vendorId === vendorId)
                .map((order: any) => ({
                    id: order.id,
                    customerId: order.customerId,
                    customerName: order.customerName,
                    items: order.items,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    createdAt: order.createdAt?.toDate() || new Date(),
                    updatedAt: order.updatedAt?.toDate() || new Date(),
                    shippingAddress: order.shippingAddress,
                    phoneNumber: order.phoneNumber
                }));

            setOrders(formattedOrders);
            setFilteredOrders(formattedOrders);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = (query: string, status: string | null) => {
        let filtered = [...orders];

        if (query.trim()) {
            filtered = filtered.filter(order => 
                order.customerName.toLowerCase().includes(query.toLowerCase()) ||
                order.id.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (status) {
            filtered = filtered.filter(order => order.status === status);
        }

        setFilteredOrders(filtered);
    };

    const handleOrderPress = (order: Order) => {
        router.push({
            pathname: '/orders/[id]',
            params: { id: order.id }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFA500';
            case 'processing':
                return '#4169E1';
            case 'completed':
                return '#4CAF50';
            case 'cancelled':
                return '#FF0000';
            default:
                return '#000000';
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderItem}
            onPress={() => handleOrderPress(item)}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                    <MaterialIcons name="receipt" size={20} color="#007AFF" style={styles.orderIcon} />
                    <Text style={styles.orderId}>Đơn hàng: {item.id}</Text>
                </View>
                <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
            <View style={styles.customerInfo}>
                <Ionicons name="person-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View style={styles.customerInfo}>
                <Ionicons name="call-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.orderInfo}>Số điện thoại: {item.phoneNumber}</Text>
            </View>
            <View style={styles.customerInfo}>
                <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.orderInfo}>Địa chỉ: {item.shippingAddress}</Text>
            </View>
            <View style={styles.orderFooter}>
                <View style={styles.totalContainer}>
                    <MaterialIcons name="payments" size={18} color="#007AFF" style={styles.totalIcon} />
                    <Text style={styles.orderTotal}>Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#666" style={styles.dateIcon} />
                    <Text style={styles.orderDate}>
                        Ngày đặt: {item.createdAt.toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton path="/navigator" />
                <Text style={styles.title}>Quản lý đơn hàng</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm theo tên khách hàng hoặc mã đơn hàng"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedStatus === null && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedStatus(null)}
                    >
                        <MaterialIcons 
                            name="list" 
                            size={18} 
                            color={selectedStatus === null ? "#fff" : "#333"} 
                            style={styles.filterIcon} 
                        />
                        <Text style={[
                            styles.filterButtonText,
                            selectedStatus === null && styles.filterButtonTextActive
                        ]}>Tất cả</Text>
                    </TouchableOpacity>
                    {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterButton,
                                selectedStatus === status && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <MaterialIcons 
                                name={getStatusIcon(status)} 
                                size={18} 
                                color={selectedStatus === status ? "#fff" : "#333"} 
                                style={styles.filterIcon} 
                            />
                            <Text style={[
                                styles.filterButtonText,
                                selectedStatus === status && styles.filterButtonTextActive
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.orderList}
                />
            )}
        </SafeAreaView>
    );
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending':
            return 'hourglass-empty';
        case 'processing':
            return 'local-shipping';
        case 'completed':
            return 'check-circle';
        case 'cancelled':
            return 'cancel';
        default:
            return 'list';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    searchContainer: {
        padding: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterButtonText: {
        color: '#333',
        fontSize: 14,
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    orderList: {
        padding: 16,
    },
    orderItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderIcon: {
        marginRight: 6,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoIcon: {
        marginRight: 6,
    },
    customerName: {
        fontSize: 16,
        marginBottom: 4,
    },
    orderInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    orderFooter: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    totalIcon: {
        marginRight: 6,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 6,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 8,
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterIcon: {
        marginRight: 6,
    },
}); 