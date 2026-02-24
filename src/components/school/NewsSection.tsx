"use client";

import { useEffect, useState } from "react";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface NewsSectionProps {
  schoolName: string;
}

function formatNewsDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
}

export default function NewsSection({ schoolName }: NewsSectionProps) {
  const [newsOpen, setNewsOpen] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    setNewsLoading(true);
    fetch(`/api/news?school=${encodeURIComponent(schoolName)}`)
      .then((r) => r.json())
      .then((data) => setNews(data.articles || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [schoolName]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setNewsOpen(!newsOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Latest News</span>
        <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${newsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {newsOpen && (
        <div className="border-t border-gray-100 p-4 sm:p-6">
          {newsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-blue-600" />
              Loading news...
            </div>
          ) : news.length > 0 ? (
            <div className="space-y-3">
              {news.map((article, i) => (
                <a key={i} href={article.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    {article.source && <span className="font-medium text-gray-600">{article.source}</span>}
                    {article.source && article.pubDate && <span>&middot;</span>}
                    {article.pubDate && <span>{formatNewsDate(article.pubDate)}</span>}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">No recent news found</p>
          )}
        </div>
      )}
    </div>
  );
}
