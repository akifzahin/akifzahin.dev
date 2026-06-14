import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL("https://medium.com/feed/@akifzahin");

    const posts = feed.items.slice(0, 5).map((item) => ({
      title: item.title,
      link: item.link,
      date: item.pubDate,
      summary: item.contentSnippet || "",
    }));

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // The edge CDN serves this for 30 mins and updates it quietly in the background
        "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    // CDN automatically serves the old cached version to users if your fetch fails!
    return new Response(
      JSON.stringify({ error: "Medium feed temporarily unavailable" }),
      { 
        status: 502, // Bad Gateway is more accurate for a third-party failure
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
