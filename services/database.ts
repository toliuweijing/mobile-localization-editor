import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project } from '../types';

const DB_NAME = 'mobile-localization-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

interface AppDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Project;
    indexes: { lastModified: number };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<AppDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lastModified', 'lastModified');
      },
    });
  }
  return dbPromise;
};

export const getAllProjects = async (): Promise<Project[]> => {
  const db = await getDb();
  // Get all and sort by lastModified descending, which is a common operation.
  return db.getAllFromIndex(STORE_NAME, 'lastModified').then(projects => projects.reverse());
};

export const saveProject = async (project: Project): Promise<string> => {
  const db = await getDb();
  return db.put(STORE_NAME, project);
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await getDb();
  return db.delete(STORE_NAME, id);
};

export const clearAllProjects = async (): Promise<void> => {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
};

export const bulkSaveProjects = async (projects: Project[]): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    projects.forEach(project => {
        tx.objectStore(STORE_NAME).put(project);
    });
    await tx.done;
};
