import { Client, Account, Databases } from 'appwrite';

const getEndpoint = () => {
  return import.meta.env.VITE_APPWRITE_ENDPOINT
}

const getProjectId = () => {
  return import.meta.env.VITE_APPWRITE_PROJECT_ID
}

const client = new Client().setEndpoint(getEndpoint()).setProject(getProjectId())
const account = new Account(client)
const databases = new Databases(client)

export { ID } from 'appwrite';
export { client, account, databases }
