import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import { doc, onSnapshot, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const screenWidth = Dimensions.get('window').width;
const albumSize = (screenWidth - 16 * 2 - 10 * 2) / 3; // Adjust size for albums

const GalleryScreen = ({ route, navigation }) => {
  const albumId = route.params?.albumId || null;
  const albumName = route.params?.albumName || 'Album Gallery';
  const canDelete = route.params?.canDelete || false; // parameter to allow deletion

  const [photos, setPhotos] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (albumId) {
      // Fetch album by ID and listen for changes
      const albumRef = doc(db, 'albums', albumId);
      const unsubscribe = onSnapshot(albumRef, (docSnap) => {
        if (docSnap.exists()) {
          const albumData = docSnap.data();
          setPhotos(albumData?.photos || []);
        } else {
          setPhotos([]);
        }
      });

      return () => unsubscribe();
    }
  }, [albumId]);

  const openPhotoModal = (index) => {
    setSelectedPhotoIndex(index);
    setIsModalVisible(true);
  };

  const closePhotoModal = () => {
    setIsModalVisible(false);
  };

  const updateAlbumStatusAfterDeletion = async (albumId) => {
    try {
      const albumRef = doc(db, 'albums', albumId);
      const updatedAlbumSnapshot = await getDoc(albumRef);
      const albumData = updatedAlbumSnapshot.data();

      let newStatus = 'Active';
      if (albumData.photos.length === albumData.photoLimit) {
        newStatus = 'Ready to Print';
      } else if (albumData.photos.length < albumData.photoLimit) {
        newStatus = 'Active';
      }

      await updateDoc(albumRef, {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating album status after deletion:', error);
    }
  };

  const deleteCurrentPhoto = async () => {
    if (selectedPhotoIndex < 0 || selectedPhotoIndex >= photos.length) return;

    const photoToDelete = photos[selectedPhotoIndex];
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const albumRef = doc(db, 'albums', albumId);
              await updateDoc(albumRef, {
                photos: arrayRemove(photoToDelete)
              });

              // Update local state
              const updatedPhotos = photos.filter((_, i) => i !== selectedPhotoIndex);
              setPhotos(updatedPhotos);

              // After deletion, update the album status based on new photo count
              await updateAlbumStatusAfterDeletion(albumId);

              if (updatedPhotos.length === 0) {
                // No photos left, close modal
                closePhotoModal();
              } else {
                // If there are still photos left, ensure selected index is valid
                const newIndex = Math.min(selectedPhotoIndex, updatedPhotos.length - 1);
                setSelectedPhotoIndex(newIndex);
              }

              Alert.alert('Deleted', 'The photo has been deleted.');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderPhoto = ({ item, index }) => (
    <TouchableOpacity onPress={() => openPhotoModal(index)}>
      <Image source={{ uri: item }} style={styles.photo} />
    </TouchableOpacity>
  );

  const renderFullPhoto = ({ item }) => (
    <View style={styles.fullPhotoContainer}>
      <Image source={{ uri: item }} style={styles.fullPhoto} resizeMode="contain" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{albumName}</Text>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
      />

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closePhotoModal}>
        <View style={styles.modalOverlay}>
          <FlatList
            data={photos}
            renderItem={renderFullPhoto}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedPhotoIndex}
            onMomentumScrollEnd={ev => {
              const offsetX = ev.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / screenWidth);
              setSelectedPhotoIndex(newIndex);
            }}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
          <TouchableOpacity style={styles.closeButton} onPress={closePhotoModal}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {canDelete && photos.length > 0 && (
            <TouchableOpacity style={styles.deleteButton} onPress={deleteCurrentPhoto}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  photo: {
    width: albumSize,
    height: albumSize,
    margin: 6,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default GalleryScreen;