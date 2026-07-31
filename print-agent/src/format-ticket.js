/**
 * Phiếu bếp ngắn gọn (Epson TM-T88VI / ePOS).
 *
 * Cột giá cố định bên phải — món / topping / tổng thẳng hàng.
 * Không in QR (phiếu chỉ dùng trong bếp).
 */

const COLS = 32;
const PRICE_W = 8; // cột giá cố định (vd. "  1670円")
const NAME_W = COLS - PRICE_W;
const SHOP = "TAMON";
const DOT = "・";

const SPICE = { mild: "マイルド", medium: "ミディアム", hot: "辛口", extra_hot: "特辛" };
const FIRM = { soft: "やわらかめ", medium: "普通", firm: "硬め" };
const BEER = { lager: "ラガー", super_dry: "スーパードライ" };
const HIGHBALL = { plain: "ハイボール プレーン", lemon: "ハイボール レモン" };
const BEER_BALL = { lemon: "レモン", plum: "うめ", melon: "メロン" };

function toYen(vnd) {
  return Math.round(Number(vnd || 0) / 200);
}

function yen(vnd) {
  return `${toYen(vnd)}円`;
}

function orderCode(id) {
  return String(id ?? "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
}

function formatReceivedAt(iso) {
  try {
    // yy/m/d — còn chỗ cho「受付:」+ cột bàn
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      year: "2-digit",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = String(parseInt(get("hour"), 10) || 0);
    return `${get("year")}/${get("month")}/${get("day")} ${hour}:${get("minute")}`;
  } catch {
    return "--/--/-- --:--";
  }
}

function displayWidth(str) {
  let w = 0;
  for (const ch of String(str ?? "")) {
    const code = ch.codePointAt(0) ?? 0;
    w += code <= 0x7f || (code >= 0xff61 && code <= 0xff9f) ? 1 : 2;
  }
  return w;
}

function fit(text, max) {
  let t = String(text ?? "");
  while (displayWidth(t) > max && t.length > 1) t = t.slice(0, -1);
  return t;
}

function padRight(text, width) {
  const t = fit(text, width);
  return t + " ".repeat(Math.max(0, width - displayWidth(t)));
}

/** Pad without truncating — text must already fit `width`. */
function padRightFull(text, width) {
  const t = String(text ?? "");
  return t + " ".repeat(Math.max(0, width - displayWidth(t)));
}

function priceCell(vnd) {
  const s = yen(vnd);
  return " ".repeat(Math.max(0, PRICE_W - displayWidth(s))) + s;
}

function namePrice(name, vnd) {
  return padRight(name, NAME_W) + priceCell(vnd);
}

/**
 * Xuống dòng theo độ rộng in (full-width = 2).
 * Ưu tiên ngắt sau ・／、()） khoảng trắng.
 */
function wrapDisplayLines(text, maxWidth) {
  const src = String(text ?? "");
  if (!src) return [];
  if (maxWidth < 2) return [fit(src, Math.max(1, maxWidth))];

  const breakAfter = new Set(["・", "／", "/", "、", " ", "）", ")", "·", "ｰ", "-"]);
  const out = [];
  let line = "";

  for (const ch of src) {
    const next = line + ch;
    if (displayWidth(next) <= maxWidth) {
      line = next;
      continue;
    }

    let breakAt = -1;
    for (let i = line.length - 1; i >= Math.max(0, line.length - 12); i--) {
      if (breakAfter.has(line[i])) {
        breakAt = i + 1;
        break;
      }
    }

    if (breakAt > 0) {
      out.push(line.slice(0, breakAt));
      line = line.slice(breakAt) + ch;
    } else if (line) {
      out.push(line);
      line = ch;
    } else {
      out.push(fit(ch, maxWidth));
      line = "";
    }

    while (displayWidth(line) > maxWidth) {
      const kept = fit(line, maxWidth);
      out.push(kept);
      line = line.slice(kept.length);
    }
  }
  if (line) out.push(line);
  return out;
}

/** Dòng tên + giá; tên dài → xuống dòng, giá ở dòng đầu, cột giá giữ nguyên. */
function pushNamePriceWrapped(lines, name, vnd, { bold = false } = {}) {
  const wrapped = wrapDisplayLines(name, NAME_W);
  if (!wrapped.length) return;
  lines.push({
    text: padRightFull(wrapped[0], NAME_W) + priceCell(vnd),
    bold,
    align: "center",
  });
  for (let i = 1; i < wrapped.length; i++) {
    lines.push({
      text: padRightFull(wrapped[i], COLS),
      bold,
      align: "center",
    });
  }
}

function pushTextWrapped(lines, text, { bold = false } = {}) {
  const wrapped = wrapDisplayLines(text, COLS);
  for (const w of wrapped) {
    lines.push({
      text: padRightFull(w, COLS),
      bold,
      align: "center",
    });
  }
}

/**
 * 2 dòng cùng độ rộng COLS — # và 受付 thẳng cột khi căn giữa khổ giấy:
 *
 *   #31CF8DA9          席
 *   受付:26/7/28 1:05  カウンター2番
 *
 * mode append →「追加」cạnh #id (vd. #31CF8DA9 追加)
 */
function metaIdSeatLines(code, tableLabel, receivedAt, { append = false } = {}) {
  const seat = "席";
  const tableStr = fit(tableLabel, 18);
  const blockW = Math.max(displayWidth(seat), displayWidth(tableStr));
  const blockStart = COLS - blockW;
  const leftMax = Math.max(1, blockStart - 1);

  const idLabel = append ? `#${code} 追加` : `#${code}`;
  const id = fit(idLabel, leftMax);
  const line1 =
    id + " ".repeat(Math.max(0, blockStart - displayWidth(id))) + padRight(seat, blockW);

  const received = fit(`受付:${receivedAt}`, leftMax);
  const line2 =
    received +
    " ".repeat(Math.max(0, blockStart - displayWidth(received))) +
    padRight(tableStr, blockW);

  return [line1, line2];
}

function rule() {
  return { type: "hline", text: "─".repeat(16) };
}

function toppingSumVnd(c) {
  return (c?.extraToppings ?? []).reduce((s, t) => s + (Number(t.price) || 0), 0);
}

/** Bỏ danh sách lựa chọn trong ngoặc của tên menu catalog: 「ビアボール (レモン・うめ・メロン)」→「ビアボール」 */
function stripCatalogOptionList(name) {
  const s = String(name ?? "").trim();
  const stripped = s.replace(/\s*[\(（][^）)]+[\)）]\s*$/u, "").trim();
  return stripped || s;
}

