export async function GET(request:Request){return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(request.url).origin}/sitemap.xml`,{headers:{'Content-Type':'text/plain'}});}
