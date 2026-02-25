"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/playerProfile";

export interface IntakeAnswers {
  divisions: string[];
  conferenceTiers: string[];
  competitiveness: string;
  regions: string[];
  maxDistance: number | null;
  maxTuition: number | null;
  schoolSize: string;
  highAcademic: boolean;
  draftImportance: string;
  gpa: string;
  satScore: string;
  actScore: string;
}

interface AIScoutIntakeProps {
  onComplete: (message: string, answers: IntakeAnswers) => void;
  initialValues?: Partial<IntakeAnswers>;
  isEditing?: boolean;
  onCancel?: () => void;
}

// Single-select chip group
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            value === opt.value
              ? "bg-red-600 text-white border-red-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {opt.label}
          {opt.sub && <span className="text-[10px] opacity-70 ml-1">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// Multi-select chip group
function MultiChipGroup({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
            values.includes(opt.value)
              ? "bg-red-600 text-white border-red-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function QuestionCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function composeIntakeMessage(a: IntakeAnswers): string {
  const parts: string[] = [];

  if (a.divisions.length > 0) {
    parts.push(`I'm looking for ${a.divisions.join(" and ")} programs`);
    if (a.conferenceTiers.length > 0 && a.divisions.includes("D1")) {
      parts.push(`specifically ${a.conferenceTiers.join(", ")} level`);
    }
  } else {
    parts.push("I'm open to any division");
  }

  if (a.regions.length > 0 && a.regions.length < Object.keys(REGIONS).length) {
    parts.push(`in the ${a.regions.join(", ")}`);
  }

  if (a.maxDistance) {
    parts.push(`within ${a.maxDistance.toLocaleString()} miles of home`);
  }

  if (a.maxTuition) {
    parts.push(`with tuition under $${a.maxTuition.toLocaleString()}/year`);
  }

  if (a.schoolSize === "small") parts.push("at a small school");
  else if (a.schoolSize === "medium") parts.push("at a mid-size school");
  else if (a.schoolSize === "large") parts.push("at a large school");

  if (a.highAcademic) parts.push("with strong academics");

  if (a.competitiveness === "top25") parts.push("that's nationally ranked");
  else if (a.competitiveness === "postseason") parts.push("that competes for the postseason");

  if (a.draftImportance === "yes") parts.push("and getting drafted is important to me");

  const academics: string[] = [];
  if (a.gpa) academics.push(`my GPA is ${a.gpa}`);
  if (a.satScore) academics.push(`SAT is ${a.satScore}`);
  if (a.actScore) academics.push(`ACT is ${a.actScore}`);
  if (academics.length > 0) parts.push(academics.join(", "));

  return parts.join(". ") + ". Find me the best programs that fit!";
}

export default function AIScoutIntake({
  onComplete,
  initialValues,
  isEditing,
  onCancel,
}: AIScoutIntakeProps) {
  const [divisions, setDivisions] = useState<string[]>(initialValues?.divisions || []);
  const [conferenceTiers, setConferenceTiers] = useState<string[]>(initialValues?.conferenceTiers || []);
  const [competitiveness, setCompetitiveness] = useState(initialValues?.competitiveness || "");
  const [regions, setRegions] = useState<string[]>(initialValues?.regions || []);
  const [maxDistance, setMaxDistance] = useState<number | null>(initialValues?.maxDistance ?? null);
  const [maxTuition, setMaxTuition] = useState<number | null>(initialValues?.maxTuition ?? null);
  const [schoolSize, setSchoolSize] = useState(initialValues?.schoolSize || "");
  const [highAcademic, setHighAcademic] = useState(initialValues?.highAcademic ?? false);
  const [draftImportance, setDraftImportance] = useState(initialValues?.draftImportance || "");
  const [gpa, setGpa] = useState(initialValues?.gpa || "");
  const [satScore, setSatScore] = useState(initialValues?.satScore || "");
  const [actScore, setActScore] = useState(initialValues?.actScore || "");

  const handleDivisionsChange = (newDivisions: string[]) => {
    setDivisions(newDivisions);
    if (!newDivisions.includes("D1")) {
      setConferenceTiers([]);
    }
  };

  const canSubmit = divisions.length > 0;

  const handleSubmit = () => {
    const answers: IntakeAnswers = {
      divisions,
      conferenceTiers: divisions.includes("D1") ? conferenceTiers : [],
      competitiveness,
      regions,
      maxDistance,
      maxTuition,
      schoolSize,
      highAcademic,
      draftImportance,
      gpa,
      satScore,
      actScore,
    };
    const message = composeIntakeMessage(answers);
    onComplete(message, answers);
  };

  const regionOptions = Object.keys(REGIONS).map((r) => ({ value: r, label: r }));

  return (
    <div className="max-w-lg mx-auto w-full py-2 px-1">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-gray-900">
          {isEditing ? "Update Your Preferences" : "AI Scout: Find Your Fit"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing
            ? "Adjust your answers and we'll find updated matches"
            : "Quick questions so I can find the right programs for you"}
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Division (multi-select) */}
        <QuestionCard label="What division are you looking at?" hint="Select all that apply">
          <MultiChipGroup
            options={[
              { value: "D1", label: "D1" },
              { value: "D2", label: "D2" },
              { value: "D3", label: "D3" },
              { value: "JUCO", label: "JUCO" },
            ]}
            values={divisions}
            onChange={handleDivisionsChange}
          />
        </QuestionCard>

        {/* 1b. Conference tier — only when D1 is selected */}
        {divisions.includes("D1") && (
          <QuestionCard label="What level of D1 program?" hint="Select all that apply">
            <MultiChipGroup
              options={[
                { value: "Power", label: "Power Conference" },
                { value: "High-Major", label: "High Major" },
                { value: "Mid-Major", label: "Mid Major" },
                { value: "Low-Major", label: "Low Major" },
              ]}
              values={conferenceTiers}
              onChange={setConferenceTiers}
            />
          </QuestionCard>
        )}

        {/* 2. Competition level */}
        <QuestionCard label="How competitive do you want the program?">
          <ChipGroup
            options={[
              { value: "top25", label: "Top 25 ranked" },
              { value: "postseason", label: "Postseason contenders" },
              { value: "any", label: "Any level" },
            ]}
            value={competitiveness}
            onChange={setCompetitiveness}
          />
        </QuestionCard>

        {/* 3. Region */}
        <QuestionCard
          label="Where do you want to play?"
          hint="Pick as many regions as you want"
        >
          <MultiChipGroup
            options={regionOptions}
            values={regions}
            onChange={setRegions}
          />
          {regions.length > 0 && (
            <button
              type="button"
              onClick={() => setRegions([])}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors mt-1"
            >
              Clear all — open to anywhere
            </button>
          )}
        </QuestionCard>

        {/* 4. Distance */}
        <QuestionCard label="How far from home are you willing to go?">
          <ChipGroup
            options={[
              { value: "100", label: "Under 100 mi" },
              { value: "250", label: "Under 250 mi" },
              { value: "500", label: "Under 500 mi" },
              { value: "1000", label: "Under 1,000 mi" },
              { value: "any", label: "Anywhere" },
            ]}
            value={maxDistance ? String(maxDistance) : ""}
            onChange={(v) => setMaxDistance(v === "any" ? null : parseInt(v))}
          />
        </QuestionCard>

        {/* 5. Tuition */}
        <QuestionCard label="What can your family spend on tuition per year?">
          <ChipGroup
            options={[
              { value: "15000", label: "Under $15K" },
              { value: "30000", label: "Under $30K" },
              { value: "50000", label: "Under $50K" },
              { value: "any", label: "No limit" },
            ]}
            value={maxTuition ? String(maxTuition) : ""}
            onChange={(v) => setMaxTuition(v === "any" ? null : parseInt(v))}
          />
        </QuestionCard>

        {/* 6. School size */}
        <QuestionCard label="What size school do you want?">
          <ChipGroup
            options={[
              { value: "small", label: "Small", sub: "(<5K)" },
              { value: "medium", label: "Medium", sub: "(5-15K)" },
              { value: "large", label: "Large", sub: "(15K+)" },
              { value: "any", label: "Any size" },
            ]}
            value={schoolSize}
            onChange={setSchoolSize}
          />
        </QuestionCard>

        {/* 7. Academics */}
        <QuestionCard label="Are strong academics important to you?">
          <ChipGroup
            options={[
              { value: "yes", label: "Yes — high academic schools" },
              { value: "no", label: "Not a dealbreaker" },
            ]}
            value={highAcademic ? "yes" : (highAcademic === false && divisions.length > 0 ? "no" : "")}
            onChange={(v) => setHighAcademic(v === "yes")}
          />
        </QuestionCard>

        {/* 7b. GPA, SAT, ACT */}
        <QuestionCard label="What are your grades and test scores?" hint="Optional — helps us find the right academic fit">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">GPA</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 3.5"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SAT</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1200"
                value={satScore}
                onChange={(e) => setSatScore(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ACT</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 25"
                value={actScore}
                onChange={(e) => setActScore(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </QuestionCard>

        {/* 8. Draft */}
        <QuestionCard label="Is getting drafted a goal for you?">
          <ChipGroup
            options={[
              { value: "yes", label: "Yes — show me draft factories" },
              { value: "no", label: "Not a priority" },
            ]}
            value={draftImportance}
            onChange={setDraftImportance}
          />
        </QuestionCard>
      </div>

      {/* Submit */}
      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold hover:from-red-700 hover:to-red-800 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 transition-all shadow-md disabled:shadow-none"
        >
          {isEditing ? "Update & Find Programs" : "Find My Programs"}
        </button>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
        )}
        {!isEditing && (
          <p className="text-[11px] text-gray-400 text-center">
            You can always adjust these later
          </p>
        )}
      </div>
    </div>
  );
}
