// components/ImageManager.tsx
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, FlatList, Modal } from 'react-native';

interface ImageManagerProps {
  images?: string[];
  onRemoveImage?: (index: number) => void;
  showRemoveButton?: boolean;
  enablePreview?: boolean;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  images = [],
  onRemoveImage,
  showRemoveButton = true,
  enablePreview = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(images.length > 0 ? images[0] : null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleImagePress = (uri: string, index: number) => {
    if (enablePreview) {
      setSelectedImage(uri);
      setCurrentImageIndex(index);
      setPreviewVisible(true);
    } else {
      setSelectedImage(uri);
    }
  };

  const navigateImage = (direction: 'left' | 'right') => {
    let newIndex =
      direction === 'left'
        ? currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
        : currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <View style={styles.mainImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.mainImage} />
          {showRemoveButton && onRemoveImage && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                const indexToRemove = images.indexOf(selectedImage);
                if (indexToRemove !== -1) onRemoveImage(indexToRemove);
              }}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyImage}>
          <Text style={styles.emptyText}>Không có ảnh</Text>
        </View>
      )}

      {images.length > 0 && (
        <FlatList
          data={images}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handleImagePress(item, index)} style={styles.thumbnailContainer}>
              <Image source={{ uri: item }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.thumbnailList}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {enablePreview && (
        <Modal visible={previewVisible} transparent onRequestClose={() => setPreviewVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.navigationButton} onPress={() => navigateImage('left')}>
              <Text style={styles.navigationButtonText}>❮</Text>
            </TouchableOpacity>
            <Image source={{ uri: selectedImage || '' }} style={styles.modalImage} resizeMode="contain" />
            <TouchableOpacity
              style={[styles.navigationButton, styles.navigationButtonRight]}
              onPress={() => navigateImage('right')}
            >
              <Text style={styles.navigationButtonText}>❯</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPreviewVisible(false)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 10 },
  mainImageContainer: { position: 'relative', width: '120%', height: 400, alignItems: 'center', justifyContent: 'center' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 10, backgroundColor: '#f8f9fa' },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  emptyImage: {
    width: '90%',
    height: 400,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: '#aaa', fontSize: 16 },
  thumbnailList: { flexDirection: 'row', gap: 10, paddingHorizontal: 10, marginTop: 10 },
  thumbnailContainer: { borderRadius: 10, overflow: 'hidden' },
  thumbnail: { width: 100, height: 100, borderRadius: 10, borderWidth: 2, borderColor: '#ddd' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: '80%' },
  navigationButton: {
    position: 'absolute',
    top: '50%',
    left: 20,
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationButtonRight: { left: 'auto', right: 20 },
  navigationButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});