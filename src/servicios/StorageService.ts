import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import Compressor from 'compressorjs';

export async function Subir(file: File): Promise<[ nombreArchivo: string, downloadUrl: string ]> {
  const nombreArchivo = `${Date.now()}_${file.name.replace(/\.[^.]+$/, '.webp')}`;
  const storageRef = ref(storage, nombreArchivo);
  const metadata = {
    cacheControl: 'public, max-age=2592000',  // 30 dias
    contentType: 'image/webp',
  };
  const compressed = await resizeToWebP(file);
  const result = await uploadBytes(storageRef, compressed, metadata);
  return [nombreArchivo, await getDownloadURL(result.ref)];
}


export function Eliminar(nombreArchivo: string): Promise<void> {
  const storageRef = ref(storage, nombreArchivo);
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
