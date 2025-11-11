import { Client, TablesDB, ID, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
  .setLocale('es_ES');

// const account = new Account(client);
const tablesDB = new TablesDB(client);
const storage = new Storage(client);

export { tablesDB, ID, storage }
