import Dexie, { Table } from "dexie";

export interface OfflineJobUpdate {
  id?: number;
  jobId: string;
  status?: string;
  notes?: string;
  photos?: File[];
  timestamp: number;
  synced: boolean;
}

export interface CachedJob {
  id: string;
  jobNumber: string;
  status: string;
  description: string | null;
  customerName: string;
  dueDate: string | null;
}

export class AppDB extends Dexie {
  jobUpdates!: Table<OfflineJobUpdate>;
  jobs!: Table<CachedJob>;

  constructor() {
    super("AppDB");
    this.version(1).stores({
      jobUpdates: "++id, jobId, timestamp, synced",
      jobs: "id, jobNumber, status, dueDate",
    });
  }
}

export const db = new AppDB();
