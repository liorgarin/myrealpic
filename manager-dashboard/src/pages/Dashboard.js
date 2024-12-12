import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

async function downloadPhotosAsZip(photos, ordernum) {
  if (!photos || photos.length === 0) {
    alert('No photos to download');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/download-photos-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, ordernum })
    });

    if (!response.ok) {
      alert('Failed to generate ZIP');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ordernum}.zip`; 
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error downloading photos:', error);
    alert('Error downloading photos');
  }
}

export default function Dashboard() {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'albums'), where('status', '==', 'On the Way'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const arr = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setAlbums(arr);
    });
    return () => unsubscribe();
  }, []);

  const updateDeliveryMode = async (albumId, newMode) => {
    const albumRef = doc(db, 'albums', albumId);
    await updateDoc(albumRef, { deliverymode: newMode });
  };

  const setArrived = async (albumId) => {
    const albumRef = doc(db, 'albums', albumId);
    await updateDoc(albumRef, { status: 'Arrived' });
    alert('Album set to Arrived');
  };

  return (
    <div>
      <h2>Orders for Production</h2>
      {albums.length === 0 && <p>No albums currently On the Way</p>}
      {albums.map(album => (
        <div key={album.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          <h3>{album.name}</h3>
          <p><strong>Order Number:</strong> {album.ordernum || 'N/A'}</p>
          {album.address && (
            <div>
              <p><strong>Recipient:</strong> {album.address.recipientName}</p>
              <p><strong>Phone:</strong> {album.address.phoneNumber}</p>
              <p>
                <strong>Address:</strong> {album.address.street}, {album.address.city}, {album.address.country}, {album.address.zipCode}
              </p>
            </div>
          )}
          <p><strong>Delivery Mode:</strong> {album.deliverymode || 'Not set'}</p>
          <p><strong>Photos:</strong> {album.photos && album.photos.length} photos</p>

          <div style={{ marginTop: 10 }}>
            <label>Update Delivery Mode: </label>
            <select onChange={(e) => updateDeliveryMode(album.id, e.target.value)} defaultValue={album.deliverymode || 'prepare print'}>
              <option value="prepare print">Prepare Print</option>
              <option value="printed">Printed</option>
              <option value="packaged">Packaged</option>
              <option value="sent">Sent</option>
              <option value="on the way">On the Way</option>
            </select>
          </div>

          {/* Buttons row: Download on left, Set as Arrived on right */}
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => downloadPhotosAsZip(album.photos || [], album.ordernum || 'NoOrderNum')}>
              Download All Photos
            </button>
            <button 
              onClick={() => setArrived(album.id)} 
              style={{ backgroundColor: 'green', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: '4px' }}
            >
              Set as Arrived
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}