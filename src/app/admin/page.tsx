"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface School {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
  website: string | null;
  last_season_record: string | null;
  logo_url: string | null;
  mlb_draft_picks: number | null;
  stadium_name: string | null;
  stadium_image_url: string | null;
  enrollment: number | null;
  acceptance_rate: number | null;
  graduation_rate: number | null;
  cws_appearances: number;
  ncaa_regionals: number;
  roster_size: number;
  scholarship_limit: number;
  recruiting_questionnaire_url: string | null;
  nil_url: string | null;
  [key: string]: any;
}

const EDITABLE_FIELDS: { key: string; label: string; type: "text" | "number" | "select"; options?: string[] }[] = [
  { key: "name", label: "School Name", type: "text" },
  { key: "mascot", label: "Mascot", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "zip", label: "ZIP", type: "text" },
  { key: "division", label: "Division", type: "select", options: ["D1", "D2", "D3", "JUCO"] },
  { key: "public_private", label: "Public/Private", type: "select", options: ["Public", "Private"] },
  { key: "conference", label: "Conference", type: "text" },
  { key: "current_ranking", label: "Current Ranking", type: "number" },
  { key: "tuition", label: "Tuition ($)", type: "number" },
  { key: "enrollment", label: "Enrollment", type: "number" },
  { key: "acceptance_rate", label: "Acceptance Rate (%)", type: "number" },
  { key: "graduation_rate", label: "Graduation Rate (%)", type: "number" },
  { key: "head_coach_name", label: "Head Coach", type: "text" },
  { key: "head_coach_email", label: "Head Coach Email", type: "text" },
  { key: "assistant_coach_name", label: "Assistant Coach", type: "text" },
  { key: "assistant_coach_email", label: "Asst. Coach Email", type: "text" },
  { key: "last_season_record", label: "Last Season Record", type: "text" },
  { key: "mlb_draft_picks", label: "MLB Draft Picks", type: "number" },
  { key: "cws_appearances", label: "CWS Appearances", type: "number" },
  { key: "ncaa_regionals", label: "NCAA Regionals", type: "number" },
  { key: "website", label: "Program Website", type: "text" },
  { key: "nil_url", label: "NIL URL", type: "text" },
  { key: "instagram", label: "Instagram", type: "text" },
  { key: "x_account", label: "X / Twitter", type: "text" },
  { key: "stadium_name", label: "Stadium Name", type: "text" },
  { key: "logo_url", label: "Logo URL", type: "text" },
  { key: "recruiting_questionnaire_url", label: "Recruiting Questionnaire URL", type: "text" },
];

export default function AdminPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("");
  const [editing, setEditing] = useState<School | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/schools")
      .then((r) => r.json())
      .then((data) => setSchools(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      if (divFilter && s.division !== divFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(term) ||
          s.city?.toLowerCase().includes(term) ||
          s.state?.toLowerCase().includes(term) ||
          s.conference?.toLowerCase().includes(term) ||
          s.head_coach_name?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [schools, search, divFilter]);

  const openEditor = (school: School) => {
    setEditing(school);
    const form: Record<string, any> = {};
    EDITABLE_FIELDS.forEach((f) => {
      form[f.key] = school[f.key] ?? "";
    });
    setEditForm(form);
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveMsg("");

    // Build updated school with proper types
    const updated: Record<string, any> = { id: editing.id };
    EDITABLE_FIELDS.forEach((f) => {
      const val = editForm[f.key];
      if (f.type === "number") {
        updated[f.key] = val === "" || val === null ? null : Number(val);
      } else {
        updated[f.key] = val === "" ? null : val;
      }
    });

    try {
      const res = await fetch("/api/admin/schools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg("Saved!");
        // Update local state
        setSchools((prev) =>
          prev.map((s) => (s.id === editing.id ? { ...s, ...updated } : s))
        );
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" showTagline={false} />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-900/30 px-2 py-1 rounded">Admin</span>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to Site
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Admin</h1>
            <p className="text-sm text-gray-500 mt-1">{schools.length} programs &middot; Click any row to edit</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools, coaches..."
              className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={divFilter}
              onChange={(e) => setDivFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Divisions</option>
              <option value="D1">D1</option>
              <option value="D2">D2</option>
              <option value="D3">D3</option>
              <option value="JUCO">JUCO</option>
            </select>
          </div>
        </div>

        {/* Schools table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">School</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Div</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Conference</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Head Coach</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">State</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((school) => (
                  <tr
                    key={school.id}
                    onClick={() => openEditor(school)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {school.name}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        school.division === "D1" ? "bg-blue-100 text-blue-700" :
                        school.division === "D2" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{school.division}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{school.conference}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">
                      {school.current_ranking ? `#${school.current_ranking}` : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{school.head_coach_name || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{school.state}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{school.last_season_record || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">No schools match your search</p>
          )}
        </div>
      </main>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editing.name}</h2>
                <p className="text-xs text-gray-500">ID: {editing.id} &middot; {editing.division} &middot; {editing.conference}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/school/${editing.id}`}
                  className="text-xs text-blue-600 hover:underline"
                  target="_blank"
                >
                  View Page &rarr;
                </Link>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EDITABLE_FIELDS.map((field) => (
                  <div key={field.key} className={field.key === "website" || field.key === "nil_url" || field.key === "recruiting_questionnaire_url" || field.key === "logo_url" ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        value={editForm[field.key] || ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">—</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        value={editForm[field.key] ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <span className={`text-sm font-medium ${saveMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                {saveMsg}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
