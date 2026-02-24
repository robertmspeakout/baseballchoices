"use client";

import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";

export interface SchoolForSearch {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  conference: string;
  head_coach_name: string | null;
  logo_url: string | null;
}

export interface SchoolFull extends SchoolForSearch {
  zip: string;
  latitude: number | null;
  longitude: number | null;
  public_private: string;
  current_ranking: number | null;
  tuition: number | null;
  website: string | null;
  last_season_record: string | null;
  high_academic?: boolean;
}

interface SchoolsContextValue {
  schools: SchoolFull[];
  loaded: boolean;
  conferences: string[];
}

const SchoolsContext = createContext<SchoolsContextValue>({
  schools: [],
  loaded: false,
  conferences: [],
});

export function SchoolsProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<SchoolFull[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const firstRes = await fetch("/api/schools?pageSize=200&page=1");
        const firstData = await firstRes.json();
        let all: SchoolFull[] = firstData.schools || [];
        const totalPages = firstData.pagination?.totalPages || 1;
        if (totalPages > 1) {
          const promises = [];
          for (let p = 2; p <= totalPages; p++) {
            promises.push(fetch(`/api/schools?pageSize=200&page=${p}`).then(r => r.json()));
          }
          const results = await Promise.all(promises);
          for (const r of results) all = all.concat(r.schools || []);
        }
        setSchools(all);
      } catch {
        // silently fail — pages still work, just without search overlay data
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const conferences = useMemo(() => {
    return [...new Set(schools.map(s => s.conference).filter(Boolean))].sort();
  }, [schools]);

  const value = useMemo(() => ({ schools, loaded, conferences }), [schools, loaded, conferences]);

  return (
    <SchoolsContext.Provider value={value}>
      {children}
    </SchoolsContext.Provider>
  );
}

export function useSchools() {
  return useContext(SchoolsContext);
}
