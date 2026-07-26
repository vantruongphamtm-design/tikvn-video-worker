// A3: LLM phan tich noi dung -> chon nganh/chuyen dong/thanh phan -> scene plan JSON
// + tieu de/mo ta/hashtag. Tai dung mau goi OpenRouter cua tts-optimizer/src/lib/openrouter.ts.
import { INDUSTRIES, MOTIONS, COMPONENTS, INDUSTRY_IDS, specFor } from "./catalog.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_VIDEO_MODEL || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-flash-lite";

function buildSystemPrompt(spec) {
  return [
    `Ban la dao dien video ngan tieng Viet cho TikTok/Reels (doc 9:16).`,
    `Tu NOI DUNG nguoi dung, tao SCENE PLAN cho video dai ${spec.duration} giay.`,
    ``,
    `*** BAT BUOC: MOI van ban tieng Viet ban XUAT RA (title, caption, kicker, description, hashtags, du lieu component) PHAI CO DAU THANH DAY DU (sắc/huyền/hỏi/ngã/nặng, chữ ă/â/ê/ô/ơ/ư/đ). Chinh ban thao tu nay khong dau CHI de tiet kiem, nhung KET QUA cua ban PHAI co dau chuan chinh ta. VD ĐÚNG: "Vì sao mèo LIẾM LÔNG?", "Điều hòa nhiệt độ". VD SAI (cam): "Vi sao meo LIEM LONG", "Dieu hoa nhiet do". ***`,
    ``,
    `QUY UOC BAT BUOC (thoi luong ${spec.duration}s):`,
    `- Tao DUNG ${spec.scenes} canh, theo cau truc: ${spec.structure}.`,
    `- Moi canh doc khoang ${spec.perSceneSec} giay -> caption khoang ${spec.wordsPerScene} tu.`,
    `- Tong "sec" cua ${spec.scenes} canh phai xap xi ${spec.duration} giay.`,
    ``,
    `QUY TAC:`,
    `- Chon dung 1 industry id tu: ${INDUSTRY_IDS.join(", ")}.`,
    `- Canh dau la HOOK 3 giay giat tit; canh cuoi la CTA/ket.`,
    `- Moi canh co truong "caption" = CAU DOC tu nhien (se doc bang giong AI), tieng Viet CO DAU day du. IN HOA 1-2 tu khoa quan trong trong caption (de karaoke to mau) nhung van GIU DAU (vd "LIẾM LÔNG", "SỨC KHỎE").`,
    `- "title" = tieu de ngan hien giua khung (2-4 tu, dung \\n de xuong dong). Canh co component thi co the bo title.`,
    `- "kicker" = nhan nho phia tren (tuy chon, 1-2 tu).`,
    `- "motion" chon tu: ${MOTIONS.join(", ")}. Moi canh dung MOT motion KHAC NHAU (da dang cho song dong).`,
    `- Moi canh them "imageQuery" = 2-4 tu TIENG ANH mo ta anh nen hop canh (de tim anh stock), vd "cat grooming", "gold bars finance", "real estate apartment".`,
    `- Dung "component" o IT NHAT 2-3 canh co so lieu/danh sach/so sanh (video hap dan hon), chon type phu hop:`,
    ...COMPONENTS.map((c) => `    * ${c.type}: ${c.fits}. data = ${c.data}`),
    `- "sec" = do dai canh (giay), uoc theo do dai caption khi doc (~2.5 tu/giay).`,
    ``,
    `CHI TRA VE JSON trong khoi \`\`\`json ... \`\`\`, dung dinh dang:`,
    `{`,
    `  "industry": "id",`,
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
