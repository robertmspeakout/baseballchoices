"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const POSITIONS = [
  "RHP", "LHP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "UTL",
];

const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function ProfilePage() {
  const [playerName, setPlayerName] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState("");
  const [secondaryPosition, setSecondaryPosition] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [highSchool, setHighSchool] = useState("");
  const [travelBall, setTravelBall] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [backgroundPic, setBackgroundPic] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const profilePicRef = useRef<HTMLInputElement>(null);
  const backgroundPicRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!playerName.trim()) {
      setError("Please enter the player's name.");
      return;
    }
    if (!gradYear) {
      setError("Please select a graduation year.");
      return;
    }
    if (!primaryPosition) {
      setError("Please select a primary position.");
      return;
    }

    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with background preview */}
      <header className="relative bg-blue-950 text-white overflow-hidden">
        {backgroundPic && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundPic}')` }}
          />
        )}
        <div className={`absolute inset-0 ${backgroundPic ? "bg-blue-950/60" : ""}`} />
        <div className="relative max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold">NextBase</h1>
          </div>
          <span className="text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            Step 2 of 2
          </span>
        </div>

        {/* Profile pic + background upload area */}
        <div className="relative max-w-lg mx-auto px-4 pb-16 pt-2">
          <button
            onClick={() => backgroundPicRef.current?.click()}
            className="absolute top-2 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white/90 hover:bg-white/25 transition-colors border border-white/10"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {backgroundPic ? "Change Background" : "Add Background"}
          </button>
          <input
            ref={backgroundPicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, setBackgroundPic)}
          />
        </div>

        {/* Profile pic floating over the header/content boundary */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => profilePicRef.current?.click()}
            className="relative group"
          >
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow group-hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          <input
            ref={profilePicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, setProfilePic)}
          />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-16 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Player Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us about the player</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="First and last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Grad Year + Primary Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Year <span className="text-red-500">*</span>
              </label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {GRAD_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Position <span className="text-red-500">*</span>
              </label>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Position <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={secondaryPosition}
              onChange={(e) => setSecondaryPosition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">None</option>
              {POSITIONS.filter((p) => p !== primaryPosition).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* City + State */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your city"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">--</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* High School */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">High School</label>
            <input
              type="text"
              value={highSchool}
              onChange={(e) => setHighSchool(e.target.value)}
              placeholder="School name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Travel Ball */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel Ball Organization(s) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={travelBall}
              onChange={(e) => setTravelBall(e.target.value)}
              placeholder="e.g. Perfect Game, East Cobb, Dirtbags"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Saving profile...
              </span>
            ) : (
              "Complete Setup"
            )}
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Skip for now
          </button>
        </form>
      </main>
    </div>
  );
}
