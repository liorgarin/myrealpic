import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const EnterCouponScreen = ({ navigation }) => {
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const validateCoupon = async () => {
    if (couponCode.trim() === '') {
      Alert.alert('Error', 'Please enter a valid coupon code.');
      return;
    }

    try {
      setIsProcessing(true);
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      let isValid = false;

      querySnapshot.forEach((doc) => {
        if (doc.id === couponCode && doc.data().isActive) {
          isValid = true;
        }
      });

      if (isValid) {
        await createAlbumWithCoupon();
      } else {
        Alert.alert('Invalid Coupon', 'The coupon code is invalid or expired.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate coupon.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const createAlbumWithCoupon = async () => {
    try {
      await addDoc(collection(db, 'albums'), {
        userId: auth.currentUser.uid,
        name: 'My Coupon Album',
        photoLimit: 6,
        photos: [],
        status: 'Active',
        coverImage: 'default-coupon.jpg',
      });

      Alert.alert('Success', 'Album created successfully!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to create album.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Coupon Code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your coupon code"
        value={couponCode}
        onChangeText={setCouponCode}
      />
      <Button title="Validate Coupon" onPress={validateCoupon} disabled={isProcessing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});

export default EnterCouponScreen;