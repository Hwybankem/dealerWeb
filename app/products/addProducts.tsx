import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    Alert,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFirestore } from '../../context/storageFirebase';
import BackButton from '../../components/common/UI/backButton';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import NotificationModal from '../../components/common/UI/notificationModal';

interface Category {
    id: string;
    name: string;
    parentId?: string;
    subCategories?: Category[];
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    categories: string[];
    status: 'active' | 'inactive';
}

interface ProductRequest {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    note?: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy: string;
    requestedAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
}

interface ProductListItem {
    id: string;
    name: string;
    stock: number;
}

interface Vendor {
    id: string;
    name: string;
    address: string;
    phone: string;
    authorizedUsers: string[];
}

export default function ImportRequest() {
    const { addDocument, getDocuments,  deleteDocument, loading: firestoreLoading, error } = useFirestore();
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ProductRequest[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        loadVendorData();
        loadCategories();
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, selectedCategory, products]);

    const loadVendorData = async () => {
        try {
            if (!user?.uid) {
                setErrorMessage('Không tìm thấy thông tin người dùng');
                setShowErrorModal(true);
                return;
            }

            const vendorsData = await getDocuments('vendors');
            const userVendor = vendorsData.find((doc: any) => 
                Array.isArray(doc.authorizedUsers) &&
                doc.authorizedUsers.some((u: any) => u.userId === user.uid)
            );

            if (!userVendor) {
                setErrorMessage('Bạn không có quyền truy cập vào cửa hàng nào');
                setShowErrorModal(true);
                return;
            }

            setVendor({
                id: userVendor.id,
                name: userVendor.name || '',
                address: userVendor.address || '',
                phone: userVendor.phone || '',
                authorizedUsers: userVendor.authorizedUsers || []
            });
        } catch (error) {
            setErrorMessage('Không thể tải thông tin cửa hàng');
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const categoriesData = await getDocuments('categories');
            // Chuyển đổi dữ liệu phẳng thành cấu trúc cây
            const categoryMap = new Map<string, Category>();
            const rootCategories: Category[] = [];

            // Đầu tiên, tạo map cho tất cả categories
            categoriesData.forEach((category: any) => {
                categoryMap.set(category.id, {
                    id: category.id,
                    name: category.name,
                    parentId: category.parentId,
                    subCategories: []
                });
            });

            // Sau đó, xây dựng cấu trúc cây
            categoriesData.forEach((category: any) => {
                const categoryNode = categoryMap.get(category.id)!;
                if (category.parentId) {
                    const parent = categoryMap.get(category.parentId);
                    if (parent) {
                        if (!parent.subCategories) {
                            parent.subCategories = [];
                        }
                        parent.subCategories.push(categoryNode);
                    }
                } else {
                    rootCategories.push(categoryNode);
                }
            });

            setCategories(rootCategories);
            console.log('Categories đã được load:', rootCategories);
        } catch (err) {
            console.error('Lỗi khi load categories:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
        }
    };

    const loadProducts = async () => {
        try {
            const productsData = await getDocuments('products');
            const formattedProducts: Product[] = productsData.map((doc: any) => ({
                id: doc.id,
                name: doc.name || '',
                description: doc.description || '',
                price: doc.price || 0,
                stock: doc.stock || 0,
                categories: doc.categories || [],
                status: doc.status || 'active'
            }));
            setProducts(formattedProducts);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm');
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        if (selectedCategory) {
            filtered = filtered.filter(product => 
                product.categories.includes(selectedCategory)
            );
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            );
        }

        setFilteredProducts(filtered);
    };

    const handleSubmit = async () => {
        if (!vendor) {
            setModalType('error');
            setModalMessage('Không tìm thấy thông tin cửa hàng');
            setShowModal(true);
            return;
        }

        if (selectedProducts.length === 0) {
            setModalType('error');
            setModalMessage('Vui lòng thêm ít nhất một sản phẩm');
            setShowModal(true);
            return;
        }

        try {
            setIsSubmitting(true);
            for (const product of selectedProducts) {
                if (!product.productId || product.quantity <= 0) {
                    setModalType('error');
                    setModalMessage('Vui lòng điền đầy đủ thông tin cho tất cả sản phẩm');
                    setShowModal(true);
                    setIsSubmitting(false);
                    return;
                }
                await addDocument('importRequests', {
                    ...product,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    vendorAddress: vendor.address,
                    vendorPhone: vendor.phone,
                    requestedBy: user?.uid || '',
                    requestedAt: new Date(),
                    status: 'pending'
                });
            }
            setModalType('success');
            setModalMessage('Gửi yêu cầu nhập hàng thành công');
            setShowModal(true);
            
            // Đợi 1.5 giây trước khi quay lại
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            setModalType('error');
            setModalMessage('Không thể gửi yêu cầu nhập hàng');
            setShowModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addProductToRequest = (product: Product) => {
        setSelectedProducts([...selectedProducts, {
            productId: product.id,
            productName: product.name,
            quantity: 0,
            note: '',
            status: 'pending',
            requestedBy: user?.uid || '',
            requestedAt: new Date()
        }]);
        setShowProductModal(false);
    };

    const updateProductRequest = (index: number, field: keyof ProductRequest, value: any) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value
        };
        setSelectedProducts(updatedProducts);
    };

    const removeProductFromRequest = (index: number) => {
        const updatedProducts = selectedProducts.filter((_, i) => i !== index);
        setSelectedProducts(updatedProducts);
    };

    const findCategoryById = (categories: Category[], id: string): Category | null => {
        for (const category of categories) {
            if (category.id === id) {
                return category;
            }
            if (category.subCategories && category.subCategories.length > 0) {
                const found = findCategoryById(category.subCategories, id);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    const renderCategoryItem = (category: Category) => {
        return (
            <TouchableOpacity
                key={category.id}
                style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
            >
                <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                    {category.name}
                </Text>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (!vendor) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Không tìm thấy thông tin cửa hàng</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton path={'/products/product'} />
                <Text style={styles.headerTitle}>Yêu cầu nhập hàng</Text>
            </View>

            <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{vendor.name}</Text>
                <Text style={styles.vendorAddress}>{vendor.address}</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
                    {selectedProducts.map((product, index) => (
                        <View key={index} style={styles.selectedProductItem}>
                            <View style={styles.productHeader}>
                                <Text style={styles.productName}>Sản phẩm {index + 1}: {product.productName}</Text>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeProductFromRequest(index)}
                                >
                                    <Text style={styles.removeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.productInfo}>
                                <TextInput
                                    style={styles.quantityInput}
                                    placeholder="Số lượng"
                                    keyboardType="numeric"
                                    value={product.quantity.toString()}
                                    onChangeText={(value) => updateProductRequest(index, 'quantity', parseInt(value) || 0)}
                                />
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Ghi chú (Optional)"
                                    value={product.note}
                                    onChangeText={(value) => updateProductRequest(index, 'note', value)}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowProductModal(true)}
                >
                    <Text style={styles.addButtonText}>Thêm sản phẩm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={showProductModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn sản phẩm</Text>
                            <TouchableOpacity
                                onPress={() => setShowProductModal(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.categoriesContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.categoryItem,
                                        selectedCategory === null && styles.selectedCategory
                                    ]}
                                    onPress={() => setSelectedCategory(null)}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        selectedCategory === null && styles.selectedCategoryText
                                    ]}>
                                        Tất cả
                                    </Text>
                                </TouchableOpacity>
                                {categories.map(category => renderCategoryItem(category))}
                            </View>

                            <ScrollView style={styles.productsList}>
                                {filteredProducts.map(product => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={styles.productItem}
                                        onPress={() => addProductToRequest(product)}
                                    >
                                        <Text style={styles.productName}>{product.name}</Text>
                                        <Text style={styles.productStock}>Tồn kho: {product.stock}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>

            <NotificationModal
                visible={showModal}
                type={modalType}
                message={modalMessage}
                onClose={() => setShowModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e4e7',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 15,
        color: '#1a2b49',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#1a2b49',
    },
    selectedProductItem: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e4e7',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a2b49',
        flex: 1,
    },
    quantityInput: {
        backgroundColor: '#ffffff',
        borderRadius: 5,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e4e7',
        fontSize: 16,
    },
    noteInput: {
        backgroundColor: '#ffffff',
        borderRadius: 5,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e0e4e7',
        fontSize: 16,
    },
    removeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    removeButtonText: {
        color: '#dc2626',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#10b981',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e4e7',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a2b49',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '500',
    },
    searchContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e4e7',
    },
    searchInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    modalBody: {
        flex: 1,
        flexDirection: 'row',
    },
    categoriesContainer: {
        width: '30%',
        borderRightWidth: 1,
        borderRightColor: '#e0e4e7',
        padding: 10,
    },
    categoryItem: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    categoryText: {
        fontSize: 14,
        color: '#1a2b49',
    },
    selectedCategory: {
        backgroundColor: '#3b82f6',
    },
    selectedCategoryText: {
        color: '#ffffff',
    },
    productsList: {
        flex: 1,
        padding: 10,
    },
    productItem: {
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e4e7',
    },
    productStock: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a2b49',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#dc2626',
        marginBottom: 20,
    },
});