import Link from "next/link";
import type { TopArticle } from "@/server/services/AnalyticsService";

type Props = { data: TopArticle[] };

export function TopArticles({ data }: Props) {
  const max = Math.max(...data.map((a) => a.postCount), 1);

  return (
    <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
      <h2 className="mb-4 text-base font-semibold text-[#f1f0ff]">Top Articles</h2>
      {data.length === 0 ? (
        <p className="text-sm text-[#6b6988]">No articles with posts yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map((article, idx) => (
            <div key={article.id} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs text-[#6b6988]">{idx + 1}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/articles/${article.id}`}
                  className="block truncate text-sm text-[#f1f0ff] hover:text-[#8b5cf6] transition-colors"
                >
                  {article.title}
                </Link>
                <div className="mt-0.5 h-1 w-full rounded-full bg-[#2e2e3e]">
                  <div
                    className="h-full rounded-full bg-[#6d28d9]/60"
                    style={{ width: `${(article.postCount / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-[#8b5cf6]">
                {article.postCount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
