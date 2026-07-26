// Tao video test 60s tu bai viet geniiraw (vi sao meo tu liem long).
// Vi moi truong KHONG co OPENROUTER_API_KEY nen plan viet tay theo dung schema + quy uoc 60s (6 canh).
// Chay dung pipeline downstream that: TTS (mock) -> sec moi canh -> chuan hoa 60s -> render.
import { mkdtemp, copyFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { synthAll } from "./tts.mjs";
import { renderVideo } from "./render.mjs";
import { snapDuration } from "./catalog.mjs";
import { stockForScenes } from "./images.mjs";

const IND = "gd"; // kien thuc / giao duc (tone teal)
const plan = {
  brand: "@genii.petfood",
  title: "Tai sao meo thuong xuyen tu liem long?",
  description: "Giai ma nhung ly do khien meo danh ca ngay de chai chuot.",
  hashtags: ["#meo", "#thucung", "#genii", "#chaichuot", "#petfood"],
  scenes: [
    { industry: IND, motion: "pop", kicker: "Sự thật thú vị", title: "VÌ SAO MÈO\nLIẾM LÔNG?",
      caption: "Vì sao con MÈO của bạn lại dành gần như cả ngày chỉ để liếm và chải chuốt bộ lông của mình?" },
    { industry: IND, motion: "slideT", kicker: "Bản năng", title: "Học từ\nmèo mẹ",
      caption: "Ngay từ khi mới vài tuần tuổi, mèo con đã học cách chải chuốt bằng cách BẮT CHƯỚC chính mèo mẹ của nó." },
    { industry: IND, motion: "flip3d", kicker: "Khứu giác",
      caption: "Bạn có biết, khứu giác của loài mèo nhạy bén hơn con người tới tận MƯỜI BỐN lần, một con số đáng kinh ngạc.",
      component: { type: "bigNumber", data: { value: "14 lần", label: "khứu giác mèo nhạy hơn con người" } } },
    { industry: IND, motion: "glideL", kicker: "Sinh tồn", title: "Ẩn mùi\nđể sống sót",
      caption: "Việc liếm lông giúp mèo ẨN đi mùi cơ thể, nhờ vậy chúng tránh bị các loài săn mồi phát hiện ngoài tự nhiên." },
    { industry: IND, motion: "bounce", kicker: "Trong tự nhiên",
      caption: "Trong tự nhiên, mèo vừa đóng vai KẺ SĂN MỒI rình rập con mồi, vừa là con mồi của những loài thú lớn hơn.",
      component: { type: "compare", data: { a: { name: "Kẻ săn mồi", items: ["Rình con mồi", "Cần giấu mùi"] }, b: { name: "Con mồi", items: ["Bị thú lớn săn", "Phải ẩn mình"] } } } },
    { industry: IND, motion: "spinin", kicker: "Vệ sinh", title: "Làm sạch\ncơ thể",
      caption: "Chải chuốt mỗi ngày còn giúp mèo LÀM SẠCH bộ lông, loại bỏ bụi bẩn, ký sinh trùng và những sợi lông rụng." },
    { industry: IND, motion: "riseblur", kicker: "Thân nhiệt", title: "Điều hòa\nnhiệt độ",
      caption: "Khi trời nóng, nước bọt bốc hơi lúc mèo liếm lông sẽ giúp cơ thể chúng GIẢM NHIỆT và mát mẻ hơn." },
    { industry: IND, motion: "wobble", kicker: "Tóm tắt",
      caption: "Tóm lại, thói quen liếm lông của loài mèo bắt nguồn từ BA nhóm lý do chính mà bạn nên biết sau đây.",
      component: { type: "statPanel", data: { rows: [{ label: "Bản năng", value: "Học từ mèo mẹ", big: "1" }, { label: "Sinh tồn", value: "Ẩn mùi, tránh săn mồi", big: "2" }, { label: "Vệ sinh", value: "Sạch và mát cơ thể", big: "3" }] } } },
    { industry: IND, motion: "zoomblur", kicker: "Thư giãn", title: "Giảm\ncăng thẳng",
      caption: "Không chỉ vậy, việc tự liếm lông còn giúp mèo THƯ GIÃN, xoa dịu cảm giác căng thẳng và lo lắng mỗi ngày." },
    { industry: IND, motion: "punch", kicker: "Đừng bỏ lỡ",
      caption: "Nếu bạn yêu loài mèo, hãy THEO DÕI Genii để hiểu và chăm sóc bé cưng của mình tốt hơn mỗi ngày nhé!",
      component: { type: "tags", data: { tags: ["#mèo", "#thúcưng", "#genii", "#chảichuốt", "#petfood"] } } },
  ],
};

// Anh stock Pexels (mo phong lua chon "lay anh Pexels"). Moi canh 1 tu khoa tieng Anh.
const QUERIES = [
  "cat licking fur closeup", "mother cat kitten grooming", "cat nose closeup macro",
  "cat hiding in grass", "cat stalking hunting prey", "cat cleaning washing fur",
  "cat resting summer heat", "cute cat sitting portrait", "cat sleeping relaxed calm",
  "happy cat with owner",
];
plan.scenes.forEach((s, i) => (s.imageQuery = QUERIES[i]));
console.log("Lấy ảnh Pexels...");
await stockForScenes(plan.scenes, "cat");
console.log("Ảnh gán:", plan.scenes.filter((s) => s.image).length + "/" + plan.scenes.length);

plan.scenes.forEach((s) => (s.narration = s.caption));

const workDir = await mkdtemp(path.join(os.tmpdir(), "tikvn-meo-"));
console.log("TTS cho", plan.scenes.length, "cảnh...");
const { audioFile, scenes } = await synthAll(plan.scenes, null, workDir, snapDuration(60));
console.log("sec mỗi cảnh:", scenes.map((s) => Math.round(s.sec * 10) / 10), "-> tổng:", Math.round(scenes.reduce((a, s) => a + s.sec, 0)));

console.log("Render 60s...");
const mp4 = await renderVideo({ scenes, brand: plan.brand }, audioFile, "meo-tu-liem-60s");

const dest = path.join("C:\\Users\\DELL\\Desktop\\file test", "meo-tu-liem-60s.mp4");
await mkdir(path.dirname(dest), { recursive: true });
await copyFile(mp4, dest);
console.log("DONE:", dest);
