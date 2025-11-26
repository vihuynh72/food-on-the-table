export interface DonationLogEntry {
  id: string;
  locationId: string;
  locationName: string;
  timestamp: string;
  notes?: string;
}

const STORAGE_KEY = "foodOnTheTable_donations";

const isBrowser = typeof window !== "undefined";

export function getDonationLog(): DonationLogEntry[] {
  if (!isBrowser) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DonationLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addDonationEntry(entry: Omit<DonationLogEntry, "id" | "timestamp"> & { notes?: string }) {
  if (!isBrowser) return [] as DonationLogEntry[];

  const newEntry: DonationLogEntry = {
    ...entry,
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };

  const existing = getDonationLog();
  const updated = [newEntry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getDonationCountForLocation(locationId: string) {
  return getDonationLog().filter((entry) => entry.locationId === locationId).length;
}
