"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { loadProfile, saveProfile, loadPreferences, savePreferences, REGIONS, type PlayerProfile, type PlayerPreferences } from "@/lib/playerProfile";

const POSITIONS = [
  "RHP", "LHP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "UTL",
];

const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const CONFERENCE_TIERS: Record<string, string[]> = {
  "Power": ["SEC", "ACC", "Big 12", "Big Ten"],
  "High-Major": ["Sun Belt", "Big West", "American Athletic", "Pac-12", "Mountain West", "Big East", "WAC", "Conference USA"],
  "Mid-Major": ["West Coast", "Missouri Valley", "Atlantic 10", "CAA", "Southern", "MAC", "Ohio Valley", "OVC", "Horizon", "MAAC", "Summit", "Big Sky", "Southland"],
  "Low-Major": ["SWAC", "MEAC", "Patriot", "NEC", "Ivy League", "America East", "Big South", "Northeast", "ASUN"],
};

function getTierForConference(conf: string): string | null {
  for (const [tier, confs] of Object.entries(CONFERENCE_TIERS)) {
    if (confs.includes(conf)) return tier;
  }
  return null;
}

const DISTANCE_OPTIONS = [
  { value: null, label: "Anywhere" },
  { value: 100, label: "100 mi" },
  { value: 250, label: "250 mi" },
  { value: 500, label: "500 mi" },
  { value: 1000, label: "1,000 mi" },
];

const TUITION_OPTIONS = [
  { value: null, label: "No limit" },
  { value: 10000, label: "Under $10K" },
  { value: 20000, label: "Under $20K" },
  { value: 30000, label: "Under $30K" },
  { value: 50000, label: "Under $50K" },
];

const TOTAL_STEPS = 3;

