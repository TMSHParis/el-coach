import { NextRequest } from "next/server";

// Cache mémoire process — Vercel garde une instance chaude un moment.
type CacheEntry = { videoId: string | null; expires: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json(
      { videoId: null, error: "missing-query" },
      { status: 400 },
    );
  }

  const key = q.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return Response.json(
      { videoId: cached.videoId, cached: true },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Pas de clé configurée : on renvoie null pour que le modal affiche le placeholder.
    return Response.json({ videoId: null, error: "no-api-key" });
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "1");
  searchUrl.searchParams.set("safeSearch", "strict");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("q", `${q} demo form crossfit tutorial`);
  searchUrl.searchParams.set("key", apiKey);

  try {
    const res = await fetch(searchUrl.toString(), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return Response.json({
        videoId: null,
        error: `youtube-api-error-${res.status}`,
      });
    }
    const data = (await res.json()) as {
      items?: Array<{ id?: { videoId?: string } }>;
    };
    const videoId = data.items?.[0]?.id?.videoId ?? null;
    cache.set(key, { videoId, expires: Date.now() + CACHE_TTL_MS });
    return Response.json(
      { videoId },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
    );
  } catch {
    return Response.json({ videoId: null, error: "fetch-failed" });
  }
}
