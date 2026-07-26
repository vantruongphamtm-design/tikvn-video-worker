# AutoVideo - engine render worker (Phase A)

Composition Remotion nhan "scene plan" (JSON) lam props -> render MP4 9:16. Day la loi cua worker RunPod. LLM se sinh ra scene plan nay tu noi dung nguoi dung.

## Da xong
- `src/auto/catalog.ts` - catalog gan nhan: 10 nganh (theme), 11 format, 54 chuyen dong, 100 thanh phan. LLM chon tu day.
- `src/auto/AutoVideo.tsx` - composition props-driven: theme theo nganh, phu de karaoke tu khoa (chu IN HOA to accent), backbone motions (fade/rise/drop/slideL/slideR/zoomin/zoomout/pop/skewin), 4 thanh phan (bigNumber, bars, list, kpi). Do dai tu tinh theo tong `sec` cac canh.
- Fix webpack: `remotion.config.ts` ep `hashFunction: "sha256"` vi Node 24 lam vo wasm-hash.

## Lenh test (chay trong thu muc remotion-video)

Render tu scene plan mau:
```bash
npx remotion render AutoVideo out/test.mp4 --props=plan.sample.json
```

Mo Remotion Studio de sua props truc tiep, xem realtime:
```bash
npm run dev
```
Chon composition "AutoVideo" o cot trai, sua props o panel phai.

Render nhanh 1 phan (VD 3 giay dau) de thu:
```bash
npx remotion render AutoVideo out/quick.mp4 --props=plan.sample.json --frames=0-90
```

## Scene plan (JSON) - kieu du lieu
```jsonc
{
  "brand": "@kenh.cua.ban",
  "scenes": [
    {
      "sec": 3,                    // do dai canh (giay); ban that lay tu do dai audio TTS
      "industry": "bds",          // id nganh: bds|tc|luat|gd|ecom|tin|quote|sk|nha|fnb (quyet dinh mau/font)
      "kicker": "Co hoi",         // nhan nho tren tieu de (tuy chon)
      "title": "CAN HO\nVEN SONG",// tieu de lon giua khung (\n xuong dong)
      "caption": "... TU KHOA ...", // phu de karaoke; tu VIET HOA se to mau accent
      "motion": "pop",            // id chuyen dong tieu de
      "component": { "type": "bars", "data": { "items": [...] } } // chen thanh phan thay tieu de (tuy chon)
    }
  ]
}
```
Thanh phan (`component.type`) da co: `bigNumber {value,label}`, `bars {items:[{label,val,color}]}`, `list {items:[...],type:"num"|"check"}`, `kpi {cells:[{v,l,color}]}`.

## Prompt cho LLM (ban thao - Phase A3 se code)
LLM nhan noi dung nguoi dung + catalog, xuat ra scene plan JSON khop kieu tren.

System prompt (rut gon):
```
Ban la dao dien video ngan tieng Viet. Tu NOI DUNG nguoi dung, tao SCENE PLAN cho video doc {DURATION}s.
Quy tac:
- Chon 1 nganh (industry id) hop nhat tu danh sach.
- Chia noi dung thanh 4-8 canh. Canh dau la HOOK 3 giay giat tit.
- Moi canh: viet `caption` la CAU DOC (van noi tu nhien, se doc bang giong TTS), IN HOA 1-2 tu khoa quan trong.
- Chon `motion` phu hop tu danh sach chuyen dong.
- Neu canh co so lieu/danh sach/so sanh -> them `component` phu hop va dien data.
- Tong `sec` cac canh xap xi {DURATION}.
Chi tra ve JSON dung schema, khong giai thich.

CATALOG:
industries: [{id,name,who}...]   // tu catalogForLLM()
formats: [{id,tag,fits}...]
motions: [{id,name,group}...]
components: [{name,category}...]

Cuoi cung tra ve them: title, description, hashtags cho video.
```

## Con lai (Phase A3, A4)
- A3: `selectPlan.mjs` - goi OpenRouter (tai dung mau `src/lib/openrouter.ts` cua tts-optimizer) voi prompt tren -> scene plan.
- A4: handler RunPod (Node) - input job -> (boc noi dung tu link) -> LLM scene plan -> TTS giong Viet (endpoint h2t1xhru34n54n) -> gan `sec` theo do dai audio -> renderMedia(AutoVideo, plan) -> upload R2. Dockerfile base node (KHONG nvidia/cuda), them Chromium + ffmpeg, RunPod Serverless CPU.
- Mo rong dan: port them motions + components tu mau-video toi du 54 + 100.
