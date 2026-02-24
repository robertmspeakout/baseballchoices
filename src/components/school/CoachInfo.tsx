"use client";

import { useState } from "react";

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
  recruiting_coordinator_name: string | null;
  recruiting_coordinator_email: string | null;
  mailing_address: string | null;
  high_academic: boolean;
  primary_color?: string | null;
}

interface CoachInfoProps {
  school: SchoolDetail;
}

export default function CoachInfo({ school }: CoachInfoProps) {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setCoachOpen(!coachOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Coaching Staff</span>
        <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${coachOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {coachOpen && (
        <div className="border-t border-gray-100 p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm sm:text-base text-gray-900 font-bold">{school.head_coach_name || "N/A"}</p>
              <p className="text-xs text-gray-500">Head Coach</p>
              {school.head_coach_tenure_start && (() => {
                const n = new Date().getFullYear() - school.head_coach_tenure_start + 1;
                const s = (n % 100 >= 11 && n % 100 <= 13) ? "th" : ["th","st","nd","rd"][n % 10] || "th";
                return <p className="text-xs text-gray-600 mt-1">{n}{s} Season ({school.head_coach_tenure_start}&ndash;Present)</p>;
              })()}
              {school.head_coach_record && (
                <p className="text-xs text-gray-600">Career Record: {school.head_coach_record}</p>
              )}
              {school.head_coach_email && (
                <a href={`mailto:${school.head_coach_email}`} className="text-xs sm:text-sm text-blue-600 hover:underline break-all mt-1 block">
                  {school.head_coach_email}
                </a>
              )}
            </div>

            {school.recruiting_coordinator_name && (
              <div className="mt-3">
                <p className="text-sm sm:text-base text-gray-900 font-bold">{school.recruiting_coordinator_name}</p>
                <p className="text-xs text-gray-500">Recruiting Coordinator</p>
                {school.recruiting_coordinator_email && (
                  <a href={`mailto:${school.recruiting_coordinator_email}`} className="text-xs sm:text-sm text-blue-600 hover:underline break-all mt-1 block">
                    {school.recruiting_coordinator_email}
                  </a>
                )}
              </div>
            )}

            {school.mailing_address && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 font-semibold">Mailing Address</p>
                <p className="text-xs sm:text-sm text-gray-700">{school.mailing_address}</p>
              </div>
            )}

            {school.website && (
              <div className="mt-2">
                <a
                  href={`${school.website}/coaches`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:underline"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View Full Coaching Staff
                </a>
                <p className="text-xs text-gray-500 italic mt-2">Please note: Many programs do not publish their coach&apos;s real email addresses. We suggest visiting the Coaching Staff link above to find out more and/or writing a real physical note to the address listed below. A handwritten note really stands out!</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                My Contact at {school.name}
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Contact name at this school"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
                <input
                  type="email"
                  placeholder="Contact email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
