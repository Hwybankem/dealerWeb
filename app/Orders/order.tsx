import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFirestore } from '../../context/storageFirebase';
import BackButton from '../../components/common/UI/backButton';
import Storage from '@/components/utils/storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ProductDetails {
    name: string;
    description?: string;
    price?: number;
}

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    productDetails?: ProductDetails | null;
}

interface Order {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    shippingAddress: string;
}

interface ShipperOrder {
    recipientName: string;
    recipientPhone: string;
    deliveryAddress: string;
    itemsSummary: {
        productName: string;
        quantity: number;
    }[];
    totalAmount: number;
    shipmentStatus: 'ready_to_ship' | 'assigned' | 'out_for_delivery' | 'delivered' | 'failed';
    createdAt: Date;
    customerId?: string;
}

type TabType = 'pending' | 'approved' | 'cancelled';

const MAX_QUANTITY = 100;
const MAX_TOTAL_AMOUNT = 100000000;

export default function Orders() {
    const { addDocument, getDocuments, updateDocument } = useFirestore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('pending');

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
        filterOrders(searchQuery, activeTab);
    }, [searchQuery, activeTab, orders]);

    const shouldAutoApprove = (order: Order) => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return totalQuantity <= MAX_QUANTITY && order.totalAmount <= MAX_TOTAL_AMOUNT;
    };

    const handleShipperOrder = async (order: Order) => {

        const shipperOrderData: ShipperOrder = {
            recipientName: order.customerName,
            recipientPhone: order.customerPhone,
            deliveryAddress: order.shippingAddress,
            itemsSummary: order.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
            })),
            totalAmount: order.totalAmount,
            shipmentStatus: 'ready_to_ship',
            createdAt: new Date(),
            customerId: order.customerId
        };

        try {
            // 3. Try to add the formatted shipper data to the 'ship' collection
            await addDocument('ship', shipperOrderData);
        } catch (error: any) {
            console.error('Lỗi khi thêm vào collection ship:', error);
            // Nếu collection chưa tồn tại, tạo collection mới
            if (error.message && error.message.includes('collection does not exist')) {
                console.log('Tạo collection ship mới...');
                // Thêm một document rỗng để tạo collection
                await addDocument('ship', {
                    _createdAt: new Date(),
                    _updatedAt: new Date()
                });
                // Thử lại việc thêm dữ liệu
                await addDocument('ship', shipperOrderData);
            } else {
                throw error; // Nếu lỗi khác, ném ra ngoài để xử lý
            }
        }
    }

    const handleApproveOrder = async (order: Order) => {
        try {
            // 1. Update the transaction status
            await updateDocument('transactions', order.id, {
                status: 'completed',
                updatedAt: new Date()
            });

            const vendorProducts = await getDocuments('vendor_products');
            for (const item of order.items) {
                const vendorProduct = vendorProducts.find((vp: any) =>
                    vp.products === item.productName && vp.id === order.customerId
                );

                if (vendorProduct) {
                    const newStock = vendorProduct.stock - item.quantity;
                    await updateDocument('vendor_products', vendorProduct.id, {
                        stock: newStock
                    });
                }
            }

            setOrders(prevOrders =>
                prevOrders.map(o =>
                    o.id === order.id ? { ...o, status: 'completed' } : o
                )
            );

            Alert.alert('Thành công', 'Đơn hàng đã được phê duyệt và chuyển cho shipper');
        } catch (error) {
            console.error('Lỗi khi phê duyệt đơn hàng:', error);
            Alert.alert('Lỗi', 'Không thể phê duyệt đơn hàng');
        }
    };

    const handleCancelOrder = async (order: Order) => {
        try {
            await updateDocument('transactions', order.id, {
                status: 'cancelled',
                updatedAt: new Date()
            });

            setOrders(prevOrders =>
                prevOrders.map(o =>
                    o.id === order.id ? { ...o, status: 'cancelled' } : o
                )
            );

            Alert.alert('Thành công', 'Đơn hàng đã bị hủy');
        } catch (error) {
            console.error('Lỗi khi hủy đơn hàng:', error);
            Alert.alert('Lỗi', 'Không thể hủy đơn hàng');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFA500';
            case 'completed':
                return '#4CAF50';
            case 'cancelled':
                return '#FF0000';
            default:
                return '#000000';
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                    <MaterialIcons name="receipt" size={20} color="#007AFF" style={styles.orderIcon} />
                    <Text style={styles.orderId}>Đơn hàng: {item.id}</Text>
                </View>
                <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>

            <View style={styles.customerSection}>
                <View style={styles.customerInfo}>
                    <Ionicons name="person-circle-outline" size={20} color="#007AFF" style={styles.infoIcon} />
                    <Text style={styles.customerName}>Khách hàng: {item.customerName}</Text>
                </View>
                <View style={styles.customerInfo}>
                    <Ionicons name="mail-outline" size={16} color="#666" style={styles.infoIcon} />
                    <Text style={styles.orderInfo}>Email: {item.customerEmail}</Text>
                </View>
                <View style={styles.customerInfo}>
                    <Ionicons name="call-outline" size={16} color="#666" style={styles.infoIcon} />
                    <Text style={styles.orderInfo}>Số điện thoại: {item.customerPhone}</Text>
                </View>
                <View style={styles.customerInfo}>
                    <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                    <Text style={styles.orderInfo}>Địa chỉ: {item.shippingAddress}</Text>
                </View>
            </View>

            <View style={styles.productsSection}>
                <Text style={styles.sectionTitle}>Sản phẩm đã đặt:</Text>
                {item.items.map((product, index) => (
                    <View key={index} style={styles.productItem}>
                        <Text style={styles.productName}>{product.productDetails?.name || product.productName}</Text>
                        <View style={styles.productDetails}>
                            <Text style={styles.productInfo}>Số lượng: {product.quantity}</Text>
                            <Text style={styles.productInfo}>Giá: {product.price.toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>
                ))}
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
            {activeTab === 'pending' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => {
                            handleApproveOrder(item);
                            handleShipperOrder(item);
                        }}
                    >
                        <MaterialIcons name="check-circle" size={20} color="#fff" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelOrder(item)}
                    >
                        <MaterialIcons name="cancel" size={20} color="#fff" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const loadData = async (vendorId: string) => {
        try {
            setLoading(true);
            console.log('Loading data for vendorId:', vendorId);

            const transactionsData = await getDocuments('transactions');
            const usersData = await getDocuments('users');
            const productsData = await getDocuments('products');

            console.log('Raw transactions data:', transactionsData);

            const vendorOrders = await Promise.all(transactionsData
                .filter((transaction: any) => {
                    console.log('Comparing:', transaction.storeName, 'with', vendorId);
                    return transaction.storeName === vendorId;
                })
                .map(async (transaction: any) => {
                    // Lấy thông tin người dùng
                    const userData = usersData.find((user: any) => user.id === transaction.userId);
                    console.log('User data:', userData);

                    // Lấy thông tin chi tiết cho từng sản phẩm trong đơn hàng
                    const itemsWithDetails = await Promise.all((transaction.items || []).map(async (item: any) => {
                        const productData = productsData.find((product: any) => product.id === item.productId);
                        return {
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            productDetails: productData ? {
                                name: productData.name,
                                description: productData.description,
                                price: productData.price
                            } : null
                        } as OrderItem;
                    }));

                    const order = {
                        id: transaction.id,
                        customerId: transaction.userId,
                        customerName: userData?.fullName || 'Không xác định',
                        customerEmail: userData?.username || 'Không xác định',
                        customerPhone: userData?.phone || transaction.phoneNumber || 'Không xác định',
                        items: itemsWithDetails,
                        totalAmount: transaction.totalAmount,
                        status: transaction.status,
                        createdAt: transaction.createdAt?.toDate() || new Date(),
                        updatedAt: transaction.updatedAt?.toDate() || new Date(),
                        shippingAddress: userData?.address || 'Không xác định',
                        phoneNumber: transaction.phoneNumber
                    } as Order;

                    // Kiểm tra và tự động duyệt đơn hàng nếu đáp ứng điều kiện
                    if (order.status === 'pending' && shouldAutoApprove(order)) {
                        const fiveMinutesInMs = 5 * 60 * 1000;
                        const currentTime = Date.now();
                        const orderCreationTime = order.createdAt.getTime(); // Lấy timestamp

                        // Kiểm tra xem thời gian hiện tại có lớn hơn thời gian tạo + 5 phút không
                        if (currentTime >= (orderCreationTime + fiveMinutesInMs)) {
                            console.log(`Đơn hàng ${order.id} đủ điều kiện và đã qua 5 phút (${order.createdAt.toLocaleString()}), tự động duyệt...`);
                            try {
                                await handleApproveOrder(order);
                                order.status = 'completed';
                                await handleShipperOrder(order);
                                console.log(`Đơn hàng ${order.id} đã được tự động duyệt và gửi cho shipper thành công.`);
                            } catch (autoApproveError) {
                                 console.error(`Lỗi khi tự động duyệt đơn hàng ${order.id}:`, autoApproveError);
                            }
                        } else {
                              console.log(`Đơn hàng ${order.id} đủ điều kiện nhưng chưa đủ 5 phút (tạo lúc ${order.createdAt.toLocaleString()}), bỏ qua tự động duyệt.`);
                        }
                    }

                    return order;
                }));

            console.log('Filtered vendor orders with details:', vendorOrders);

            setOrders(vendorOrders);
            setFilteredOrders(vendorOrders.filter(order => order.status === 'pending'));
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = (query: string, tab: TabType) => {
        let filtered = [...orders];

        if (query.trim()) {
            filtered = filtered.filter(order =>
                order.customerName.toLowerCase().includes(query.toLowerCase()) ||
                order.id.toLowerCase().includes(query.toLowerCase())
            );
        }

        filtered = filtered.filter(order => {
            if (tab === 'pending') return order.status === 'pending';
            if (tab === 'approved') return order.status === 'completed';
            if (tab === 'cancelled') return order.status === 'cancelled';
            return false;
        });

        setFilteredOrders(filtered);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton path="/navigator" />
                <Text style={styles.title}>Quản lý đơn hàng</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <MaterialIcons
                        name="hourglass-empty"
                        size={20}
                        color={activeTab === 'pending' ? "#fff" : "#666"}
                    />
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Chờ duyệt
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
                    onPress={() => setActiveTab('approved')}
                >
                    <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={activeTab === 'approved' ? "#fff" : "#666"}
                    />
                    <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
                        Đã duyệt
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
                    onPress={() => setActiveTab('cancelled')}
                >
                    <MaterialIcons
                        name="cancel"
                        size={20}
                        color={activeTab === 'cancelled' ? "#fff" : "#666"}
                    />
                    <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
                        Đã hủy
                    </Text>
                </TouchableOpacity>
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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text>Đang tải...</Text>
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="receipt" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {activeTab === 'pending'
                            ? 'Không có đơn hàng chờ duyệt'
                            : activeTab === 'approved'
                                ? 'Không có đơn hàng đã duyệt'
                                : 'Không có đơn hàng đã hủy'
                        }
                    </Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
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
        height: 40,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    orderList: {
        padding: 16,
    },
    orderItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderIcon: {
        marginRight: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '600',
    },
    customerSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    infoIcon: {
        marginRight: 8,
    },
    orderInfo: {
        fontSize: 14,
        color: '#666',
    },
    productsSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    productItem: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    productDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    productInfo: {
        fontSize: 14,
        color: '#666',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalIcon: {
        marginRight: 8,
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 8,
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#FF0000',
    },
    actionIcon: {
        marginRight: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
