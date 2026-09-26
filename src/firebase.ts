import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// TODO: Замените этот конфиг на данные из вашей Firebase Console
// 1. Создайте проект на https://console.firebase.google.com/
// 2. Project Settings -> General -> Your apps -> Web app
// 3. Скопируйте объект firebaseConfig сюда:
const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
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
