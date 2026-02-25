"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { loadProfile, saveProfile } from "@/lib/playerProfile";
import ImageCropModal from "@/components/ImageCropModal";

const POSITIONS = [
  "RHP", "LHP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "UTL",
];

const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const TOTAL_STEPS = 2;

function ProfileForm({ initialStep }: { initialStep: number }) {
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(initialStep);
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

  const profilePicRef = useRef<HTMLInputElement>(null);
  const backgroundPicRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"profile" | "background">("profile");

  // Load saved data on mount - from DB if authenticated, else localStorage
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const profRes = await fetch("/api/user/profile");
        const prof = await profRes.json();

        if (prof) {
          if (session?.user?.firstName) {
            setPlayerName(session.user.name || "");
          }
          setGradYear(prof.gradYear ? String(prof.gradYear) : "");
          setPrimaryPosition(prof.primaryPosition || "");
          setSecondaryPosition(prof.secondaryPosition || "");
          setCity(prof.city || "");
          setState(prof.state || "");
          setZipCode(prof.zipCode || "");
          setHighSchool(prof.highSchool || "");
          setTravelBall(prof.travelBall || "");
          setGpa(prof.gpa || "");
          setGpaType(prof.gpaType || "");
          setSatScore(prof.satScore || "");
          setActScore(prof.actScore || "");
          if (prof.profilePic) setProfilePic(prof.profilePic);
          if (prof.backgroundPic) setBackgroundPic(prof.backgroundPic);
        }

      } catch {
        // Fall back to localStorage
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
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

    };

    if (session?.user) {
      loadFromDB();
    } else {
      loadFromLocalStorage();
    }
  }, [session]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "profile" | "background"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (target === "profile") {
        // Open crop modal for profile pics
        setCropImage(reader.result as string);
        setCropTarget("profile");
      } else {
        // Background pics apply directly (bg-cover handles fit)
        const bgUrl = reader.result as string;
        setBackgroundPic(bgUrl);
        saveProfile({ backgroundPic: bgUrl });
        if (session?.user) {
          fetch("/api/user/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ backgroundPic: bgUrl }),
          }).catch(() => {});
        }
      }
    };
    reader.readAsDataURL(file);
    setError("");
    // Reset the input so re-selecting the same file triggers onChange
    e.target.value = "";
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
    // Always save to localStorage for backward compat with match page
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
    // Also save to DB if authenticated
    if (session?.user) {
      if (step === 1 || step === 2) {
        fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gradYear, primaryPosition, secondaryPosition,
            city: city.trim(), state, zipCode: zipCode.trim(),
            highSchool: highSchool.trim(), travelBall: travelBall.trim(),
            gpa, gpaType, satScore, actScore,
            profilePic, backgroundPic,
          }),
        }).catch(() => {});
      }
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    saveCurrentStep();

    // Mark profile as complete in DB
    if (session?.user) {
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gradYear, primaryPosition, secondaryPosition,
            city: city.trim(), state, zipCode: zipCode.trim(),
            highSchool: highSchool.trim(), travelBall: travelBall.trim(),
            gpa, gpaType, satScore, actScore,
            profilePic, backgroundPic,
            profileComplete: true,
          }),
        });
        await updateSession({ profileComplete: true });
      } catch { /* continue anyway */ }
    }

    setTimeout(() => {
      setSaving(false);
      window.location.href = "/";
    }, 800);
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500";
  const selectClass = `${inputClass} bg-white`;
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="relative bg-gray-900 text-white overflow-visible z-10">
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
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-marker)" }}><span className="text-red-500">EXTRA</span><span className="text-white">BASE</span></span>
          </div>
          <span className="text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Profile pic area */}
        <div className="relative max-w-lg mx-auto px-4 pb-16 pt-2">
          <div className="absolute top-2 right-4 flex items-center gap-2">
            {backgroundPic && (
              <button
                onClick={() => {
                  setBackgroundPic(null);
                  saveProfile({ backgroundPic: null });
                  fetch("/api/user/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ backgroundPic: null }),
                  }).catch(() => {});
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white/90 hover:bg-red-500/40 transition-colors border border-white/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            )}
            <button
              onClick={() => backgroundPicRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white/90 hover:bg-white/25 transition-colors border border-white/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {backgroundPic ? "Change" : "Add Background"}
            </button>
          </div>
          <input ref={backgroundPicRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "background")} />
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
          <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "profile")} />
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
              <div className="grid grid-cols-2 gap-3">
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
                  className={`${inputClass} text-center text-lg font-bold tracking-wide`}
                />
                <select value={gpaType} onChange={(e) => setGpaType(e.target.value as typeof gpaType)} className={selectClass}>
                  <option value="">Type</option>
                  <option value="unweighted">Unweighted</option>
                  <option value="weighted">Weighted</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>SAT Score <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" min="400" max="1600" value={satScore} onChange={(e) => setSatScore(e.target.value)} placeholder="400-1600" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>ACT Score <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" min="1" max="36" value={actScore} onChange={(e) => setActScore(e.target.value)} placeholder="1-36" className={inputClass} />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500">
                Your GPA helps us match you with schools where you have a strong chance of admission. We compare it against each school&apos;s acceptance rate. All fields are optional.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mt-4">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="flex-1 px-4 py-3.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Back
            </button>
          )}
          <button type="button" onClick={nextStep} disabled={saving}
            className="flex-1 px-4 py-3.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Saving...
              </span>
            ) : step === TOTAL_STEPS ? "Save Profile" : "Continue"}
          </button>
        </div>

        {step === 1 && (
          <button type="button" onClick={() => (window.location.href = "/")} className="w-full mt-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors text-center">
            Skip for now
          </button>
        )}
      </main>

      {/* Crop modal */}
      {cropImage && (
        <ImageCropModal
          imageUrl={cropImage}
          circular={cropTarget === "profile"}
          onSave={(croppedUrl) => {
            if (cropTarget === "profile") {
              setProfilePic(croppedUrl);
              saveProfile({ profilePic: croppedUrl });
              if (session?.user) {
                fetch("/api/user/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ profilePic: croppedUrl }),
                }).catch(() => {});
              }
            } else {
              setBackgroundPic(croppedUrl);
              saveProfile({ backgroundPic: croppedUrl });
              if (session?.user) {
                fetch("/api/user/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ backgroundPic: croppedUrl }),
                }).catch(() => {});
              }
            }
            setCropImage(null);
          }}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  );
}

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const startStep = parseInt(searchParams.get("step") || "1", 10);
  const initialStep = [1, 2].includes(startStep) ? startStep : 1;
  return <ProfileForm initialStep={initialStep} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600" /></div>}>
      <ProfilePageInner />
    </Suspense>
  );
}
