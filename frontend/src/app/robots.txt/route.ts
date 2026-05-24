const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://bharatlocal.gov.in";

export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${PORTAL_URL}/sitemap.xml`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