export default function ProfilePage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Player info
  const [playerName, setPlayerName] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState("");
  const [secondaryPosition, setSecondaryPosition] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [highSchool, setHighSchool] = useState("");
  const [travelBall, setTravelBall] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [backgroundPic, setBackgroundPic] = useState<string | null>(null);

  // Step 2: Academics
  const [gpa, setGpa] = useState("");
  const [gpaType, setGpaType] = useState<"weighted" | "unweighted" | "">("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");

  // Step 3: Preferences
  const [divisionPref, setDivisionPref] = useState<"D1" | "D2" | "both">("both");
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [maxTuition, setMaxTuition] = useState<number | null>(null);
  const [schoolSize, setSchoolSize] = useState<"small" | "medium" | "large" | "any">("any");
  const [highAcademic, setHighAcademic] = useState(false);
  const [competitiveness, setCompetitiveness] = useState<"top25" | "postseason" | "any">("any");
  const [draftImportance, setDraftImportance] = useState<"yes" | "no">("no");
  const [preferredTiers, setPreferredTiers] = useState<string[]>([]);

  const profilePicRef = useRef<HTMLInputElement>(null);
  const backgroundPicRef = useRef<HTMLInputElement>(null);

  // Load saved data on mount
  useEffect(() => {
    const p = loadProfile();
    setPlayerName(p.playerName);
    setGradYear(p.gradYear);
    setPrimaryPosition(p.primaryPosition);
    setSecondaryPosition(p.secondaryPosition);
    setCity(p.city);
    setState(p.state);
    setZipCode(p.zipCode);
    setHighSchool(p.highSchool);
    setTravelBall(p.travelBall);
    setProfilePic(p.profilePic);
    setBackgroundPic(p.backgroundPic);
    setGpa(p.gpa != null ? String(p.gpa) : "");
    setGpaType(p.gpaType);
    setSatScore(p.satScore != null ? String(p.satScore) : "");
    setActScore(p.actScore != null ? String(p.actScore) : "");

    const prefs = loadPreferences();
    setDivisionPref(prefs.divisionPreference);
    setMaxDistance(prefs.maxDistanceFromHome);
    setPreferredRegions(prefs.preferredRegions || []);
    setMaxTuition(prefs.maxTuition);
    setSchoolSize(prefs.schoolSize);
    setHighAcademic(prefs.highAcademic || false);
    setCompetitiveness(prefs.competitiveness);
    setDraftImportance(prefs.draftImportance);
    setPreferredTiers((prefs as any).preferredTiers || []);
  }, []);

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

  const toggleRegion = (region: string) => {
    setPreferredRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const toggleTier = (tier: string) => {
    setPreferredTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!playerName.trim()) { setError("Player name is required."); return false; }
      if (!gradYear) { setError("Graduation year is required."); return false; }
      if (!primaryPosition) { setError("Primary position is required."); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    // Save current step data
    saveCurrentStep();
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    saveCurrentStep();
    setStep(Math.max(1, step - 1));
    window.scrollTo(0, 0);
  };

  const saveCurrentStep = () => {
    if (step === 1 || step === 2) {
      saveProfile({
        playerName: playerName.trim(),
        gradYear,
        primaryPosition,
        secondaryPosition,
        city: city.trim(),
        state,
        zipCode: zipCode.trim(),
        highSchool: highSchool.trim(),
        travelBall: travelBall.trim(),
        profilePic,
        backgroundPic,
        gpa: gpa ? parseFloat(gpa) : null,
        gpaType,
        satScore: satScore ? parseInt(satScore) : null,
        actScore: actScore ? parseInt(actScore) : null,
      });
    }
    if (step === 3) {
      savePreferences({
        divisionPreference: divisionPref,
        maxDistanceFromHome: maxDistance,
        preferredRegions,
        maxTuition,
        schoolSize,
        highAcademic,
        competitiveness,
        draftImportance,
        preferredConferences: [],
        preferredTiers,
      });
    }
  };

  const handleFinish = () => {
    setSaving(true);
    saveCurrentStep();
    setTimeout(() => {
      setSaving(false);
      window.location.href = "/match";
    }, 800);
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500";
  const selectClass = `${inputClass} bg-white`;
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="relative bg-gray-900 text-white overflow-hidden">
        {backgroundPic && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundPic}')` }} />
        )}
        <div className={`absolute inset-0 ${backgroundPic ? "bg-gray-900/70" : ""}`} />
        <div className="relative max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "'Permanent Marker', cursive" }}><span className="text-red-500">NEXT</span><span className="text-white">BASE</span></span>
          </div>
          <span className="text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Profile pic area */}
        <div className="relative max-w-lg mx-auto px-4 pb-16 pt-2">
          <button
            onClick={() => backgroundPicRef.current?.click()}
            className="absolute top-2 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white/90 hover:bg-white/25 transition-colors border border-white/10"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {backgroundPic ? "Change" : "Add Background"}
          </button>
          <input ref={backgroundPicRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setBackgroundPic)} />
        </div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
          <button onClick={() => profilePicRef.current?.click()} className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow group-hover:bg-red-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setProfilePic)} />
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto w-full px-4 pt-16">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-red-500" : i === step - 1 ? "bg-red-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-8">
        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-black text-gray-900">About You</h2>
              <p className="text-sm text-gray-500 mt-1">Basic player information</p>
            </div>

            <div>
              <label className={labelClass}>Player Name <span className="text-red-500">*</span></label>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="First and last name" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Grad Year <span className="text-red-500">*</span></label>
                <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Primary Position <span className="text-red-500">*</span></label>
                <select value={primaryPosition} onChange={(e) => setPrimaryPosition(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Secondary Position <span className="text-gray-400 font-normal">(optional)</span></label>
              <select value={secondaryPosition} onChange={(e) => setSecondaryPosition(e.target.value)} className={selectClass}>
                <option value="">None</option>
                {POSITIONS.filter((p) => p !== primaryPosition).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
                  <option value="">--</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Zip Code</label>
                <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="12345" maxLength={5} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>High School</label>
              <input type="text" value={highSchool} onChange={(e) => setHighSchool(e.target.value)} placeholder="School name" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Travel Ball <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={travelBall} onChange={(e) => setTravelBall(e.target.value)} placeholder="e.g. East Cobb, Dirtbags" className={inputClass} />
            </div>
          </div>
        )}

        {/* Step 2: Academics */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-black text-gray-900">Academics</h2>
              <p className="text-sm text-gray-500 mt-1">Helps us match acceptance rates and academic fit</p>
            </div>

            <div>
              <label className={labelClass}>GPA</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={gpa}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setGpa(v);
                  }}
                  placeholder="e.g. 3.50"
                  className={`${inputClass} w-28 text-center text-lg font-bold tracking-wide`}
                />
                <select value={gpaType} onChange={(e) => setGpaType(e.target.value as typeof gpaType)} className={`${selectClass} flex-1`}>
                  <option value="">Type</option>
                  <option value="unweighted">Unweighted</option>
                  <option value="weighted">Weighted</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>SAT Score <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="number"
                min="400"
                max="1600"
                value={satScore}
                onChange={(e) => setSatScore(e.target.value)}
                placeholder="400-1600"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ACT Score <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="number"
                min="1"
                max="36"
                value={actScore}
                onChange={(e) => setActScore(e.target.value)}
                placeholder="1-36"
                className={inputClass}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500">
                Your GPA helps us match you with schools where you have a strong chance of admission. We compare it against each school&apos;s acceptance rate. All fields are optional.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: What Are You Looking For? */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-xl font-black text-gray-900">What Are You Looking For?</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us your ideal school and we&apos;ll find matches</p>
            </div>

            {/* Division */}
            <div>
              <label className={labelClass}>Division Preference</label>
              <div className="flex gap-2">
                {(["D1", "D2", "both"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDivisionPref(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      divisionPref === d
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {d === "both" ? "Both" : d === "D1" ? "Division I" : "Division II"}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className={labelClass}>Max Distance from Home</label>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setMaxDistance(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      maxDistance === opt.value
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tuition */}
            <div>
              <label className={labelClass}>Tuition Budget (per year)</label>
              <div className="flex flex-wrap gap-2">
                {TUITION_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setMaxTuition(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      maxTuition === opt.value
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* School Size */}
            <div>
              <label className={labelClass}>School Size</label>
              <div className="flex gap-2">
                {([
                  { v: "any", l: "Any" },
                  { v: "small", l: "Small (<5K)" },
                  { v: "medium", l: "Mid (5-15K)" },
                  { v: "large", l: "Large (15K+)" },
                ] as const).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSchoolSize(v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      schoolSize === v
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* High Academic Institution */}
            <div>
              <label className={labelClass}>High Academic Institution</label>
              <button
                type="button"
                onClick={() => setHighAcademic(!highAcademic)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  highAcademic
                    ? "bg-yellow-50 text-yellow-900 border-2 border-yellow-400 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center ${
                  highAcademic ? "bg-yellow-400 text-white" : "bg-gray-300 text-transparent"
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Only show high-academic institutions
              </button>
            </div>

            {/* Competitiveness */}
            <div>
              <label className={labelClass}>Program Competitiveness</label>
              <div className="flex gap-2">
                {([
                  { v: "any", l: "Any Level" },
                  { v: "postseason", l: "Postseason Contender" },
                  { v: "top25", l: "Top 25" },
                ] as const).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCompetitiveness(v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      competitiveness === v
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Draft picks */}
            <div>
              <label className={labelClass}>Is playing pro ball a goal?</label>
              <div className="flex gap-2">
                {([
                  { v: "no", l: "Not a priority" },
                  { v: "yes", l: "I want to go pro!" },
                ] as const).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraftImportance(v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      draftImportance === v
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className={labelClass}>Preferred Regions <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(REGIONS).map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      preferredRegions.includes(region)
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Level / Tier — only for D1 */}
            {divisionPref !== "D2" && (
              <div>
                <label className={labelClass}>Level</label>
                <div className="space-y-2">
                  {Object.entries(CONFERENCE_TIERS).map(([tier, confs]) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleTier(tier)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                        preferredTiers.includes(tier)
                          ? "bg-gray-900 text-white border-gray-900 shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-bold">{tier}</span>
                      <span className={`block text-xs mt-0.5 ${preferredTiers.includes(tier) ? "text-white/60" : "text-gray-400"}`}>
                        {confs.slice(0, 5).join(", ")}{confs.length > 5 ? ` +${confs.length - 5} more` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mt-4">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="flex-1 px-4 py-3.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={saving}
            className={`flex-1 px-4 py-3.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm ${step === 1 ? "" : ""}`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Finding matches...
              </span>
            ) : step === TOTAL_STEPS ? (
              "Find My Matches"
            ) : (
              "Continue"
            )}
          </button>
        </div>

        {step === 1 && (
          <button type="button" onClick={() => (window.location.href = "/")} className="w-full mt-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors text-center">
            Skip for now
          </button>
        )}
      </main>
    </div>
  );
}
