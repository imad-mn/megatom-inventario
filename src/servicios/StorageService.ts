import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function Subir(file: File): Promise<string> {
  const fileUrl = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileUrl);
  const result = await uploadBytes(storageRef, file);
  return await getDownloadURL(result.ref);
}


export function Eliminar(fileName: string): Promise<void> {
  const storageRef = ref(storage, fileName);
  return deleteObject(storageRef);
}
