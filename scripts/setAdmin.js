// Script to set admin role for a user
// Run with: node scripts/setAdmin.js <userId>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDlbGNrDdgYexRjRW8PVvyIJa5ZWWJuA6w",
  authDomain: "social-vibing-karr.firebaseapp.com",
  projectId: "social-vibing-karr",
  storageBucket: "social-vibing-karr.firebasestorage.app",
  messagingSenderId: "533333711001",
  appId: "1:533333711001:web:abcf10b85e92b52e1cbd7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`❌ User ${userId} not found`);
      return;
    }
    
    console.log(`\n🔄 Setting admin role for user ${userId}...`);
    
    await updateDoc(userRef, {
      role: 'admin',
      isAdmin: true
    });
    
    console.log(`✅ Successfully set admin role for user ${userId}`);
    console.log(`\nUser can now:`);
    console.log(`   - Delete any content (posts, comments, stories, products)`);
    console.log(`   - Ban/suspend users`);
    console.log(`   - Access all admin panel features`);
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    console.error('\nNote: This script updates Firestore directly.');
    console.error('Make sure you have the necessary permissions.');
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node scripts/setAdmin.js <userId>');
  console.log('\nExample: node scripts/setAdmin.js abc123xyz');
  process.exit(1);
}

setAdminRole(userId).then(() => process.exit(0));
