import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function Subir(file: File): Promise<string> {
  const storageRef = ref(storage, `${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return storageRef.name;
}

export function Url(fileName: string): Promise<string> {
  const storageRef = ref(storage, fileName);
  return getDownloadURL(storageRef);
}

export function Eliminar(fileName: string): Promise<void> {
  const storageRef = ref(storage, fileName);
  return deleteObject(storageRef);
}
