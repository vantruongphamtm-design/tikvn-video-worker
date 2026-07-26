// Catalog templates da gan nhan: LLM chon tu day, Remotion map sang component.
// Trich tu mau-video/_artifact_engine.html. Day la "thuc don" auto-select.

export type IndustryTheme = {
  id: string;
  name: string;
  who: string; // phu hop voi ai
  g: [string, string]; // gradient nen
  acc: string; // mau nhan (accent)
  font: "sans" | "serif" | "cond";
  light?: boolean;
};

// 10 nganh, moi nganh la mot he mau/font rieng.
export const INDUSTRIES: IndustryTheme[] = [
  { id: "bds", name: "Bat dong san", who: "Moi gioi, chu dau tu", g: ["#12325a", "#0a1526"], acc: "#e9c877", font: "sans" },
  { id: "tc", name: "Tai chinh / Dau tu", who: "Co van tai chinh, bao hiem", g: ["#0b2018", "#04120b"], acc: "#34d399", font: "cond" },
  { id: "luat", name: "Luat / Ke toan", who: "Luat su, ke toan", g: ["#141f3a", "#080e1c"], acc: "#d4a017", font: "sans" },
  { id: "gd", name: "Giao duc / Khoa hoc", who: "Trung tam, gia su", g: ["#173a4d", "#0a1b26"], acc: "#7dd3fc", font: "sans" },
  { id: "ecom", name: "Ban hang / Review", who: "Nha ban hang, affiliate", g: ["#3a0f2e", "#160611"], acc: "#fb7185", font: "cond" },
  { id: "tin", name: "Tin tuc / Tong hop", who: "Page tin tuc", g: ["#2a0d10", "#0f0405"], acc: "#f87171", font: "cond" },
  { id: "quote", name: "Quote / Dong luc", who: "Kenh dong luc, tam linh", g: ["#0a0a12", "#050508"], acc: "#d9b46a", font: "serif" },
  { id: "sk", name: "Suc khoe / Gym", who: "PT, dinh duong, TPCN", g: ["#0c2a1c", "#04120b"], acc: "#4ade80", font: "cond" },
  { id: "nha", name: "Nha khoa / Tham my", who: "Nha khoa, spa, tham my", g: ["#3a2530", "#160a10"], acc: "#f9a8c4", font: "serif" },
  { id: "fnb", name: "Am thuc / Quan", who: "Nha hang, quan, cafe", g: ["#3a1c08", "#160a03"], acc: "#fbbf24", font: "serif" },
];

// 11 format = cau truc hook/kich ban.
export const FORMATS = [
  { id: "list", tag: "Dem nguoc", fits: "Top N, danh sach meo/dieu can biet" },
  { id: "myth", tag: "Sai / Dung", fits: "Bac bo lam tuong, chinh sua hieu nham" },
  { id: "compare", tag: "So sanh A/B", fits: "Hai lua chon, nen chon cai nao" },
  { id: "explain", tag: "Giai ma 60s", fits: "Giai thich khai niem nhanh" },
  { id: "tip", tag: "Meo nhanh", fits: "Mot loi khuyen, dung lam sai" },
  { id: "twist", tag: "Lat nguoc", fits: "Tuong dat hoa ra re, cu lat bat ngo" },
  { id: "news", tag: "Ban tin nong", fits: "Tin moi, thay doi, cap nhat" },
  { id: "story", tag: "Ke chuyen", fits: "Cau chuyen co that, case" },
  { id: "fact", tag: "Chua biet", fits: "90% khong biet, su that bat ngo" },
  { id: "before", tag: "Lot xac", fits: "Truoc va sau, thay doi" },
  { id: "quote", tag: "Trich dan", fits: "Cau noi truyen cam hung" },
] as const;

