import Parser from "rss-parser";

const parser = new Parser();

let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 1000 * 60 * 30; // 30 min

export async function GET() {
  const now = Date.now();

  try {
    const feed = await parser.parseURL(
      "https://medium.com/feed/@akifzahin"
    );

    const posts = feed.items.slice(0, 5).map((item) => ({
      title: item.title,
      link: item.link,
      date: item.pubDate,
      summary: item.contentSnippet || "",
    }));

    cache = {
      data: posts,
      timestamp: now,
    };

    return new Response(JSON.stringify(posts), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=1800, stale-while-revalidate",
      },
    });
  } catch (err) {
    // 🔥 fallback: return last known good cache
    if (cache.data) {
      return new Response(JSON.stringify(cache.data), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Fallback": "true",
        },
      });
    }

    return new Response(
      JSON.stringify({ error: "Medium feed unavailable" }),
      { status: 500 }
    );
  }
}