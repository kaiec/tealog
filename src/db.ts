import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Tea, Brewing, Infusion } from './types';

interface TeaTrackerDB extends DBSchema {
  teas: {
    key: string;
    value: Tea;
  };
  brewings: {
    key: string;
    value: Brewing;
    indexes: { 'teaId': string };
  };
  infusions: {
    key: string;
    value: Infusion;
    indexes: { 'brewingId': string };
  };
}

export const dbPromise = openDB<TeaTrackerDB>('tea-tracker-db', 1, {
  upgrade(db: IDBPDatabase<TeaTrackerDB>) {
    db.createObjectStore('teas', { keyPath: 'id' });
    const brewingStore = db.createObjectStore('brewings', { keyPath: 'id' });
    brewingStore.createIndex('teaId', 'teaId');
    const infusionStore = db.createObjectStore('infusions', { keyPath: 'id' });
    infusionStore.createIndex('brewingId', 'brewingId');
  },
});

// TEA CRUD
export async function getTeas() {
  return (await dbPromise).getAll('teas');
}
export async function addTea(tea: Tea) {
  return (await dbPromise).put('teas', tea);
}
export async function deleteTea(id: string) {
  return (await dbPromise).delete('teas', id);
}

// BREWING CRUD
export async function getBrewingsByTea(teaId: string) {
  return (await dbPromise).getAllFromIndex('brewings', 'teaId', teaId);
}
export async function addBrewing(brewing: Brewing) {
  return (await dbPromise).put('brewings', brewing);
}
export async function deleteBrewing(id: string) {
  return (await dbPromise).delete('brewings', id);
}

// INFUSION CRUD
export async function getInfusionsByBrewing(brewingId: string) {
  return (await dbPromise).getAllFromIndex('infusions', 'brewingId', brewingId);
}
export async function addInfusion(infusion: Infusion) {
  return (await dbPromise).put('infusions', infusion);
}
export async function deleteInfusion(id: string) {
  return (await dbPromise).delete('infusions', id);
} 