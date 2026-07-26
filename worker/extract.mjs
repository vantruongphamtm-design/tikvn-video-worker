// Boc noi dung chinh tu 1 URL (bai viet). Gian di, khong phu thuoc lib nang:
// tai HTML -> bo script/style -> lay text tu the noi dung -> gon.
export async function extractFromUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TikVNBot/1.0)", Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Khong tai duoc trang (${res.status})`);
  const html = await res.text();

  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();

  let body = html;
  // Bo cac khoi khong phai noi dung.
  body = body.replace(/<script[\s\S]*?<\/script>/gi, " ");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, " ");
  body = body.replace(/<(nav|header|footer|aside|form|noscript)[\s\S]*?<\/\1>/gi, " ");

  // Uu tien text trong the <p>, <h1-3>, <li>.
  const chunks = [];
  const re = /<(p|h1|h2|h3|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const t = decodeEntities(stripTags(m[2])).replace(/\s+/g, " ").trim();
    if (t.length >= 30) chunks.push(t);
  }
  let text = chunks.join("\n");
  if (text.length < 200) {
    // Du phong: lay toan bo text.
    text = decodeEntities(stripTags(body)).replace(/\s+/g, " ").trim();
  }
  return { title, text: text.slice(0, 9000) };
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ");
}
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