// 54 chuyen dong, chia 5 nhom. MVP Remotion hien thuc mot phan (backbone); con lai mo rong dan.
export const MOTIONS: { id: string; name: string; group: string; fx?: string }[] = [
  ...["fade:Hien dan", "rise:Troi len", "drop:Roi xuong", "slideL:Truot trai", "slideR:Truot phai", "zoomin:Phong vao", "zoomout:Thu ra", "pop:Nay dong", "bounce:Bat nay", "flipx:Lat doc", "flipy:Lat ngang", "rotatein:Xoay vao", "blurin:Mo vao net", "skewin:Nghieng vao", "expand:Gian no", "unfold:Mo ra", "maskwipe:Quet lo", "elastic:Co gian"].map((s) => ({ id: s.split(":")[0], name: s.split(":")[1], group: "Xuat hien" })),
  ...["type:Go may", "wave:Song chu", "letterpop:Nay tung chu", "shake:Rung lac", "jitter:Giat", "neon:Neon nhap nhay", "gsweep:Quet gradient", "stretch:Keo gian", "swing:Dung dua", "glitch:Glitch"].map((s) => ({ id: s.split(":")[0], name: s.split(":")[1], group: "Chu dong" })),
  ...["kenin:Ken Burns vao", "kenout:Ken Burns ra", "panl:Lia trai", "panr:Lia phai", "tilt:Ngang", "parallax:Parallax", "hue:Doi sac", "breathe:Tho", "dolly:Dolly zoom", "vig:Toi vien nhip"].map((s) => ({ id: s.split(":")[0], name: s.split(":")[1], group: "Camera" })),
  ...["cube:3D xoay khoi", "card3d:Lat the 3D", "roty:Xoay truc Y", "rotx:Xoay truc X", "persp:Nghieng phoi canh", "coin:Lat dong xu"].map((s) => ({ id: s.split(":")[0], name: s.split(":")[1], group: "3D" })),
  ...["particle:Hat bay|particle", "confetti:Phao giay|confetti", "snow:Tuyet roi|snow", "bokeh:Bokeh|bokeh", "sparkle:Lap lanh|sparkle", "scan:Scanline", "sweep:Quet sang", "grain:Nhieu hat", "rgb:Tach RGB", "glow:Phat sang"].map((s) => { const [id, rest] = s.split(":"); const [name, fx] = rest.split("|"); return { id, name, group: "Hieu ung", ...(fx ? { fx } : {}) }; }),
];

// 100 thanh phan truc quan, 8 nhom. LLM chon ten + dien data theo schema. MVP hien thuc mot phan.
export const COMPS: { name: string; category: string }[] = [
  ...["Cot doc", "Cot doc nhieu", "Cot ngang", "Xep hang thanh", "Duong", "Duong + vung", "Hai duong", "Tron %", "Tron nhieu mang", "Thi phan", "Dong ho do", "Dong ho toc do", "Vong tien trinh", "Thanh phan tram", "Thanh ky nang", "Bullet muc tieu", "Pheu chuyen doi", "Kim tu thap", "Nhiet ke", "Heatmap", "Dem so lon", "Dem so phu", "Cot kep nam/nu", "Vung 8 moc", "Ty le nam / nu"].map((name) => ({ name, category: "Bieu do" })),
  ...["Luoi KPI 2x2", "Luoi KPI 3 o", "So + xu huong", "So sanh 2 so", "Gia lon", "Dem nguoc", "Danh gia sao", "Nhiet do muc tieu", "Diem VS", "Tang truong lon", "Giam gia lon", "Cot moc follower", "Diem so VS", "Chi so + thanh", "Tang truong 5 nam"].map((name) => ({ name, category: "So & KPI" })),
  ...["Danh sach tich", "Danh sach gach", "Liet ke danh so", "Danh sach cham", "Danh sach mui ten", "Danh sach sao", "Nen / Khong nen", "Uu / Nhuoc", "Todo tien trinh", "Tier list", "Buc vinh danh", "Danh sach 2 cot", "Nen / Khong nen 2", "Quy trinh 4 buoc", "Bang vang tuan"].map((name) => ({ name, category: "Liet ke" })),
  ...["A/B doi dau", "Bang so sanh", "Thuc te vs Lam tuong", "Dung / Sai", "Thuoc do", "Bang verb", "3 lua chon", "Ma tran tinh nang", "Keo co", "Dung / Sai nhanh"].map((name) => ({ name, category: "So sanh" })),
  ...["Panel Source/Impact", "The nhan + rows", "Stat rows so lon", "Before/After/Note", "Live updates", "Data big signal", "Ticker bar", "Bang thong so", "Case file", "Bang diem", "Bang trang thai", "Tin hieu phu"].map((name) => ({ name, category: "Panel du lieu" })),
  ...["Trich dan", "Hop meo", "Hop canh bao", "Hop su that", "Dinh nghia", "Hoi dap FAQ", "Binh chon", "Ket qua binh chon", "Bang gia", "Nut CTA", "Cau do", "Trich dan 2"].map((name) => ({ name, category: "Noi dung" })),
  ...["Dam may hashtag", "Thanh cam xuc", "Bo dem follower", "Testimonial", "Mocluot xem", "Ket qua binh chon"].map((name) => ({ name, category: "Xa hoi" })),
  ...["Dong thoi gian", "Roadmap ha tang", "Ban do + tuyen", "Lich / ngay", "Lich trong tuan"].map((name) => ({ name, category: "Thoi gian & Vi tri" })),
];

export const getIndustry = (id: string): IndustryTheme => INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[0];

// Tom tat catalog cho LLM (nho gon de nhoi vao prompt).
export function catalogForLLM() {
  return {
    industries: INDUSTRIES.map((i) => ({ id: i.id, name: i.name, who: i.who })),
    formats: FORMATS.map((f) => ({ id: f.id, tag: f.tag, fits: f.fits })),
    motions: MOTIONS.map((m) => ({ id: m.id, name: m.name, group: m.group })),
    components: COMPS.map((c) => ({ name: c.name, category: c.category })),
  };
}
