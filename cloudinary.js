// cloudinary.js
// Helper to upload images to Cloudinary (unsigned) and optionally save the resulting URL to Firestore.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { firebaseApp } from './firebaseConfig';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};

const CLOUD_NAME = extra.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = extra.CLOUDINARY_UPLOAD_PRESET;
// API key is not required for unsigned uploads from client. Keep it if you need it server-side.
const API_KEY = extra.CLOUDINARY_API_KEY || '';

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  // It's okay in some environments to not have these set (tests, CI). Warn in dev.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('Cloudinary config not found in expo.extra. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to .env/app.config.js');
  }
}

async function uploadImageAsync(uri, { folder = '', resource_type = 'image' } = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary not configured (missing cloud name or upload preset)');

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource_type}/upload`;

  const formData = new FormData();

  // For React Native, append a file object. For web, convert to Blob first.
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob);
  } else {
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : 'jpg';
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    formData.append('file', { uri, name: filename, type });
  }

  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      // Note: Do not set Content-Type header here; let fetch/set it for multipart automatically.
    },
  });

  const result = await res.json();

  if (!res.ok) {
    const msg = result && result.error ? result.error.message : 'Cloudinary upload failed';
    throw new Error(msg);
  }

  // result.secure_url contains the uploaded image URL
  return result;
}

async function saveImageUrlToFirestore(imageData, { collectionName = 'images', extraMeta = {} } = {}) {
  // imageData should be an object returned by Cloudinary's response (contains secure_url, public_id, etc.)
  if (!firebaseApp) throw new Error('Firebase app not initialized');
  const db = getFirestore(firebaseApp);
  const doc = await addDoc(collection(db, collectionName), {
    url: imageData.secure_url || imageData.url,
    public_id: imageData.public_id,
    createdAt: serverTimestamp(),
    meta: extraMeta,
  });
  return doc.id;
}

export { uploadImageAsync, saveImageUrlToFirestore };
