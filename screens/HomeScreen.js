import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal, Dimensions, Alert, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;
const albumSize = (screenWidth - 16 * 2 - 10 * 2) / 3;

const UNSPLASH_ACCESS_KEY = 'ieNut-c4yCxp7Dfaes5apXCwQXaaMA9KYQyFEmr9P9Q';

const upgradePackages = [
  { photos: 18, price: 9 },
  { photos: 36, price: 18 },
  { photos: 72, price: 27 },
];

const HomeScreen = (props) => {
  const navigation = useNavigation();
  const [activeAlbums, setActiveAlbums] = useState([]);
  const [readyToPrintAlbums, setReadyToPrintAlbums] = useState([]);
  const [onTheWayAlbums, setOnTheWayAlbums] = useState([]);
  const [arrivedAlbums, setArrivedAlbums] = useState([]);

  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [selectedReadyToPrintAlbum, setSelectedReadyToPrintAlbum] = useState(null);

  // Address form fields
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [filmOptionModal, setFilmOptionModal] = useState({
    visible: false,
    album: null,
  });
  const [selectedPhotoUpgrade, setSelectedPhotoUpgrade] = useState(null);
  
  const [newAlbumName, setNewAlbumName] = useState('');

  const selectedTab = props.tab || 'Active';

  useEffect(() => {
    const q = query(collection(db, 'albums'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const active = [];
      const readyToPrint = [];
      const onTheWay = [];
      const arrived = [];

      querySnapshot.forEach((d) => {
        const album = { id: d.id, ...d.data() };
        switch (album.status) {
          case 'Active':
            active.push(album);
            break;
          case 'Ready to Print':
            readyToPrint.push(album);
            break;
          case 'On the Way':
            onTheWay.push(album);
            break;
          case 'Arrived':
            arrived.push(album);
            break;
        }
      });

      setActiveAlbums(active);
      setReadyToPrintAlbums(readyToPrint);
      setOnTheWayAlbums(onTheWay);
      setArrivedAlbums(arrived);
    });

    return () => unsubscribe();
  }, []);

  const fetchRandomPhoto = async (albumName) => {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query: albumName, per_page: 1 },
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      });
      if (response.data.results.length > 0) {
        return response.data.results[0].urls.small;
      } else {
        return 'https://via.placeholder.com/150';
      }
    } catch (error) {
      console.error('Error fetching photo from Unsplash:', error);
      return 'https://via.placeholder.com/150';
    }
  };

  const uploadPhoto = async (albumId, uri) => {
    try {
      const blob = await fetch(uri).then((res) => res.blob());
      const photoRef = ref(storage, `albums/${albumId}/${Date.now()}`);
      await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(photoRef);
      const albumRef = doc(db, 'albums', albumId);

      await updateDoc(albumRef, {
        photos: arrayUnion(downloadURL),
      });

      const updatedAlbumSnapshot = await getDoc(albumRef);
      const albumData = updatedAlbumSnapshot.data();

      if (albumData.photos.length >= albumData.photoLimit) {
        await updateDoc(albumRef, {
          status: 'Ready to Print',
        });
      }

      Alert.alert('Success', 'Photo added to album!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo.');
      console.error(error);
    }
  };

  const openCameraForPhoto = async (album) => {
    // Directly open camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Need camera permission.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(album.id, result.assets[0].uri);
    }
  };

  const handleReadyToPrintSelection = (album) => {
    // Show address modal
    setSelectedReadyToPrintAlbum(album);
    setIsAddressModalVisible(true);
  };

  const handleAlbumPress = (album) => {
    // Updated logic:
    switch (album.status) {
      case 'Active':
      openCameraForPhoto(album);
      break;
        break;
      case 'Ready to Print':
        handleReadyToPrintSelection(album);
        break;
        case 'On the Way':
          const mode = album.deliverymode || 'on the way';
          Alert.alert('Order Status', `Your order delivery status: ${mode}`);
          break;
      case 'Arrived':
        navigation.navigate('Gallery', { albumId: album.id, albumName: album.name });
        break;
    }
  };

  const confirmAddress = async () => {
    if (!recipientName.trim() || !phoneNumber.trim() || !country.trim() || !city.trim() || !street.trim() || !zipCode.trim()) {
      Alert.alert('Error', 'Please fill in all address fields.');
      return;
    }

    try {
      const albumRef = doc(db, 'albums', selectedReadyToPrintAlbum.id);
      await updateDoc(albumRef, {
        status: 'On the Way',
        address: {
          recipientName: recipientName.trim(),
          phoneNumber: phoneNumber.trim(),
          country: country.trim(),
          city: city.trim(),
          street: street.trim(),
          zipCode: zipCode.trim(),
        },
      });

      Alert.alert('Success', 'Your album is now On the Way!');
      closeModal();
    } catch (error) {
      console.error('Error updating album status:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again later.');
    }
  };

  const closeModal = () => {
    setIsAddressModalVisible(false);
    setSelectedReadyToPrintAlbum(null);
    setRecipientName('');
    setPhoneNumber('');
    setCountry('');
    setCity('');
    setStreet('');
    setZipCode('');
  };

  const openFilmOptionModal = (album) => {
    setFilmOptionModal({ visible: true, album });
    setSelectedPhotoUpgrade(null);
    setNewAlbumName(album.name); // populate current name
  };

  const closeFilmOptionModal = () => {
    setFilmOptionModal({ visible: false, album: null });
    setSelectedPhotoUpgrade(null);
  };

  const handleUpgradeToRealFilm = async () => {
    const album = filmOptionModal.album;
    const albumRef = doc(db, 'albums', album.id);

    let price;
    if (album.photoLimit === 18) {
      price = 9;
    } else if (album.photoLimit === 36) {
      price = 18;
    } else if (album.photoLimit === 72) {
      price = 27;
    } else {
      Alert.alert('Error', 'No defined price for this photo limit.');
      return;
    }

    Alert.alert(
      'Upgrade to Real Film',
      `This will cost $${price.toFixed(2)}. Confirm?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateDoc(albumRef, { demoMode: 'no' });
            Alert.alert('Success', 'Your film is now a real film!');
            closeFilmOptionModal();
          }
        }
      ]
    );
  };

  const handleAddPhotosToFilm = async (pkg) => {
    const album = filmOptionModal.album;
    const albumRef = doc(db, 'albums', album.id);
    const newLimit = album.photoLimit + pkg.photos;
    // No actual payment, just confirm
    Alert.alert(
      'Add Photos',
      `Add ${pkg.photos} photos for $${pkg.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', 
          onPress: async () => {
            await updateDoc(albumRef, {
              photoLimit: newLimit
            });
            Alert.alert('Success', `Photo limit updated to ${newLimit}!`);
            closeFilmOptionModal();
          }
        }
      ]
    );
  };

  const handlePlusButtonPress = async (album) => {
    if (album.demoMode === 'yes') {
      Alert.alert('Upgrade Required', 'Please upgrade to real film first.');
      return;
    }
  
    if (album.plusmode === 'off') {
      // plus mode off, buy for $0.99
      Alert.alert(
        'Buy Plus Mode',
        'Enable plus mode for $0.99?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: async () => {
              const albumRef = doc(db, 'albums', album.id);
              await updateDoc(albumRef, { plusmode: 'on' });
              Alert.alert('Success', 'Plus mode enabled!');
            }
          }
        ]
      );
    } else {
      // plus mode is on, open the gallery to pick one photo
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Need gallery permission.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadPhoto(album.id, result.assets[0].uri);
      }
    }
  };

  const handleProButtonPress = async (album) => {
    if (album.demoMode === 'yes') {
      Alert.alert('Upgrade Required', 'Please upgrade to real film first.');
      return;
    }
  
    if (album.promode === 'on') {
      // Pro mode is on, show photos. Let the user delete if album is Active or Ready to Print
      const canDelete = (album.status === 'Active' || album.status === 'Ready to Print');
      navigation.navigate('Gallery', { albumId: album.id, albumName: album.name, proMode: true, canDelete });
      return;
    }
  
    // If plusmode off, pro costs $2.99 and enables plus mode
    // If plusmode on, pro costs $2.00
    let cost = 2.99;
    let message = 'Enable pro mode for $2.99? This will also enable plus mode.';
    if (album.plusmode === 'on') {
      cost = 2.00;
      message = 'Enable pro mode for $2.00?';
    }
  
    Alert.alert(
      'Buy Pro Mode',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            const albumRef = doc(db, 'albums', album.id);
            if (album.plusmode === 'off') {
              await updateDoc(albumRef, { promode: 'on', plusmode: 'on' });
            } else {
              await updateDoc(albumRef, { promode: 'on' });
            }
            Alert.alert('Success', 'Pro mode enabled!');
          }
        }
      ]
    );
  };

  const handleSaveAlbumName = async () => {
    if (!filmOptionModal.album) return;
    const trimmedName = newAlbumName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a valid album name.');
      return;
    }

    try {
      const coverImage = await fetchRandomPhoto(trimmedName);
      const albumRef = doc(db, 'albums', filmOptionModal.album.id);
      await updateDoc(albumRef, {
        name: trimmedName,
        coverImage: coverImage,
      });
      Alert.alert('Success', 'Album name and cover updated!');
    } catch (error) {
      console.error('Error updating album name:', error);
      Alert.alert('Error', 'Failed to update album name. Please try again later.');
    }
  };

  const getBorderColor = (status) => {
    return '#00C853';
  };

  const renderAlbum = (album) => {
    const showButtons = album.status === 'Active' || album.status === 'Ready to Print';

    return (
      <View style={{ marginBottom: 20, position: 'relative', alignItems: 'center' }}>
        {showButtons && (
          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => openFilmOptionModal(album)}
          >
            <Ionicons name="settings-sharp" size={18} color="#000" />
          </TouchableOpacity>
        )}

        {showButtons && (
          <TouchableOpacity
            style={styles.proButton}
            onPress={() => handleProButtonPress(album)}
          >
            <Ionicons name="trash" size={18} color={album.promode === 'on' ? 'gold' : '#000'} />
          </TouchableOpacity>
        )}

        {showButtons && (
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => handlePlusButtonPress(album)}
          >
            <Ionicons name="add" size={20} color={album.plusmode === 'on' ? 'green' : '#000'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.albumContainer, { borderColor: getBorderColor(album.status) }]}
          onPress={() => handleAlbumPress(album)}
        >
          <View style={styles.albumInnerContent}>
            <View style={styles.textSection}>
              <Text style={styles.albumTitle}>{album.name}</Text>
              {album.demoMode === 'yes' && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO film</Text>
                </View>
              )}
              <Text style={styles.albumInfo}>{`${album.photos.length}/${album.photoLimit} photos`}</Text>
            </View>
            <View style={styles.imageSection}>
              <Image
                source={{ uri: album.coverImage }}
                style={styles.albumImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderArrivedAlbum = (album) => (
    <TouchableOpacity
      style={styles.gridAlbumContainer}
      onPress={() => handleAlbumPress(album)}
    >
      <Image
        source={{ uri: album.coverImage }}
        style={styles.albumCoverImage}
        resizeMode="cover"
      />
      <Text style={styles.albumGridTitle}>{album.name}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = (message) => (
    <Text style={styles.emptyStateText}>{message}</Text>
  );

  const renderTabHeader = () => {
    switch (selectedTab) {
      case 'Active':
        return "My active films - click to take a picture";
      case 'Ready to Print':
        return "My ready-to-print albums";
      case 'On the Way':
        return "My albums on the way";
      case 'Arrived':
        return "My albums";
      default:
        return "";
    }
  };

  const renderActiveTab = () => (
    <FlatList
      data={activeAlbums}
      renderItem={({ item }) => renderAlbum(item)}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyState('No active albums available.')}
    />
  );

  const renderReadyToPrintTab = () => (
    <FlatList
      data={readyToPrintAlbums}
      renderItem={({ item }) => renderAlbum(item)}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyState('No albums ready to print.')}
    />
  );

  const renderOnTheWayTab = () => (
    <FlatList
      data={onTheWayAlbums}
      renderItem={({ item }) => renderAlbum(item)}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyState('No albums on the way.')}
    />
  );

  const renderArrivedTab = () => (
    <FlatList
      data={arrivedAlbums}
      renderItem={({ item }) => renderArrivedAlbum(item)}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyState('No albums arrived yet.')}
      numColumns={3}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
    />
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Active':
        return renderActiveTab();
      case 'Ready to Print':
        return renderReadyToPrintTab();
      case 'On the Way':
        return renderOnTheWayTab();
      case 'Arrived':
        return renderArrivedTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.brandTitle}>REAL PIC</Text>
        <TouchableOpacity style={styles.buyNewFilmButton} onPress={() => navigation.navigate('PurchaseFilm')}>
          <Text style={styles.buyNewFilmButtonText}>buy new film</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tabHeaderText}>
        {renderTabHeader()}
      </Text>

      {renderTabContent()}

      {/* Address Modal */}
      <Modal visible={isAddressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Delivery Address</Text>
            <ScrollView style={{ width: '100%', marginBottom: 16 }} contentContainerStyle={{ paddingBottom: 10 }}>
              <TextInput style={styles.modalInput} placeholder="Recipient Name" value={recipientName} onChangeText={setRecipientName} />
              <TextInput style={styles.modalInput} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
              <TextInput style={styles.modalInput} placeholder="Country" value={country} onChangeText={setCountry} />
              <TextInput style={styles.modalInput} placeholder="City" value={city} onChangeText={setCity} />
              <TextInput style={styles.modalInput} placeholder="Street and Number" value={street} onChangeText={setStreet} />
              <TextInput style={styles.modalInput} placeholder="Zip Code" keyboardType="number-pad" value={zipCode} onChangeText={setZipCode} />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={confirmAddress}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Film Option Modal */}
      <Modal visible={filmOptionModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'stretch' }]}>
            {filmOptionModal.album && (
              <>
                {/* Edit film name section */}
                <Text style={styles.modalTitle}>Edit film name</Text>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Film name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new film name"
                  value={newAlbumName}
                  onChangeText={setNewAlbumName}
                />
                <TouchableOpacity
                  style={[styles.modalPrimaryButton, { marginTop: 8, marginBottom: 20 }]}
                  onPress={handleSaveAlbumName}
                >
                  <Text style={styles.modalButtonText}>save new film name</Text>
                </TouchableOpacity>

                {filmOptionModal.album.demoMode === 'yes' ? (
                  // Demo mode on: show upgrade option
                  <>
                    <Text style={{marginBottom:20, textAlign:'center'}}>Upgrade to real film to add more features.</Text>
                    <TouchableOpacity
                      style={styles.modalPrimaryButton}
                      onPress={handleUpgradeToRealFilm}
                    >
                      <Text style={styles.modalButtonText}>Upgrade to Real Film</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalCancelButton, { marginTop: 20 }]}
                      onPress={closeFilmOptionModal}
                    >
                      <Text style={styles.modalCancelButtonText}>close</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Demo mode off: show add photos to film packages
                  <>
                    <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>Add photos to film</Text>
                    <Text style={{ marginBottom:20, textAlign:'center' }}>Choose a package to increase the photo limit.</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                      {upgradePackages.map((pkg, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            flex: 1,
                            marginHorizontal: 4,
                            backgroundColor: '#FFF',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#CCC',
                            padding: 8,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onPress={() => handleAddPhotosToFilm(pkg)}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{pkg.photos} photos</Text>
                          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>${pkg.price}</Text>
                          <Text style={{ fontSize: 12, textAlign: 'center' }}>Add {pkg.photos} photos</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.modalCancelButton, { marginTop: 20 }]}
                      onPress={closeFilmOptionModal}
                    >
                      <Text style={styles.modalCancelButtonText}>close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const darkText = '#333';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1F0',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  buyNewFilmButton: {
    backgroundColor: '#0045FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buyNewFilmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabHeaderText: {
    fontSize: 16,
    color: '#001B6B',
    textDecorationLine: 'underline',
    marginVertical: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  albumContainer: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#FFF',
    padding: 12,
    width: '80%',
    alignSelf: 'center',
  },
  albumInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textSection: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  demoBadge: {
    backgroundColor: '#FFA500',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  demoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  albumInfo: {
    fontSize: 14,
    color: '#001B6B',
  },
  imageSection: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#CCC'
  },
  albumImage: {
    width: '100%',
    height: '100%'
  },
  gearButton: {
    position: 'absolute',
    left: 0,
    top: 30,
    width: 30,
    height: 30,
    backgroundColor: '#FFF',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  proButton: {
    position: 'absolute',
    right: 0,
    top: 15,
    width: 30,
    height: 30,
    backgroundColor: '#FFF',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  plusButton: {
    position: 'absolute',
    right: 0,
    top: 60,
    width: 30,
    height: 30,
    backgroundColor: '#FFF',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  gridAlbumContainer: {
    width: albumSize,
    marginBottom: 10,
    alignItems: 'center',
  },
  albumGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: darkText,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    color: '#333',
    marginBottom: 12
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  modalPrimaryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#555',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  modalCancelButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  albumCoverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
});

export default HomeScreen;