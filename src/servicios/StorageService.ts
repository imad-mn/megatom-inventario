import { ID, storage } from './appwrite.ts';

const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export async function Subir(file: File): Promise<string> {
  const fileId = ID.unique();
  await storage.createFile({
    bucketId: bucketId,
    fileId: fileId,
    file: file
  });
  return fileId;
}

export function Url(fileId: string): string {
  return storage.getFileView({
    bucketId: bucketId,
    fileId: fileId
  });
}

export async function Eliminar(fileId: string): Promise<void> {
  await storage.deleteFile({
    bucketId: bucketId,
    fileId: fileId
  });
}
