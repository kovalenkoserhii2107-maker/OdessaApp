import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// TODO: Замените этот конфиг на данные из вашей Firebase Console
// 1. Создайте проект на https://console.firebase.google.com/
// 2. Project Settings -> General -> Your apps -> Web app
// 3. Скопируйте объект firebaseConfig сюда:
const firebaseConfig = {
  apiKey: "AIzaSyDzgkCTEMU_6hg0LDSgkdltQhYt7fUGd1U",
  authDomain: "odessa-app-674ad.firebaseapp.com",
  projectId: "odessa-app-674ad",
  storageBucket: "odessa-app-674ad.firebasestorage.app",
  messagingSenderId: "957968439975",
  appId: "1:957968439975:web:bf1af100030e48f1bdd982",
  measurementId: "G-8MRGLM4717"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Ошибка при входе:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
