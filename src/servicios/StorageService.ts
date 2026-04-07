import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function Subir(file: File): Promise<string> {
  const fileUrl = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileUrl);
  await uploadBytes(storageRef, file);
  return fileUrl;
}

export function Url(fileUrl: string): Promise<string> {
  const storageRef = ref(storage, fileUrl);
  return getDownloadURL(storageRef);
}

export function Eliminar(fileName: string): Promise<void> {
  const storageRef = ref(storage, fileName);
  return deleteObject(storageRef);
}
