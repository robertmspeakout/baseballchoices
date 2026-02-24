"use client";

export default function SchoolError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#CC0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Error loading school</h2>
        <p className="text-sm text-gray-600 mb-6">
          We couldn&apos;t load this school&apos;s information. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
