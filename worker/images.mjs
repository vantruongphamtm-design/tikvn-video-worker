// Tim anh stock tu Pexels (doc dung -> 9:16). Worker fetch server-side nen KHONG dinh CORS.
// Tra ve URL anh do phan giai cao (objectFit cover se cat cho vua 9:16).

/** Tim 1 anh doc theo tu khoa. offset de cac canh cung tu khoa lay anh khac nhau. */
export async function searchImage(query, offset = 0) {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return null;
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=10`,
    { headers: { Authorization: key } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const photos = data.photos || [];
  if (!photos.length) return null;
  const p = photos[offset % photos.length];
  return p.src.large2x || p.src.original || p.src.large || p.src.portrait;
}

/** Gan anh stock cho tung canh theo scene.imageQuery (fallback: topicWord). */
export async function stockForScenes(scenes, topicWord) {
  const used = new Set();
  for (let i = 0; i < scenes.length; i++) {
    const q = scenes[i].imageQuery || topicWord || "";
    if (!q) continue;
    try {
      // thu vai offset de tranh trung anh giua cac canh
      for (let off = 0; off < 4; off++) {
        const url = await searchImage(q, i + off);
        if (url && !used.has(url)) {
          used.add(url);
          scenes[i].image = url;
          break;
        }
        if (url && off === 3) scenes[i].image = url; // chap nhan trung neu het lua chon
      }
    } catch {
      /* bo qua, canh do dung gradient */
    }
  }
  return scenes;
}
