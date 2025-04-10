import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, SafeAreaView, Platform, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useFirestore } from '../../context/storageFirebase';
import BackButton from '../../components/common/UI/backButton';
import AddButton from '../../components/common/UI/addButton';
import removeAccents from '@/components/utils/stringUtils'; 
import Storage from '@/components/utils/storage';

interface Category {
    id: string;
    name: string;
    parentId?: string;
    parentName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    categories: string[];
    createdAt: Date;
    updatedAt: Date;
}

export default function App() {
    const { getDocuments } = useFirestore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [highlightedCategories, setHighlightedCategories] = useState<string[]>([]);


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
        filterProducts(searchQuery, selectedCategory);
    }, [searchQuery, selectedCategory, products]);

    const loadData = async (vendorId: string) => {
        try {
            setLoading(true);
            // Load categories
            const categoriesData = await getDocuments('categories');
            const formattedCategories: Category[] = categoriesData.map((category: any) => ({
                id: category.id,
                name: category.name,
                parentId: category.parentId || null,
                parentName: category.parentName || null,
                createdAt: category.createdAt?.toDate() || new Date(),
                updatedAt: category.updatedAt?.toDate() || new Date()
            }));

            // Sắp xếp danh mục: danh mục cha lên trước, con xuống dưới
            const sortedCategories = formattedCategories.sort((a, b) => {
                if (!a.parentId && b.parentId) return -1;
                if (a.parentId && !b.parentId) return 1;
                return 0;
            });

            setCategories(sortedCategories);

            // Load products
            const productsData = await getDocuments('products');
            const formattedProducts: Product[] = productsData.map((product: any) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                images: product.images,
                categories: product.categories,
                createdAt: product.createdAt?.toDate() || new Date(),
                updatedAt: product.updatedAt?.toDate() || new Date()
            }));

            // Load vendor_products để lấy stock
            const vendorProductsData = await getDocuments('vendor_products');
            const vendorProducts = vendorProductsData.filter((doc: any) => doc.id === vendorId);
            console.log('vendorProducts', vendorProducts);
            
            // Lọc sản phẩm chỉ lấy những sản phẩm có trong vendorProducts
            const productsWithStock = formattedProducts.filter(product => 
                vendorProducts.some(vp => vp.products === product.name)
            ).map(product => {
                const vendorProduct = vendorProducts.find(vp => vp.products === product.name);
                return {
                    ...product,
                    stock: vendorProduct ? vendorProduct.stock : 0
                };
            });

            setProducts(productsWithStock);
            setFilteredProducts(productsWithStock);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = (query: string, categoryId: string | null) => {
        let filtered = [...products];

        // Lọc theo tìm kiếm
        if (query.trim()) {
            setHasSearched(true);
            const searchTerms = removeAccents(query.toLowerCase()).split(' ').filter(term => term);
            filtered = filtered.filter(product => {
                const productName = removeAccents(product.name.toLowerCase());
                return searchTerms.every(term => productName.includes(term));
            });

            if (filtered.length > 0) {
                // Tìm tất cả các danh mục chứa sản phẩm được tìm thấy
                const foundCategories = new Set<string>();
                filtered.forEach(product => {
                    product.categories.forEach(catId => {
                        const category = categories.find(c => c.id === catId);
                        if (category) {
                            if (category.parentId) {
                                foundCategories.add(category.parentId);
                            }
                            foundCategories.add(catId);
                        }
                    });
                });

                // Mở rộng tất cả các danh mục chứa sản phẩm
                setExpandedCategories(Array.from(foundCategories));

                // Kiểm tra xem các sản phẩm có cùng danh mục không
                const firstProduct = filtered[0];
                const allProductsInSameCategory = filtered.every(product =>
                    product.categories.some(catId =>
                        firstProduct.categories.includes(catId)
                    )
                );

                if (allProductsInSameCategory) {
                    // Nếu tất cả sản phẩm cùng danh mục, chọn danh mục đó
                    setSelectedCategory(firstProduct.categories[0]);
                } else {
                    // Nếu sản phẩm ở các danh mục khác nhau, hiển thị trong "Tất cả sản phẩm"
                    setSelectedCategory(null);
                }
            }
        } else if (hasSearched) {
            // Chỉ reset khi đã từng tìm kiếm trước đó
            setSelectedCategory(null);
            setExpandedCategories([]);
            setHasSearched(false);
        }

        // Lọc theo danh mục nếu có
        if (categoryId) {
            filtered = filtered.filter(product =>
                product.categories.includes(categoryId)
            );
        }

        setFilteredProducts(filtered);
    };

    const handleCategoryPress = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        // Reset trạng thái tìm kiếm khi người dùng chọn danh mục
        setHasSearched(false);
    };

    const handleProductPress = (product: Product) => {
        // Chuyển đến trang chi tiết sản phẩm với thông tin stock
        router.push({
            pathname: "/products/[id]",
            params: { 
                id: product.id,
                stock: product.stock.toString()
            }
        } as any);
    };

    const toggleCategoryExpand = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const renderCategoryItem = (category: Category) => {
        // Lọc ra các danh mục con
        const subCategories = categories.filter(cat => cat.parentId === category.id);
        const hasSubCategories = subCategories.length > 0;
        const isExpanded = expandedCategories.includes(category.id);
        const isSelected = selectedCategory === category.id;
        const isHighlighted = highlightedCategories.includes(category.id);

        // Chỉ render danh mục cha (không có parentId)
        if (category.parentId) return null;

        return (
            <View key={category.id}>
                <TouchableOpacity
                    style={[
                        styles.categoryItem,
                        isSelected && styles.selectedCategory,
                        isHighlighted && styles.highlightedCategory
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                >
                    <View style={styles.categoryHeader}>
                        <Text style={[
                            styles.categoryText,
                            isSelected && styles.selectedCategoryText,
                            isHighlighted && styles.highlightedCategoryText
                        ]}>
                            {category.name}
                        </Text>
                        {hasSubCategories && (
                            <TouchableOpacity
                                onPress={() => toggleCategoryExpand(category.id)}
                                style={styles.expandButton}
                            >
                                <Text style={styles.expandButtonText}>
                                    {isExpanded ? '▼' : '▶'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>

                {isExpanded && hasSubCategories && (
                    <View style={styles.subCategoriesContainer}>
                        {subCategories.map(subCategory => (
                            <TouchableOpacity
                                key={subCategory.id}
                                style={[
                                    styles.subCategoryItem,
                                    selectedCategory === subCategory.id && styles.selectedCategory,
                                    highlightedCategories.includes(subCategory.id) && styles.highlightedCategory
                                ]}
                                onPress={() => handleCategoryPress(subCategory.id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === subCategory.id && styles.selectedCategoryText,
                                    highlightedCategories.includes(subCategory.id) && styles.highlightedCategoryText
                                ]}>
                                    {subCategory.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainContent}>
                <View style={styles.header}>
                    <BackButton path={'/navigator'} />
                    <Text style={styles.title}>Danh sách sản phẩm</Text>
                    <AddButton path={'/products/addProducts'} text={'sản phẩm'} />
                </View>

                {/* search sản phẩm */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchQuery('')}
                        >
                            <Text style={styles.clearButtonText}>×</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.categoriesSide}>
                        <TouchableOpacity
                            style={[
                                styles.categoryItem,
                                !selectedCategory && styles.selectedCategory
                            ]}
                            onPress={() => handleCategoryPress(null)}
                        >
                            <Text style={[
                                styles.categoryText,
                                !selectedCategory && styles.selectedCategoryText
                            ]}>
                                Tất cả sản phẩm
                            </Text>
                        </TouchableOpacity>
                        <ScrollView style={styles.categoryList}>
                            {categories.map(category => renderCategoryItem(category))}
                        </ScrollView>
                    </View>

                    <FlatList
                        data={filteredProducts}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.productCard}
                                onPress={() => handleProductPress(item)}
                            >
                                <Image
                                    source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.productPrice}>
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(item.price)}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.viewDetailButton}
                                        onPress={() => handleProductPress(item)}
                                    >
                                        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                        numColumns={Platform.OS === 'web' ? 4 : 2}
                        contentContainerStyle={styles.productGrid}
                        columnWrapperStyle={styles.productRow}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                {loading ? 'Đang tải...' : 'Không có sản phẩm nào'}
                            </Text>
                        }
                    />
                </View>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        width: '100%',
    },
    mainContent: {
        flex: 1,
        maxWidth: 1920,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        letterSpacing: 0.5,
    },

    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 20,
        marginTop: 20,
    },
    categoriesSide: {
        width: '20%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryList: {
        flex: 1,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    expandButton: {
        padding: 5,
        marginLeft: 10,
    },
    expandButtonText: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    subCategoriesContainer: {
        marginLeft: 20,
    },
    categoryItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    subCategoryItem: {
        padding: 10,
        paddingLeft: 20,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: '#f1f3f5',
    },
    selectedCategory: {
        backgroundColor: '#3498db',
    },
    categoryText: {
        fontSize: 15,
        color: '#2c3e50',
        fontWeight: '500',
    },
    selectedCategoryText: {
        color: '#fff',
    },
    productGrid: {
        padding: 10,
    },
    productRow: {
        gap: 20,
        justifyContent: 'flex-start',
    },
    productCard: {
        flex: 1,
        maxWidth: Platform.OS === 'web' ? '23%' : '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    productImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    productInfo: {
        padding: 15,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#2c3e50',
        height: 44,
        lineHeight: 22,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginBottom: 12,
    },
    viewDetailButton: {
        backgroundColor: '#3498db',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewDetailText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 40,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchContainer: {
        position: 'relative',
        marginBottom: 20,
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
    },
    searchInput: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#2c3e50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clearButton: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -12 }],
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#95a5a6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    highlightedCategory: {
        backgroundColor: '#f1c40f',
    },
    highlightedCategoryText: {
        color: '#2c3e50',
        fontWeight: 'bold',
    },
});
