import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper function to generate a random coupon code
function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RP'; // prefix the code with "RP"
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const q = collection(db, 'coupons');
    const unsubscribe = onSnapshot(q, snapshot => {
      const arr = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoupons(arr);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerateCoupon = async () => {
    const code = generateCouponCode();
    // Use setDoc with the doc ID as the code
    await setDoc(doc(db, 'coupons', code), { code });
  };

  const handleDeleteCoupon = async (id) => {
    await deleteDoc(doc(db, 'coupons', id));
  };

  return (
    <div>
      <h2>Coupons</h2>
      <button 
        style={{ backgroundColor: 'green', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: '4px', marginBottom: '20px' }}
        onClick={handleGenerateCoupon}
      >
        Generate New Coupon
      </button>

      {coupons.length === 0 && <p>No coupons available.</p>}

      {coupons.map(c => (
        <div key={c.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', maxWidth: '300px' }}>
          <p><strong>Code:</strong> {c.code}</p>
          <button style={{ backgroundColor: 'red', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' }} onClick={() => handleDeleteCoupon(c.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}