import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import Compressor from 'compressorjs';

export async function Subir(file: File): Promise<[ fileUrl: string, downloadUrl: string ]> {
  const fileUrl = `${Date.now()}_${file.name.replace(/\.[^.]+$/, '.webp')}`;
  const storageRef = ref(storage, fileUrl);
  const metadata = {
    cacheControl: 'public, max-age=2592000',  // 30 dias
    contentType: 'image/webp',
  };
  const compressed = await resizeToWebP(file);
  const result = await uploadBytes(storageRef, compressed, metadata);
  return [fileUrl, await getDownloadURL(result.ref)];
}


export function Eliminar(fileUrl: string): Promise<void> {
  const storageRef = ref(storage, fileUrl);
  return deleteObject(storageRef);
}

function resizeToWebP(file: File, maxHeight = 240): Promise<File> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxHeight,
      quality: 0.85,
      mimeType: 'image/webp',
      success: (result) => resolve(result as File),
      error: reject
    });
  });
}
