import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Public Firebase web configuration. This identifies the app; it is not a server credential.
const firebaseConfig = {
  apiKey: 'AIzaSyDzgkCTEMU_6hg0LDSgkdltQhYt7fUGd1U',
  authDomain: 'odessa-app-674ad.firebaseapp.com',
  projectId: 'odessa-app-674ad',
  storageBucket: 'odessa-app-674ad.firebasestorage.app',
  messagingSenderId: '957968439975',
  appId: '1:957968439975:web:bf1af100030e48f1bdd982',
  measurementId: 'G-8MRGLM4717',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Ошибка при входе:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const observeAuth = (callback: Parameters<typeof onAuthStateChanged>[1]) =>
  onAuthStateChanged(auth, callback);
