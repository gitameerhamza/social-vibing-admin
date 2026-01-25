// Script to check and set admin role for a user
// Run with: node scripts/checkAdminRole.js <userId>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

async function checkAdminRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`❌ User ${userId} not found`);
      return;
    }
    
    const userData = userDoc.data();
    console.log(`\n📋 User Data for ${userId}:`);
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   Username: ${userData.username || 'N/A'}`);
    console.log(`   Role: ${userData.role || 'NOT SET'}`);
    console.log(`   isAdmin: ${userData.isAdmin || false}`);
    
    if (userData.role === 'admin') {
      console.log(`\n✅ User is already an admin`);
    } else {
      console.log(`\n⚠️  User is NOT an admin`);
      console.log(`\nTo make this user an admin, run:`);
      console.log(`node scripts/setAdmin.js ${userId}`);
    }
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node scripts/checkAdminRole.js <userId>');
  console.log('\nTo find your userId:');
  console.log('1. Log into the app');
  console.log('2. Check the console for "Authenticated as: <userId>"');
  process.exit(1);
}

checkAdminRole(userId).then(() => process.exit(0));
