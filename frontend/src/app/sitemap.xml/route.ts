import { getStates, request } from "@/lib/api";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://bharatlocal.gov.in";

export async function GET() {
  try {
    // Fetch all states, districts, services, and blogs in parallel
    const [states, districts, services, blogs] = await Promise.all([
      getStates(),
      request("/api/districts"),
      request("/api/services"),
      request("/api/blogs")
    ]);

    const urls: string[] = [];

    // 1. Static Pages
    urls.push(`${PORTAL_URL}/`);
    urls.push(`${PORTAL_URL}/blogs`);
    urls.push(`${PORTAL_URL}/privacy-policy`);
    urls.push(`${PORTAL_URL}/cookie-policy`);
    urls.push(`${PORTAL_URL}/terms`);
    urls.push(`${PORTAL_URL}/disclaimer`);
    urls.push(`${PORTAL_URL}/about`);
    urls.push(`${PORTAL_URL}/contact`);

    // 2. State Pages
    const stateMap = new Map<string, string>(); // id -> slug
    if (Array.isArray(states)) {
      states.forEach((s: any) => {
        urls.push(`${PORTAL_URL}/${s.slug}`);
        stateMap.set(s.id, s.slug);
      });
    }

    // 3. District Pages
    const districtMap = new Map<string, { slug: string; stateSlug: string }>(); // id -> {slug, stateSlug}
    if (Array.isArray(districts)) {
      districts.forEach((d: any) => {
        const stateSlug = stateMap.get(d.state_id);
        if (stateSlug) {
          urls.push(`${PORTAL_URL}/${stateSlug}/${d.slug}`);
          districtMap.set(d.id, { slug: d.slug, stateSlug });
        }
      });
    }

    // 4. Service Pages
    if (Array.isArray(services)) {
      services.forEach((s: any) => {
        const distInfo = districtMap.get(s.district_id);
        if (distInfo) {
          urls.push(`${PORTAL_URL}/${distInfo.stateSlug}/${distInfo.slug}/${s.slug}`);
        }
      });
    }

    // 5. Blog Pages
    if (Array.isArray(blogs)) {
      blogs.forEach((b: any) => {
        urls.push(`${PORTAL_URL}/blogs/${b.slug}`);
      });
    }

    // Generate XML string
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>${url === `${PORTAL_URL}/` ? "1.0" : url.split("/").length <= 4 ? "0.8" : "0.6"}</priority>
  </url>`
    )
    .join("")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=18000",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    // Return fallback clean sitemap rather than failing
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${PORTAL_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/blogs</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/privacy-policy</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/cookie-policy</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/terms</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/disclaimer</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/about</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${PORTAL_URL}/contact</loc>
    <priority>0.6</priority>
  </url>
</urlset>`;
    return new Response(fallbackXml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
