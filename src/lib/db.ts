import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "baseball.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mascot TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      latitude REAL,
      longitude REAL,
      division TEXT NOT NULL,
      public_private TEXT,
      conference TEXT,
      current_ranking INTEGER,
      tuition INTEGER,
      instagram TEXT,
      x_account TEXT,
      head_coach_name TEXT,
      head_coach_email TEXT,
      assistant_coach_name TEXT,
      assistant_coach_email TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_school_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL UNIQUE,
      priority INTEGER DEFAULT 0 CHECK(priority >= 0 AND priority <= 5),
      notes TEXT DEFAULT '',
      last_contacted DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE INDEX IF NOT EXISTS idx_schools_division ON schools(division);
    CREATE INDEX IF NOT EXISTS idx_schools_state ON schools(state);
    CREATE INDEX IF NOT EXISTS idx_schools_conference ON schools(conference);
    CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
  `);
}

export interface School {
  id: number;
  name: string;
  mascot: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  division: string;
  public_private: string | null;
  conference: string | null;
  current_ranking: number | null;
  tuition: number | null;
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
  website: string | null;
}

export interface UserSchoolData {
  id: number;
  school_id: number;
  priority: number;
  notes: string;
  last_contacted: string | null;
}

export interface SchoolWithUserData extends School {
  priority: number;
  notes: string;
  last_contacted: string | null;
  distance_miles: number | null;
}