/** Bỏ phần lựa chọn lượng mì trên tên catalog: 「つけ麺 150g・200g」→「つけ麺」 */
function stripCatalogPortionChoice(name) {
  return String(name ?? "")
    .replace(/\s*150\s*g\s*[・･·]\s*200\s*g/giu, "")
    .replace(/\s*500\s*g\s*以上/giu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatPortionSuffix(grams) {
  if (!grams) return null;
  if (grams === "500+") return "500g以上";
  return `${grams}g`;
}

/**
 * Tên in bếp = đúng món khách chọn (không in tên catalog dài + dòng・lựa chọn bên dưới).
 * vd. ハイボール レモン / つけ麺 150g / ビアボール うめ
 */
function resolvePrintItemName(item) {
  const c = item?.customization;
  if (c?.highballVariant && HIGHBALL[c.highballVariant]) {
    return HIGHBALL[c.highballVariant];
  }
  if (c?.beerBallVariant && BEER_BALL[c.beerBallVariant]) {
    return `ビアボール ${BEER_BALL[c.beerBallVariant]}`;
  }
  if (c?.beerVariant && BEER[c.beerVariant]) {
    return `瓶ビール ${BEER[c.beerVariant]}`;
  }

  let base = stripCatalogOptionList(item?.menu_item_name || item?.menu_item_id || "メニュー");
  base = stripCatalogPortionChoice(base);

  const portion = formatPortionSuffix(c?.noodlePortionGrams);
  if (portion) {
    // Tránh「つけ麺 300g 150g」nếu tên đã sẵn gram cố định trùng — vẫn ưu tiên lựa chọn khách
    base = base.replace(/\s*\d{3,4}\s*g\s*$/iu, "").trim();
    return `${base} ${portion}`;
  }
  return base;
}

const NOODLE_TEMP = new Set(["冷たい麺", "温かい麺"]);

function splitDetails(c, { omitDrinkVariant = false, omitPortion = false } = {}) {
  /** @type {{ label: string, priceVnd: number, flat?: boolean }[]} */
  const toppings = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {string | null} */
  let noodleTemp = null;

  if (!c || typeof c !== "object") return { toppings, notes, noodleTemp };

  // Gyoza takeaway: phí theo dòng (không × số lượng) — in cột giá như topping
  const CONTAINER_FEE_VND = 20 * 200;
  const BAG_FEE_VND = 3 * 200;
  if (c.serviceMode === "takeaway") {
    toppings.push({
      label: "お持ち帰り・容器",
      priceVnd: CONTAINER_FEE_VND,
      flat: true,
    });
    if (c.needsPlasticBag === true) {
      toppings.push({ label: "レジ袋", priceVnd: BAG_FEE_VND, flat: true });
    }
  } else if (c.serviceMode === "dine_in") {
    notes.push("店内");
  }

  // 麺量 đã gộp vào tên món — không in dòng「・麺量150g」
  if (!omitPortion && c.noodlePortionGrams) {
    notes.push(
      c.noodlePortionGrams === "500+" ? "麺量500g+" : `麺量${c.noodlePortionGrams}g`
    );
  }
  if (c.noodleFirmness && FIRM[c.noodleFirmness]) notes.push(`麺${FIRM[c.noodleFirmness]}`);
  if (c.spiceLevel && c.spiceLevel !== "none" && SPICE[c.spiceLevel]) {
    notes.push(SPICE[c.spiceLevel]);
  }
  // Variant đồ uống đã gộp vào tên món chính — không lặp ở dòng・
  if (!omitDrinkVariant) {
    if (c.beerVariant && BEER[c.beerVariant]) notes.push(BEER[c.beerVariant]);
    if (c.highballVariant && HIGHBALL[c.highballVariant]) {
      notes.push(HIGHBALL[c.highballVariant]);
    }
    if (c.beerBallVariant && BEER_BALL[c.beerBallVariant]) {
      notes.push(`ビアボール ${BEER_BALL[c.beerBallVariant]}`);
    }
  }

  for (const t of c.extraToppings ?? []) {
    const name = t?.name?.trim();
    if (!name) continue;
    const p = Number(t.price);
    if (Number.isFinite(p) && p > 0) toppings.push({ label: name, priceVnd: p });
    else notes.push(name);
  }

  if (c.note?.trim()) {
    for (const part of c.note.split(/[｜|、]/).map((s) => s.trim()).filter(Boolean)) {
      // 冷/温 — tách riêng, in đậm ngay dưới tên món
      if (NOODLE_TEMP.has(part)) {
        noodleTemp = part;
        continue;
      }
      notes.push(part);
    }
  }
  if (c.seatLabel?.trim()) notes.push(`席${c.seatLabel.trim()}`);

  return { toppings, notes, noodleTemp };
}

function orderTotal(order, items) {
  if (order.total_amount != null) return Number(order.total_amount);
  return items.reduce(
    (sum, it) => sum + Number(it.unit_price || 0) * (Number(it.quantity) || 1),
    0
  );
}

/** @param {any[]} items @param {number} startIndex 0-based */
function pushItemBlock(lines, items, startIndex = 0) {
  const detailPad = "  ";
  items.forEach((item, i) => {
    const c = item.customization;
    const name = resolvePrintItemName(item);
    const qty = Number(item.quantity) || 1;
    const unit = Number(item.unit_price || 0);
    const extras = toppingSumVnd(c);
    const baseUnit = Math.max(0, unit - extras);
    const omitDrinkVariant = Boolean(
      c?.beerVariant || c?.highballVariant || c?.beerBallVariant
    );
    const omitPortion = Boolean(c?.noodlePortionGrams);
    const { toppings, notes, noodleTemp } = splitDetails(c, {
      omitDrinkVariant,
      omitPortion,
    });
    const n = startIndex + i + 1;

    pushNamePriceWrapped(lines, `${n}.${name} x${qty}`, baseUnit * qty, {
      bold: true,
    });

    // 冷たい麺 / 温かい麺 — ngay dưới tên món, đậm, trước topping
    if (noodleTemp) {
      lines.push({
        text: padRightFull(`${detailPad}${DOT}${noodleTemp}`, COLS),
        bold: true,
        align: "center",
      });
    }

    for (const t of toppings) {
      const printVnd = t.flat ? t.priceVnd : t.priceVnd * qty;
      pushNamePriceWrapped(
        lines,
        `${detailPad}${DOT}${t.label}`,
        printVnd
      );
    }
    for (const note of notes) {
      pushTextWrapped(lines, `${detailPad}${DOT}${note}`);
    }
  });
}

/**
 * @param {object} order
 * @param {{
 *   mode?: 'new' | 'append',
 *   items?: any[],
 *   previousItems?: any[],
 *   ticketNo?: string,
 *   ticketSeq?: number,
 * }} [opts]
 */
export function formatKitchenTicket(order, opts = {}) {
  const mode = opts.mode ?? "new";
  const allOrderItems = Array.isArray(order.items) ? order.items : [];
  const appended = Array.isArray(opts.items) ? opts.items : null;
  const previousItems = Array.isArray(opts.previousItems)
    ? opts.previousItems
    : mode === "append" && appended
      ? allOrderItems.slice(0, Math.max(0, allOrderItems.length - appended.length))
      : [];
  const newItems =
    mode === "append"
      ? appended ?? allOrderItems.slice(previousItems.length)
      : appended ?? allOrderItems;

  const table = String(order.table_label || order.table_id || "—");
  const code = orderCode(order.id);
  const when = order.created_at || order.updated_at;
  const ticketNo = (
    opts.ticketNo ||
    (opts.ticketSeq != null ? `NO.${String(opts.ticketSeq).padStart(3, "0")}` : null)
  )?.toUpperCase?.() ?? null;

  /** @type {Array<string | Record<string, unknown>>} */
  const lines = [];

  lines.push({
    text: "KITCHEN ORDER TICKET",
    align: "center",
    bold: true,
  });
  lines.push({ text: SHOP, align: "center", bold: true });

  if (ticketNo) {
    lines.push({
      text: ticketNo,
      align: "center",
      bold: true,
    });
  }

  lines.push({ type: "linespace", dots: 26 });
  const [meta1, meta2] = metaIdSeatLines(code, table, formatReceivedAt(when), {
    append: mode === "append",
  });
  lines.push({ text: meta1, bold: true, align: "center" });
  lines.push({ text: meta2, bold: true, align: "center" });
  lines.push({ type: "linespace", dots: "default" });
  lines.push(rule());

  if (mode === "append") {
    // Món đã gọi trước — để cộng 合計 đúng
    if (previousItems.length) {
      lines.push({
        text: padRight("【ご注文済】", COLS),
        align: "center",
        bold: true,
      });
      pushItemBlock(lines, previousItems, 0);
      lines.push(rule());
    }
    lines.push({
      text: padRight("【追加】", COLS),
      align: "center",
      bold: true,
    });
    if (!newItems.length) {
      lines.push({ text: "(なし)", align: "center" });
    } else {
      pushItemBlock(lines, newItems, previousItems.length);
    }
  } else if (!newItems.length) {
    lines.push({ text: "(なし)", align: "center" });
  } else {
    pushItemBlock(lines, newItems, 0);
  }

  lines.push(rule());
  // Tổng cả đơn (món cũ + thêm) — không chỉ phần追加
  const totalItems =
    mode === "append" ? [...previousItems, ...newItems] : newItems;
  lines.push({
    text: namePrice("合計", orderTotal(order, totalItems)),
    bold: true,
    align: "center",
  });

  return lines;
}
