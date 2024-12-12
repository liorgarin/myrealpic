import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import axios from 'axios';
import { WebView } from 'react-native-webview';

const UNSPLASH_ACCESS_KEY = 'ieNut-c4yCxp7Dfaes5apXCwQXaaMA9KYQyFEmr9P9Q';

const PurchaseFilmScreen = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [couponAlbum, setCouponAlbum] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isNamingAlbum, setIsNamingAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [showPayPalWebView, setShowPayPalWebView] = useState(false);
  const [payPalCheckoutUrl, setPayPalCheckoutUrl] = useState(null);

  // New states for coupon flow
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validCouponCode, setValidCouponCode] = useState(null); // store the valid coupon code once verified

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerTitle: () => null,
      headerBackTitleVisible: false,
      headerLeft: () => <DrawerToggleButton />,
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const filmPackages = [
    {
      label: '18 photos',
      price: '$9',
      photoLimit: 18,
      description: 'Perfect for weekend trips and short events'
    },
    {
      label: '36 photos',
      price: '$18',
      photoLimit: 36,
      description: 'Perfect for a few days away and small outings',
      mostPopular: true
    },
    {
      label: '72 photos',
      price: '$27',
      photoLimit: 72,
      description: 'Perfect for extended travels and great stories'
    },
  ];

  const fetchRandomPhoto = async (albumName) => {
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
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

  const handlePackageSelect = (pkg) => {
    if (selectedPackage && selectedPackage.label === pkg.label) {
      setSelectedPackage(null);
    } else {
      setSelectedPackage(pkg);
    }
  };

  const handlePurchaseConfirm = () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package first.');
      return;
    }
    setDemoMode(false);
    openPaymentModal();
  };

  const handleDemoConfirm = () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package first.');
      return;
    }
    setDemoMode(true);
    setIsNamingAlbum(true);
    setAlbumName('');
  };

  const openPaymentModal = () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'No package selected.');
      return;
    }
    setIsPaymentModalVisible(true);
  };

  const handleCouponClick = () => {
    // Instead of directly opening naming album,
    // open coupon input modal
    setCouponCode('');
    setIsCouponModalVisible(true);
  };

  const verifyCoupon = async () => {
    // Check if a doc with code == couponCode exists in `coupons` collection
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code.');
      return;
    }

    const couponRef = doc(db, 'coupons', couponCode.trim());
    const couponSnap = await getDoc(couponRef);
    if (couponSnap.exists()) {
      // Valid coupon
      setIsCouponModalVisible(false);
      setValidCouponCode(couponCode.trim());
      setCouponAlbum(true);
      setIsNamingAlbum(true);
    } else {
      Alert.alert('Invalid Coupon', 'This coupon code is not valid. Please try again.');
    }
  };

  const createCouponAlbum = async () => {
    if (albumName.trim() === '') {
      Alert.alert('Error', 'Please enter a valid album name.');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }

      const coverImage = await fetchRandomPhoto(albumName);

      // Generate a unique order number
      const ordernum = 'ORD' + Date.now();

      await addDoc(collection(db, 'albums'), {
        userId: userId,
        name: albumName,
        photoLimit: 6,
        photos: [],
        status: 'Active',
        coverImage: coverImage,
        createdAt: new Date(),
        demoMode: 'no',
        promode: 'off',
        plusmode: 'off',
        ordernum: ordernum
      });

      // Delete the used coupon from 'coupons' collection
      if (validCouponCode) {
        const couponRef = doc(db, 'coupons', validCouponCode);
        await deleteDoc(couponRef);
      }

      Alert.alert('Success', 'Your free 6-photo album is created!');
      setIsNamingAlbum(false);
      setCouponAlbum(false);
      setValidCouponCode(null);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error creating coupon album: ', error.message);
      Alert.alert('Error', 'Failed to create album. Please try again later.');
    }
  };

  const createNormalAlbum = async () => {
    if (albumName.trim() === '') {
      Alert.alert('Error', 'Please enter a valid album name.');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }

      const coverImage = await fetchRandomPhoto(albumName);
      const photoLimit = selectedPackage ? selectedPackage.photoLimit : 6;
      const albumDemoMode = demoMode ? 'yes' : 'no';

      const ordernum = 'ORD' + Date.now();

      await addDoc(collection(db, 'albums'), {
        userId: userId,
        name: albumName,
        photoLimit: photoLimit,
        photos: [],
        status: 'Active',
        coverImage: coverImage,
        createdAt: new Date(),
        demoMode: albumDemoMode,
        promode: 'off',
        plusmode: 'off',
        ordernum: ordernum
      });

      Alert.alert('Success', 'Album created successfully!');
      setIsNamingAlbum(false);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error creating album: ', error.message);
      Alert.alert('Error', 'Failed to create album. Please try again later.');
    }
  };

  const createAlbum = async () => {
    if (couponAlbum) {
      await createCouponAlbum();
    } else {
      await createNormalAlbum();
    }
  };

  const onWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    const successUrl = 'https://your-server.com/success';
    const cancelUrl = 'https://your-server.com/cancel';

    if (url.startsWith(successUrl)) {
      setShowPayPalWebView(false);
      setIsPaymentModalVisible(false);
      setAlbumName('');
      setIsNamingAlbum(true);
    } else if (url.startsWith(cancelUrl)) {
      setShowPayPalWebView(false);
      setIsPaymentModalVisible(false);
    }
  };

  const startPaypalCheckout = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'No package selected.');
      return;
    }

    const numericPrice = selectedPackage.price.replace('$', '');

    setIsPaymentModalVisible(false);
    try {
      const response = await axios.post('https://abc123.ngrok.io/create-order', {
        price: numericPrice
      });

      const { approveLink } = response.data;
      setPayPalCheckoutUrl(approveLink);
      setShowPayPalWebView(true);
    } catch (error) {
      console.error('Error starting PayPal checkout:', error);
      Alert.alert('Error', 'Failed to start PayPal checkout.');
    }
  };

  const isPackageSelected = !!selectedPackage;
  const mostPopularPackage = filmPackages.find(pkg => pkg.mostPopular);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Choose Your Film Package</Text>
        <Text style={styles.subtitle}>Select the number of photos that fits your needs.</Text>

        <View style={styles.packagesContainer}>
          {mostPopularPackage && (
            <View style={styles.mostPopularGlobalBadge}>
              <Text style={styles.mostPopularText}>MOST POPULAR</Text>
            </View>
          )}

          <View style={styles.packagesRow}>
            {filmPackages.map((pkg, index) => {
              const isSelected = selectedPackage && selectedPackage.label === pkg.label;
              return (
                <View key={index} style={[styles.packageCard, isSelected && styles.packageSelected]}>
                  <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
                    <Text style={styles.packageTitle}>{pkg.label}</Text>
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                  </View>
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.chooseButton, isSelected && styles.chooseButtonSelected]}
                      onPress={() => handlePackageSelect(pkg)}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      ) : (
                        <Text style={styles.chooseButtonText}>choose</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {isPackageSelected && (
          <>
            <TouchableOpacity
              style={[styles.fullWidthButton, { backgroundColor: '#007BFF', marginTop: 24 }]}
              onPress={handlePurchaseConfirm}
            >
              <Text style={styles.fullWidthButtonText}>Purchase a New Film</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fullWidthButton, { backgroundColor: '#FFA500', marginTop: 12 }]}
              onPress={handleDemoConfirm}
            >
              <Text style={styles.fullWidthButtonText}>Add as Demo Film</Text>
            </TouchableOpacity>
          </>
        )}

        {!isPackageSelected && (
          <TouchableOpacity
            style={[styles.couponBar, { marginTop: 24 }]}
            onPress={handleCouponClick}
          >
            <Text style={styles.couponBarText}>got coupon ? click here</Text>
          </TouchableOpacity>
        )}

        {/* Payment Modal */}
        <Modal visible={isPaymentModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Complete Your Payment</Text>
              <Text style={{ marginBottom: 16 }}>
                Price: {selectedPackage ? selectedPackage.price : ''}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={startPaypalCheckout}>
                  <Text style={styles.modalButtonText}>Pay with PayPal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsPaymentModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* PayPal WebView Modal */}
        <Modal visible={showPayPalWebView} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '90%', height: '80%' }]}>
              <Text style={styles.modalTitle}>Pay with PayPal</Text>
              <View style={{ flex: 1, width: '100%' }}>
                <WebView
                  source={{ uri: payPalCheckoutUrl ? payPalCheckoutUrl : 'https://example.com/checkout' }}
                  onNavigationStateChange={onWebViewNavigationStateChange}
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowPayPalWebView(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Coupon Code Modal */}
        <Modal visible={isCouponModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Your Coupon Code</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={verifyCoupon}>
                  <Text style={styles.modalButtonText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsCouponModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Album Naming Modal */}
        <Modal visible={isNamingAlbum} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Name Your Album</Text>
              {couponAlbum && (
                <Text style={{ marginBottom: 8, fontSize: 14, textAlign: 'center' }}>
                  You got a free 6-photo album!
                </Text>
              )}
              <TextInput
                style={styles.modalInput}
                placeholder="Enter album name"
                value={albumName}
                onChangeText={setAlbumName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={createAlbum}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setIsNamingAlbum(false);
                    setCouponAlbum(false);
                    setValidCouponCode(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const primaryColor = '#007BFF';
const darkText = '#333';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECF4F3',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    color: darkText,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  packagesContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  mostPopularGlobalBadge: {
    backgroundColor: '#007BFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: -10,
    zIndex: 10,
  },
  mostPopularText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  packagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  packageCard: {
    width: '32%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 220,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: darkText,
    textAlign: 'center',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  packageDescription: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 12,
  },
  chooseButton: {
    backgroundColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 8,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButtonSelected: {
    backgroundColor: primaryColor,
  },
  chooseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  packageSelected: {
    borderWidth: 2,
    borderColor: primaryColor,
  },
  couponBar: {
    backgroundColor: '#999',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  couponBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  fullWidthButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  fullWidthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: darkText,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: primaryColor,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default PurchaseFilmScreen;