import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFirestore } from '../../context/storageFirebase';
import BackButton from '../../components/common/UI/backButton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    shippingAddress: string;
    phoneNumber: string;
}

export default function OrderDetail() {
    const { id } = useLocalSearchParams();
    const { getDocuments, updateDocument } = useFirestore();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrderData();
    }, [id]);

    const loadOrderData = async () => {
        try {
            setLoading(true);
            const ordersData = await getDocuments('orders');
            const orderData = ordersData.find((order: any) => order.id === id);
            
            if (orderData) {
                const formattedOrder: Order = {
                    id: orderData.id,
                    customerId: orderData.customerId,
                    customerName: orderData.customerName,
                    items: orderData.items,
                    totalAmount: orderData.totalAmount,
                    status: orderData.status,
                    createdAt: orderData.createdAt?.toDate() || new Date(),
                    updatedAt: orderData.updatedAt?.toDate() || new Date(),
                    shippingAddress: orderData.shippingAddress,
                    phoneNumber: orderData.phoneNumber
                };
                setOrder(formattedOrder);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu đơn hàng:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: Order['status']) => {
        if (!order) return;

        try {
            await updateDocument('orders', order.id, {
                status: newStatus,
                updatedAt: new Date()
            });

            setOrder(prev => prev ? { ...prev, status: newStatus } : null);
            Alert.alert('Thành công', 'Cập nhật trạng thái đơn hàng thành công');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text>Không tìm thấy đơn hàng</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton path="/orders/orders" />
                <Text style={styles.title}>Chi tiết đơn hàng</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="receipt" size={24} color="#007AFF" />
                        <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <MaterialIcons name="tag" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Mã đơn hàng:</Text>
                        </View>
                        <Text style={styles.value}>{order.id}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <MaterialIcons name="info" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Trạng thái:</Text>
                        </View>
                        <Text style={[styles.value, { color: getStatusColor(order.status) }]}>
                            {order.status.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="calendar-outline" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Ngày đặt:</Text>
                        </View>
                        <Text style={styles.value}>
                            {order.createdAt.toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={24} color="#007AFF" />
                        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="person-outline" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Tên khách hàng:</Text>
                        </View>
                        <Text style={styles.value}>{order.customerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="call-outline" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Số điện thoại:</Text>
                        </View>
                        <Text style={styles.value}>{order.phoneNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="location-outline" size={18} color="#666" style={styles.labelIcon} />
                            <Text style={styles.label}>Địa chỉ:</Text>
                        </View>
                        <Text style={styles.value}>{order.shippingAddress}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="shopping-cart" size={24} color="#007AFF" />
                        <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>
                    </View>
                    {order.items.map((item, index) => (
                        <View key={index} style={styles.productItem}>
                            <View style={styles.productHeader}>
                                <MaterialIcons name="inventory" size={20} color="#333" style={styles.productIcon} />
                                <Text style={styles.productName}>{item.productName}</Text>
                            </View>
                            <View style={styles.productDetails}>
                                <View style={styles.quantityContainer}>
                                    <MaterialIcons name="format-list-numbered" size={18} color="#666" style={styles.detailIcon} />
                                    <Text style={styles.productQuantity}>Số lượng: {item.quantity}</Text>
                                </View>
                                <View style={styles.priceContainer}>
                                    <MaterialIcons name="payments" size={18} color="#666" style={styles.detailIcon} />
                                    <Text style={styles.productPrice}>
                                        {item.price.toLocaleString('vi-VN')}đ
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                    <View style={styles.totalContainer}>
                        <View style={styles.totalLabelContainer}>
                            <MaterialIcons name="payments" size={20} color="#007AFF" style={styles.totalIcon} />
                            <Text style={styles.totalLabel}>Tổng tiền:</Text>
                        </View>
                        <Text style={styles.totalAmount}>
                            {order.totalAmount.toLocaleString('vi-VN')}đ
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="update" size={24} color="#007AFF" />
                        <Text style={styles.sectionTitle}>Cập nhật trạng thái</Text>
                    </View>
                    <View style={styles.statusButtons}>
                        {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusButton,
                                    order.status === status && styles.statusButtonActive
                                ]}
                                onPress={() => handleStatusUpdate(status as Order['status'])}
                            >
                                <MaterialIcons 
                                    name={getStatusIcon(status)} 
                                    size={20} 
                                    color={order.status === status ? "#fff" : "#333"} 
                                    style={styles.statusIcon} 
                                />
                                <Text style={[
                                    styles.statusButtonText,
                                    order.status === status && styles.statusButtonTextActive
                                ]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
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
            return 'update';
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
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    value: {
        flex: 2,
        fontSize: 14,
    },
    productItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    productDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    productQuantity: {
        fontSize: 14,
        color: '#666',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        marginBottom: 8,
    },
    statusButtonActive: {
        backgroundColor: '#007AFF',
    },
    statusButtonText: {
        fontSize: 14,
        color: '#333',
    },
    statusButtonTextActive: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    labelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelIcon: {
        marginRight: 8,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productIcon: {
        marginRight: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        marginRight: 6,
    },
    totalLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalIcon: {
        marginRight: 8,
    },
    statusIcon: {
        marginRight: 6,
    },
}); 