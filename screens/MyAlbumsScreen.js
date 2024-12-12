import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const albumSize = (screenWidth - 16 * 2 - 10 * 2) / 3; // Adjust size for albums

const MyAlbumsScreen = () => {
  const navigation = useNavigation();
  const [arrivedAlbums, setArrivedAlbums] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'albums'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const arrived = [];
      querySnapshot.forEach((d) => {
        const album = { id: d.id, ...d.data() };
        if (album.status === 'Arrived') {
          arrived.push(album);
        }
      });
      setArrivedAlbums(arrived);
    });

    return () => unsubscribe();
  }, []);

  const renderAlbum = ({ item }) => (
    <TouchableOpacity
      style={styles.gridAlbumContainer}
      onPress={() => navigation.navigate('Gallery', { albumId: item.id, albumName: item.name })}
    >
      <Image
        source={{ uri: item.coverImage }}
        style={styles.albumCoverImage}
        resizeMode="cover"
      />
      <Text style={styles.albumGridTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <Text style={styles.emptyStateText}>No arrived albums available.</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Arrived Albums</Text>
      <FlatList
        data={arrivedAlbums}
        renderItem={renderAlbum}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1F0',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  gridAlbumContainer: {
    width: albumSize,
    marginBottom: 10,
    alignItems: 'center',
  },
  albumCoverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#EEE',
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
    color: '#888',
  },
});

export default MyAlbumsScreen;