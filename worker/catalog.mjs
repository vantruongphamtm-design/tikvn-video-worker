// Menu rut gon cho LLM (dong bo voi src/auto/catalog.ts). Chi cac id/ten LLM duoc chon.
export const INDUSTRIES = [
  { id: "bds", name: "Bat dong san", who: "Moi gioi, chu dau tu" },
  { id: "tc", name: "Tai chinh / Dau tu", who: "Co van tai chinh, bao hiem" },
  { id: "luat", name: "Luat / Ke toan", who: "Luat su, ke toan" },
  { id: "gd", name: "Giao duc / Khoa hoc", who: "Trung tam, gia su" },
  { id: "ecom", name: "Ban hang / Review", who: "Nha ban hang, affiliate" },
  { id: "tin", name: "Tin tuc / Tong hop", who: "Page tin tuc" },
  { id: "quote", name: "Quote / Dong luc", who: "Kenh dong luc, tam linh" },
  { id: "sk", name: "Suc khoe / Gym", who: "PT, dinh duong, TPCN" },
  { id: "nha", name: "Nha khoa / Tham my", who: "Nha khoa, spa, tham my" },
  { id: "fnb", name: "Am thuc / Quan", who: "Nha hang, quan, cafe" },
];

// Chuyen dong da hien thuc trong AutoVideo.tsx. Chi cho LLM chon trong so nay.
// DUNG DA DANG (moi canh 1 motion khac nhau cho video song dong).
export const MOTIONS = [
  "fade", "rise", "drop", "slideL", "slideR", "slideT", "slideB", "zoomin", "zoomout",
  "pop", "popL", "popR", "punch", "bounce", "slamdown", "skewin", "expand", "squeeze",
  "flipx", "flipy", "flip3d", "tiltin", "rotatein", "spinin", "zoomspin", "swing", "wobble",
  "blurin", "riseblur", "zoomblur", "glideL", "glideR", "flyin", "iris", "shake", "neon",
  "typein", "unfoldY",
];

// Thanh phan da hien thuc trong AutoVideo.tsx. Kem schema data de LLM dien.
export const COMPONENTS = [
  { type: "bigNumber", fits: "1 con so noi bat (dien tich, gia, %, luot xem)", data: "{ value: string, label?: string }" },
  { type: "bars", fits: "so sanh vai muc theo cot (doanh thu theo quy...)", data: "{ items: [{ label: string, val: number(0-100), color?: string }] }" },
  { type: "donut", fits: "1 ty le phan tram (chuyen doi, hoan thanh)", data: "{ pct: number(0-100), label?: string }" },
  { type: "progress", fits: "vai thanh phan tram (danh gia, ky nang)", data: "{ items: [{ label: string, pct: number(0-100), color?: string }] }" },
  { type: "list", fits: "liet ke 3-5 y (buoc, loi ich, meo)", data: "{ items: [string], type: 'num' | 'check' }" },
  { type: "kpi", fits: "2 hoac 4 chi so KPI", data: "{ cells: [{ v: string, l: string, color?: string }] }" },
  { type: "compare", fits: "so sanh A/B (thue vs mua, truoc vs sau)", data: "{ a: { name: string, items: [string] }, b: { name: string, items: [string] } }" },
  { type: "ranking", fits: "xep hang top (san pham ban chay, kenh)", data: "{ items: [{ label: string, val: number }] }" },
  { type: "quote", fits: "cau trich dan / cham ngon", data: "{ text: string, author?: string }" },
  { type: "statPanel", fits: "bang du lieu 2-3 dong (nguon/thay doi/tac dong)", data: "{ rows: [{ label: string, value: string, big?: string, color?: string }] }" },
  { type: "timeline", fits: "dong thoi gian / lo trinh cac moc", data: "{ steps: [{ time: string, text: string }] }" },
  { type: "funnel", fits: "pheu chuyen doi cac buoc giam dan", data: "{ rows: [{ label: string, pct: number(0-100), color?: string }] }" },
  { type: "pie", fits: "co cau ty le nhieu phan (thi phan)", data: "{ segs: [{ pct: number, color: string, label: string }] }" },
  { type: "tags", fits: "cac tu khoa / hashtag noi bat", data: "{ tags: [string] }" },
  // ---- Khoi CAO CAP (an tuong, hoc tu creator hang dau) ----
  { type: "terminal", fits: "canh code/lenh chay + loi (rate limit, error) - hop tech/tin", data: "{ lines: [{ t: string, c?: string(mau chu, vd '#f87171' cho loi) }], badge?: string(chu do de len giua, vd 'RATE LIMIT') }" },
  { type: "statCards", fits: "2-3 con so noi bat trong the co vien+glow (dep hon kpi)", data: "{ cards: [{ v: string, l: string, color?: string }] }" },
  { type: "gauge", fits: "1 con so/khoang trong vong tron (gio, diem, muc do)", data: "{ value: string, pct: number(0-100), label?: string }" },
  { type: "nodeBurst", fits: "1 trung tam ket noi nhieu nguon toa tia (mang luoi, hub, tich hop)", data: "{ center: string, count?: number(6-16) }" },
  { type: "roadmap", fits: "lo trinh/cac buoc co danh so + duong noi doc", data: "{ steps: [{ label: string, sub?: string }] }" },
  { type: "badge", fits: "huy hieu thanh tich/giai thuong (#1 trending, winner)", data: "{ title: string, sub?: string }" },
];

export const INDUSTRY_IDS = INDUSTRIES.map((i) => i.id);

// QUY UOC CANH THEO THOI LUONG (web co 4 moc). So canh co dinh + cau truc + so tu/caption
// (uoc 2.5 tu/giay khi doc). Tong sec xap xi thoi luong.
// Cat canh DAY hon cho video song dong (moi canh doi nen/motion).
export const DURATION_SPEC = {
  30: { scenes: 6, structure: "hook, 4 y chinh, CTA" },
  45: { scenes: 8, structure: "hook, 6 y chinh, CTA" },
  60: { scenes: 10, structure: "hook, 8 y chinh, CTA" },
  120: { scenes: 15, structure: "hook, 13 y chinh, CTA" },
};
export const ALLOWED_DURATIONS = [30, 45, 60, 120];

/** Chuan hoa thoi luong ve 1 trong 4 moc gan nhat. */
export function snapDuration(sec) {
  const n = Number(sec) || 60;
  return ALLOWED_DURATIONS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), 60);
}

/** Tra ve { scenes, structure, perSceneSec, wordsPerScene } cho thoi luong da chuan hoa. */
export function specFor(sec) {
  const d = snapDuration(sec);
  const s = DURATION_SPEC[d];
  const perSceneSec = Math.round((d / s.scenes) * 10) / 10;
  // ~3.3 tu/giay (giong OmniVoice doc nhanh) -> caption dai du lap thoi luong, tranh dồn lang.
  return { duration: d, scenes: s.scenes, structure: s.structure, perSceneSec, wordsPerScene: Math.round(perSceneSec * 3.3) };
}
