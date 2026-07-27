// A3: LLM phan tich noi dung -> chon nganh/chuyen dong/thanh phan -> scene plan JSON
// + tieu de/mo ta/hashtag. Tai dung mau goi OpenRouter cua tts-optimizer/src/lib/openrouter.ts.
import { INDUSTRIES, MOTIONS, COMPONENTS, INDUSTRY_IDS, specFor } from "./catalog.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_VIDEO_MODEL || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-flash-lite";

function buildSystemPrompt(spec) {
  return [
    `Ban la BIEN KICH + dao dien video ngan tieng Viet cho TikTok/Reels (doc 9:16), chuyen viral.`,
    `Tu NOI DUNG nguoi dung, tao SCENE PLAN cho video dai ${spec.duration} giay.`,
    `- Neu noi dung NGAN (vai cau) -> MO RONG thanh cau chuyen day du, them goc nhin/vi du/con so hop ly de CUON HUT. Neu DAI (bai bao/link) -> TOM TAT, chat loc y HAY va SOC nhat, cô dong. Du dau vao the nao, dau ra PHAI la kich ban video hap dan tu dau den cuoi.`,
    `- 3 GIAY DAU (canh 1) la HOOK song con: phai chan dung nguoi luot, gay to mo/soc/cham dung noi dau. Cac canh sau dan dat lien mach, moi canh mot y, tao ly do xem tiep -> giu chan den CTA cuoi.`,
    ``,
    `*** BAT BUOC: MOI van ban tieng Viet ban XUAT RA (title, caption, kicker, description, hashtags, du lieu component) PHAI CO DAU THANH DAY DU (sắc/huyền/hỏi/ngã/nặng, chữ ă/â/ê/ô/ơ/ư/đ). Chinh ban thao tu nay khong dau CHI de tiet kiem, nhung KET QUA cua ban PHAI co dau chuan chinh ta. VD ĐÚNG: "Vì sao mèo LIẾM LÔNG?", "Điều hòa nhiệt độ". VD SAI (cam): "Vi sao meo LIEM LONG", "Dieu hoa nhiet do". ***`,
    ``,
    `QUY UOC BAT BUOC (thoi luong ${spec.duration}s):`,
    `- Tao DUNG ${spec.scenes} canh, theo cau truc: ${spec.structure}.`,
    `- Moi caption NGAN GON, khoang ${spec.wordsPerScene} tu (toi da ${spec.wordsPerScene + 4}), doc ~${spec.perSceneSec} giay. Cat het chu thua, khong dai dong.`,
    `- Tong loi doc ca video nen roi vao khoang ${Math.round(spec.duration * 0.82)}-${spec.duration} giay. THA NGAN HON con hon VUOT ${spec.duration} giay (video ngan gon, sung suc tot hon lê thê).`,
    ``,
    `QUY TAC:`,
    `- Chon dung 1 industry id tu: ${INDUSTRY_IDS.join(", ")}.`,
    `- Chon "theme" (phong cach do hoa toan video) tu 3 loai: "star" (nen den + sao lap lanh + accent cam/amber, sang trong, HOP tech/tai chinh/tin tuc/bat dong san/luat), "neon" (nen navy toi + accent xanh teal/luc neon + glow manh, cong nghe/nang dong, HOP ban hang/suc khoe), "paper" (nen sang kem + accent coral + nhieu khoang trang, sach/editorial, HOP giao duc/quote/nha khoa/am thuc/thuong hieu). Chon theme HOP NHAT voi noi dung.`,
    `- COPYWRITING (QUAN TRONG NHAT - de video HAY, giu nguoi xem tu giay dau):`,
    `  * Canh 1 = HOOK: gay TO MO / SOC / cham noi dau / hua loi ich lon. TUYET DOI khong mo bai nhat kieu "Ban co biet...". VD manh: "Lam ca thang ma cuoi thang van rong tui? Loi nam o 3 con so nay.", "Chin muoi phan tram nguoi tre dang mac sai lam nay ma khong he hay biet.".`,
    `  * Giong TRO CHUYEN, gan gui, cam xuc - nhu dang ke cho ban than nghe. Xung "ban", dong tu manh. Cau NGAN, co nhip. TRANH giong sach giao khoa / dinh nghia kho khan ("X la ...").`,
    `  * Moi canh 1 y ro rang, dan dat to mo sang canh sau (giu chan nguoi xem). Canh cuoi = CTA thuc day hanh dong (theo doi / luu lai / thu ngay).`,
    `- Moi canh co "caption" = LOI DOC (giong AI se doc) DONG THOI hien lam phu de. Vi VUA DOC VUA HIEN nen PHAI la CAU NOI THUAN VIET, doc len tu nhien:`,
    `  * SO viet bang CHU, KHONG dung chu so/ky hieu trong caption: "20%" -> "hai muoi phan tram", "3-6 thang" -> "ba den sau thang", "14 lan" -> "muoi bon lan", "36%" -> "ba muoi sau phan tram".`,
    `  * KHONG dung tu viet tat / tieng Anh trong caption (DTI, API, GitHub, ROI, KPI...). Thay bang tieng Viet ("ty le no tren thu nhap"). Neu buoc phai neu, viet cach doc tieng Viet.`,
    `  * Ky hieu (%, /, +) va chu so CHI duoc dung trong "component.data" (phan do hoa - KHONG doc len). TUYET DOI khong xuat hien trong caption.`,
    `  * Tieng Viet CO DAU day du, chinh ta chuan. Viet chu thuong, CHI IN HOA 1-2 tu khoa quan trong nhat (de karaoke to mau) - KHONG hoa ca cau. VD: "Chi can theo doi con so nay, ban da KIEM SOAT duoc tien bac moi thang."`,
    `- "title" = tieu de ngan hien giua khung, IN HOA, 2-5 tu, dung \\n xuong dong (1-2 dong). BAT BUOC MOI CANH DEU CO "title", TRU khi canh do co "component" (thi title tuy chon). Title la diem nhan thi giac chinh - khong duoc bo trong.`,
    `- "kicker" = nhan nho phia tren title (1-2 tu, vd "Su that", "Ban co biet", "Ly do 1"). MOI CANH nen co kicker.`,
    `- "motion" chon tu: ${MOTIONS.join(", ")}. Moi canh dung MOT motion KHAC NHAU (da dang cho song dong).`,
    `- Moi canh them "imageQuery" = 2-4 tu TIENG ANH mo ta anh nen hop canh (de tim anh stock), vd "cat grooming", "gold bars finance", "real estate apartment".`,
    `- Dung "component" o IT NHAT 3-4 canh (cang nhieu cang hap dan) khi co so lieu/danh sach/so sanh/cac buoc. Chon type phu hop:`,
    ...COMPONENTS.map((c) => `    * ${c.type}: ${c.fits}. data = ${c.data}`),
    `- "sec" = do dai canh (giay), uoc theo do dai caption khi doc (~2.5 tu/giay).`,
    ``,
    `CHI TRA VE JSON trong khoi \`\`\`json ... \`\`\`, dung dinh dang:`,
    `{`,
    `  "industry": "id",`,
    `  "theme": "star | neon | paper",`,
    `  "brand": "@ten.kenh",`,
    `  "title": "Tieu de video de dang",`,
    `  "description": "Mo ta ngan",`,
    `  "hashtags": ["#..", "#.."],`,
    `  "scenes": [ { "sec": number, "kicker"?: string, "title"?: string, "caption": string, "motion": string, "imageQuery": string, "component"?: { "type": string, "data": object } } ]`,
    `}`,
    `Moi canh phai co "industry" = industry o tren (tu them khi xuat). Khong giai thich gi them.`,
  ].join("\n");
}

