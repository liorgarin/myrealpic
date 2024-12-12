import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export default function Settings() {
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [workers, setWorkers] = useState([]);

  const currentUser = auth.currentUser;
  const isMasterManager = currentUser && currentUser.email === 'reals.pics@gmail.com';

  useEffect(() => {
    // Listen for workers
    const workersRef = collection(db, 'workers');
    // All workers with role == 'worker'
    const q = query(workersRef, where('role', '==', 'worker'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const arr = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setWorkers(arr);
    });
    return () => unsubscribe();
  }, []);

  const handleAddWorker = async () => {
    if (!isMasterManager) {
      alert('You are not allowed to add new workers.');
      return;
    }

    if (!newWorkerEmail.trim()) {
      alert('Please provide an email for the new worker.');
      return;
    }

    try {
      const workersRef = collection(db, 'workers');
      await addDoc(workersRef, {
        email: newWorkerEmail.trim(),
        role: 'worker'
      });
      alert('New worker added successfully!');
      setNewWorkerEmail('');
    } catch (error) {
      console.error('Error adding worker:', error);
      alert(error.message);
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (!isMasterManager) {
      alert('You are not allowed to remove workers.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'workers', workerId));
      alert('Worker removed successfully!');
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Settings</h2>
      {!isMasterManager && <p>You do not have permission to manage workers.</p>}

      {isMasterManager && (
        <div style={{ maxWidth: 300 }}>
          <h3>Add New Worker</h3>
          <input
            placeholder="Worker Email"
            value={newWorkerEmail}
            onChange={e => setNewWorkerEmail(e.target.value)}
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <button onClick={handleAddWorker}>Add Worker</button>
        </div>
      )}

      <h3>Workers List</h3>
      {workers.length === 0 && <p>No workers found.</p>}
      {workers.map(worker => (
        <div key={worker.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10, maxWidth:300 }}>
          <p><strong>Email:</strong> {worker.email}</p>
          {isMasterManager && (
            <button onClick={() => handleDeleteWorker(worker.id)}>
              Remove Worker
            </button>
          )}
        </div>
      ))}
    </div>
  );
}