import { Client, TablesDB, ID } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
  .setLocale('es_ES');

// const account = new Account(client);
const tablesDB = new TablesDB(client);
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export { tablesDB, ID, databaseId }
