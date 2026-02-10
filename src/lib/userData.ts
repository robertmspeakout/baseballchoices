export interface UserData {
  priority: number;
  notes: string;
  last_contacted: string | null;
}

const STORAGE_KEY = "baseballchoices_userData";

function loadAll(): Record<string, UserData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, UserData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUserData(schoolId: number): UserData {
  const all = loadAll();
  return all[schoolId] || { priority: 0, notes: "", last_contacted: null };
}

export function setUserData(schoolId: number, updates: Partial<UserData>) {
  const all = loadAll();
  const existing = all[schoolId] || { priority: 0, notes: "", last_contacted: null };
  all[schoolId] = { ...existing, ...updates };
  saveAll(all);
}

export function getAllUserData(): Record<string, UserData> {
  return loadAll();
}
