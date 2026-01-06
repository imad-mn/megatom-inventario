import { Client, TablesDB, ID, Storage, Account, type Models } from 'appwrite';
import { ref } from 'vue';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
  .setLocale('es_ES');

if (import.meta.env.DEV)
  client.setDevKey(import.meta.env.VITE_APPWRITE_DEV_KEY);

const tablesDB = new TablesDB(client);
const storage = new Storage(client);
const account = new Account(client);

export { tablesDB, ID, storage, account }
export const Usuario = ref<Models.User | undefined>(undefined);
