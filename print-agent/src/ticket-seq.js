/**
 * Số thứ tự phiếu in theo ngày (Asia/Tokyo).
 * Lưu local để agent restart vẫn tiếp tục; sang ngày mới reset về 1.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const SEQ_FILE = path.join(DATA_DIR, "ticket-seq.json");

function tokyoDayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function readState() {
  try {
    const raw = fs.readFileSync(SEQ_FILE, "utf8");
    const j = JSON.parse(raw);
    if (j && typeof j.day === "string" && Number.isFinite(Number(j.seq))) {
      return { day: j.day, seq: Math.max(0, Math.floor(Number(j.seq))) };
    }
  } catch {
    /* empty / corrupt → start fresh */
  }
  return { day: tokyoDayKey(), seq: 0 };
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SEQ_FILE, JSON.stringify(state, null, 2), "utf8");
}

/** Lấy số tiếp theo cho mỗi lần in phiếu (new / 追加 đều tăng). */
export function nextTicketSeq() {
  const today = tokyoDayKey();
  const state = readState();
  const seq = state.day === today ? state.seq + 1 : 1;
  writeState({ day: today, seq });
  return seq;
}

export function formatTicketNo(seq) {
  const n = Math.max(1, Math.floor(Number(seq) || 1));
  return `NO.${String(n).padStart(3, "0")}`;
}
