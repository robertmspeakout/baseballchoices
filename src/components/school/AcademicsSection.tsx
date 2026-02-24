"use client";

import { useEffect, useState } from "react";

interface SchoolDetail {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  stadium_latitude: number | null;
  stadium_longitude: number | null;
  stadium_name: string | null;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  head_coach_tenure_start: number | null;
  head_coach_record: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
  website: string | null;
  last_season_record: string | null;
  logo_url: string | null;
  mlb_draft_picks: number | null;
  stadium_image_url: string | null;
  enrollment: number | null;
  acceptance_rate: number | null;
  graduation_rate: number | null;
  cws_appearances: number;
  ncaa_regionals: number;
  recruiting_questionnaire_url: string | null;
  nil_url: string | null;
  high_academic: boolean;
  primary_color?: string | null;
}

interface AcademicsData {
  scorecard: {
    matched_name: string;
    student_faculty_ratio: number | null;
    in_state_tuition: number | null;
    out_of_state_tuition: number | null;
    avg_net_price: number | null;
    aid_percentage: number | null;
    sat_25: number | null;
    sat_75: number | null;
    act_25: number | null;
    act_75: number | null;
  } | null;
  programs: { title: string; code: string }[];
}

interface AcademicsSectionProps {
  school: SchoolDetail;
  distanceFromHome: number | null;
  userZip: string | null;
}

export default function AcademicsSection({ school, distanceFromHome, userZip }: AcademicsSectionProps) {
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [academicsData, setAcademicsData] = useState<AcademicsData | null>(null);
  const [majorsExpanded, setMajorsExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/academics-data?school=${encodeURIComponent(school.name)}&state=${encodeURIComponent(school.state || "")}&city=${encodeURIComponent(school.city || "")}`)
      .then((r) => r.json())
      .then((data) => setAcademicsData(data))
      .catch(() => setAcademicsData(null));
  }, [school.name, school.state, school.city]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setAcademicsOpen(!academicsOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
        <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Academics & School Info</span>
        <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${academicsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {academicsOpen && (
        <div className="border-t border-gray-100 p-4 sm:p-6 space-y-4">
          {(school.city || school.state) && (
            <p className="text-xs font-medium text-gray-500">Location: <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name} ${school.city || ""} ${school.state || ""}`)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{school.city}{school.city && school.state ? ", " : ""}{school.state}</a>{distanceFromHome != null && <> | <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(userZip || "")}&destination=${encodeURIComponent(`${school.name} ${school.city || ""} ${school.state || ""}`)}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{distanceFromHome.toLocaleString()} miles from home</a></>}</p>
          )}
          {school.public_private && (
            <p className="text-xs font-medium text-gray-500">{school.public_private === "Private" ? "Type: Private Institution" : "Type: Public Institution"}</p>
          )}
          {school.high_academic && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-yellow-800">High-Academic Institution</span>
            </div>
          )}

          {/* Stat cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {school.enrollment != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Enrollment</p>
                <p className="text-lg font-bold text-gray-900">{school.enrollment.toLocaleString()}</p>
              </div>
            )}
            {school.acceptance_rate != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Acceptance Rate</p>
                <p className="text-lg font-bold text-gray-900">{school.acceptance_rate}%</p>
              </div>
            )}
            {school.graduation_rate != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Graduation Rate</p>
                <p className="text-lg font-bold text-gray-900">{school.graduation_rate}%</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Student : Faculty</p>
              <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.student_faculty_ratio != null ? `${academicsData.scorecard.student_faculty_ratio}:1` : "Not reported"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">In-State Tuition</p>
              <p className="text-lg font-bold text-gray-900">{school.tuition ? `$${school.tuition.toLocaleString()}` : "N/A"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Out-of-State Tuition</p>
              <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.out_of_state_tuition != null ? `$${academicsData.scorecard.out_of_state_tuition.toLocaleString()}` : "Not reported"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Avg Tuition</p>
              <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.avg_net_price != null ? `$${academicsData.scorecard.avg_net_price.toLocaleString()}` : "Not reported"}</p>
              {academicsData?.scorecard?.avg_net_price != null && (
                <p className="text-[9px] text-gray-400 mt-0.5">Avg net price after aid</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Receiving Aid</p>
              <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.aid_percentage != null ? `${academicsData.scorecard.aid_percentage}%` : "Not reported"}</p>
            </div>
          </div>

          {/* SAT / ACT middle 50% */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">SAT Middle 50%</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {academicsData?.scorecard?.sat_25 != null && academicsData?.scorecard?.sat_75 != null
                  ? `${academicsData.scorecard.sat_25}\u2013${academicsData.scorecard.sat_75}`
                  : "Not reported"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">ACT Middle 50%</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {academicsData?.scorecard?.act_25 != null && academicsData?.scorecard?.act_75 != null
                  ? `${academicsData.scorecard.act_25}\u2013${academicsData.scorecard.act_75}`
                  : "Not reported"}
              </p>
            </div>
          </div>

          {/* Majors -- inline dropdown within academics */}
          {academicsData?.programs && academicsData.programs.length > 0 && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button
                onClick={() => setMajorsExpanded(!majorsExpanded)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="flex-1 text-sm font-semibold text-gray-700">
                  {majorsExpanded ? "Hide Majors" : `View All ${academicsData.programs.length} Majors`}
                </span>
                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${majorsExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {majorsExpanded && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                    {academicsData.programs.map((prog, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
                        <svg className="w-3 h-3 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600">{prog.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
