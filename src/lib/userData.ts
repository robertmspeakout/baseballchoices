export interface UserData {
  priority: number;
  notes: string;
  last_contacted: string | null;
  recruiting_status: string;
  theyve_seen_me: string[];
  detail: string;
  my_contact_name: string;
  my_contact_email: string;
}

const STORAGE_KEY = "nextbase_userData";
const OLD_STORAGE_KEY = "baseballchoices_userData";

const DEFAULT_USER_DATA: UserData = {
  priority: 0,
  notes: "",
  last_contacted: null,
  recruiting_status: "",
  theyve_seen_me: [],
  detail: "",
  my_contact_name: "",
  my_contact_email: "",
};

function loadAll(): Record<string, UserData> {
  if (typeof window === "undefined") return {};
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from old key
      raw = localStorage.getItem(OLD_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(OLD_STORAGE_KEY);
      }
    }
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
  return { ...DEFAULT_USER_DATA, ...all[schoolId] };
}

export function setUserData(schoolId: number, updates: Partial<UserData>) {
  const all = loadAll();
  const existing = { ...DEFAULT_USER_DATA, ...all[schoolId] };
  all[schoolId] = { ...existing, ...updates };
  saveAll(all);
}

export function getAllUserData(): Record<string, UserData> {
  return loadAll();
}

// ── Database-backed methods for logged-in users ──

export async function fetchUserDataFromDB(): Promise<Record<string, UserData>> {
  const res = await fetch("/api/user/schooldata");
  if (!res.ok) return {};
  return res.json();
}

export async function saveUserDataToDB(schoolId: number, updates: Partial<UserData>): Promise<void> {
  await fetch("/api/user/schooldata", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolId, ...updates }),
  });
}
