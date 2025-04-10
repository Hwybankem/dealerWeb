import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFirestore } from '../../context/storageFirebase';
import { StatusToggle } from '../../components/common/UI/StatusToggle';
import { ImageManager } from '../../components/common/UI/ImageManager';
import * as ImagePicker from 'expo-image-picker';
import BackButton from '../../components/common/UI/backButton';
import Storage from '@/components/utils/storage';
import NotificationModal from '@/components/common/UI/notificationModal';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    categories: string[];
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

interface Category {
    id: string;
    name: string;
    parentId?: string;
    parentName?: string;
    subCategories?: Category[];
}

export default function ProductDetail() {
    const { id, stock: stockParam } = useLocalSearchParams();
    const { getDocuments } = useFirestore();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    const loadData = async () => {
        try {
            console.log('Tải dữ liệu cho ID sản phẩm:', id);
            setLoading(true);
            
            const productsData = await getDocuments('products');
            const productData = productsData.find((p: any) => p.id === id);
            
            if (productData) {
                const formattedProduct: Product = {
                    id: productData.id || '',
                    name: productData.name || '',
                    description: productData.description || '',
                    price: productData.price || 0,
                    stock: stockParam ? parseInt(stockParam as string) : (productData.stock || 0),
                    images: productData.images || [],
                    categories: productData.categories || [],
                    status: productData.status || 'active',
                    createdAt: productData.createdAt?.toDate() || new Date(),
                    updatedAt: productData.updatedAt?.toDate() || new Date()
                };
                setProduct(formattedProduct);
                console.log('Tải dữ liệu sản phẩm thành công');
            }

            const categoriesData = await getDocuments('categories');
            console.log('Số danh mục đã tải:', categoriesData.length);

            const categoryMap = new Map<string, Category>();
            const rootCategories: Category[] = [];

            categoriesData.forEach((category: any) => {
                categoryMap.set(category.id, {
                    id: category.id,
                    name: category.name,
                    parentId: category.parentId,
                    parentName: category.parentName,
                    subCategories: []
                });
            });

            categoriesData.forEach((category: any) => {
                const categoryNode = categoryMap.get(category.id)!;
                if (category.parentId) {
                    const parent = categoryMap.get(category.parentId);
                    if (parent) {
                        parent.subCategories = parent.subCategories || [];
                        parent.subCategories.push(categoryNode);
                    }
                } else {
                    rootCategories.push(categoryNode);
                }
            });

            setCategories(rootCategories);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    if (loading) return <View style={styles.container}><Text>Đang tải...</Text></View>;

    if (!product) return <View style={styles.container}><Text>Không tìm thấy sản phẩm</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <BackButton path={'/products/product'} />
                <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
            </View>

            <View style={styles.mainContent}>
                <View style={styles.imageSection}>
                    <ImageManager
                        images={product.images}
                        showRemoveButton={false}
                    />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </Text>
                    <Text style={styles.stockStatus}>
                        {product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}
                    </Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <Text style={styles.description}>{product.description}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Danh mục</Text>
                        <View style={styles.categoriesContainer}>
                            {(() => {
                                const elements: JSX.Element[] = [];
                                
                                const findAndRenderCategory = (categoryList: Category[], categoryName: string): boolean => {
                                    for (const cat of categoryList) {
                                        if (cat.name === categoryName) {
                                            elements.push(
                                                <View key={cat.id} style={styles.categoryTag}>
                                                    <Text style={styles.categoryText}>{cat.name}</Text>
                                                </View>
                                            );
                                            return true;
                                        }
                                        
                                        if (cat.subCategories && cat.subCategories.length > 0) {
                                            const found = findAndRenderCategory(cat.subCategories, categoryName);
                                            if (found) return true;
                                        }
                                    }
                                    return false;
                                };
                                
                                product.categories?.forEach(categoryName => {
                                    const categoryFound = findAndRenderCategory(categories, categoryName);
                                    if (!categoryFound) {
                                        elements.push(
                                            <View key={categoryName} style={styles.categoryTag}>
                                                <Text style={styles.categoryText}>{categoryName}</Text>
                                            </View>
                                        );
                                    }
                                });
                                
                                return elements;
                            })()}
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2b49',
        flex: 1,
        textAlign: 'center',
    },
    mainContent: {
        flex: 1,
        padding: 15,
    },
    imageSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        alignItems: 'center',
    },
    infoSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    productName: {
        fontSize: 30,
        fontWeight: '700',
        color: '#1a2b49',
        marginBottom: 10,
    },
    productPrice: {
        fontSize: 26,
        color: '#e63946',
        fontWeight: '600',
        marginBottom: 10,
    },
    stockStatus: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a2b49',
        marginRight: 8,
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e4e7',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2b49',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4a5568',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    categoryTag: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    categoryText: {
        color: '#1976d2',
        fontSize: 14,
        fontWeight: '500',
    }
});