async function callModel(systemPrompt, content, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Thieu OPENROUTER_API_KEY");
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://tikvn.io",
      "X-Title": "TikVN Auto Video",
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      // Ghim theo provider NHANH NHAT (throughput cao) + fallback neu chet ->
      // tranh con provider cham gay vot 122s. Khong ghim ten cung (provider co the die).
      provider: { sort: "throughput", allow_fallbacks: true },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter loi (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== "string" || !out.trim()) throw new Error("OpenRouter tra ve rong");
  return out.trim();
}

function parsePlan(raw, spec) {
  // Strip fence ```json ... ``` roi JSON.parse.
  let s = raw.trim();
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) s = m[1].trim();
  const plan = JSON.parse(s);
  const ind = INDUSTRY_IDS.includes(plan.industry) ? plan.industry : "tin";
  const theme = ["star", "neon", "paper"].includes(plan.theme) ? plan.theme : undefined;
  let scenes = (plan.scenes || [])
    .filter((sc) => sc && typeof sc.caption === "string")
    .map((sc) => ({
      sec: Number(sc.sec) > 0 ? Number(sc.sec) : spec.perSceneSec,
      industry: ind,
      kicker: sc.kicker || undefined,
      title: sc.title || undefined,
      caption: sc.caption,
      motion: MOTIONS.includes(sc.motion) ? sc.motion : "fade",
      imageQuery: sc.imageQuery || undefined,
      component: sc.component && sc.component.type ? sc.component : undefined,
    }));
  if (scenes.length === 0) throw new Error("Plan khong co canh hop le");
  // Ep dung so canh theo quy uoc: du thi cat, thieu thi giu (hiem).
  if (scenes.length > spec.scenes) scenes = scenes.slice(0, spec.scenes);
  return {
    industry: ind,
    theme,
    brand: plan.brand || "@kenh.cua.ban",
    title: plan.title || "Video",
    description: plan.description || "",
    hashtags: Array.isArray(plan.hashtags) ? plan.hashtags.slice(0, 8) : [],
    scenes,
  };
}

/** content = van ban da boc. durationSec chuan hoa ve 1 trong 4 moc (30/45/60/120).
 *  Tra ve { industry, brand, title, description, hashtags, scenes } dung so canh theo quy uoc. */
export async function selectPlan(content, durationSec = 60) {
  const spec = specFor(durationSec);
  const sys = buildSystemPrompt(spec);
  const text = String(content).slice(0, 8000);
  try {
    return parsePlan(await callModel(sys, text, DEFAULT_MODEL), spec);
  } catch (e) {
    // Retry 1 lan voi model fallback (JSON hong / model loi).
    return parsePlan(await callModel(sys, text, FALLBACK_MODEL), spec);
  }
}
