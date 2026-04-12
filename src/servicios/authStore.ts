import { defineStore } from 'pinia'
import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { ref } from 'vue';
import { auth } from './firebase';

export const useAuthStore = defineStore('auth', () => {
  const Usuario = ref<UserCredential>();

  async function logOut() {
    await auth.signOut();
    Usuario.value = undefined;
  }

  async function logIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    Usuario.value = userCredential;
  }

  return {
    Usuario,
    logOut,
    logIn,
  };
});
