"use client";

import { useEffect, useState } from "react";

interface FacilityPhotosProps {
  schoolName: string;
  stadiumName: string | null;
  mascot: string;
}

export default function FacilityPhotos({ schoolName, stadiumName, mascot }: FacilityPhotosProps) {
  const [facilityPhotos, setFacilityPhotos] = useState<{ url: string; caption: string }[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch stadium photos when we have a stadium name for accurate results
    if (!stadiumName) {
      setFacilityPhotos([]);
      setPhotosLoading(false);
      return;
    }
    setPhotosLoading(true);
    fetch(`/api/stadium-photos?school=${encodeURIComponent(schoolName)}&stadium=${encodeURIComponent(stadiumName)}&mascot=${encodeURIComponent(mascot || "")}`)
      .then((r) => r.json())
      .then((data) => setFacilityPhotos(data.photos || []))
      .catch(() => setFacilityPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [schoolName, stadiumName, mascot]);

  if (photosLoading || facilityPhotos.length === 0) return null;

  return (
    <>
      <div className="p-4 sm:p-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Stadium Photos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {facilityPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity group"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxIdx !== null && facilityPhotos[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={facilityPhotos[lightboxIdx].url}
              alt={facilityPhotos[lightboxIdx].caption}
              className="w-full rounded-lg shadow-2xl"
            />
            {facilityPhotos[lightboxIdx].caption && (
              <p className="text-white/80 text-sm text-center mt-3">{facilityPhotos[lightboxIdx].caption}</p>
            )}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {facilityPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + facilityPhotos.length) % facilityPhotos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % facilityPhotos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
