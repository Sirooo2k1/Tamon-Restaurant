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

function priceCell(vnd) {
  const s = yen(vnd);
  return " ".repeat(Math.max(0, PRICE_W - displayWidth(s))) + s;
}

function namePrice(name, vnd) {
  return padRight(name, NAME_W) + priceCell(vnd);
}

function nameOnly(name) {
  return padRight(name, NAME_W);
}

function leftRight(left, right, cols = COLS) {
  const r = String(right ?? "");
  const l = fit(left, Math.max(1, cols - displayWidth(r) - 1));
  return `${l}${" ".repeat(Math.max(1, cols - displayWidth(l) - displayWidth(r)))}${r}`;
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

function splitDetails(c) {
  /** @type {{ label: string, priceVnd: number }[]} */
  const toppings = [];
  /** @type {string[]} */
  const notes = [];

  if (!c || typeof c !== "object") return { toppings, notes };

  if (c.serviceMode === "takeaway") notes.push("お持ち帰り");
  else if (c.serviceMode === "dine_in") notes.push("店内");

  if (c.noodlePortionGrams) {
    notes.push(
      c.noodlePortionGrams === "500+" ? "麺量500g+" : `麺量${c.noodlePortionGrams}g`
    );
  }
  if (c.noodleFirmness && FIRM[c.noodleFirmness]) notes.push(`麺${FIRM[c.noodleFirmness]}`);
  if (c.spiceLevel && c.spiceLevel !== "none" && SPICE[c.spiceLevel]) {
    notes.push(SPICE[c.spiceLevel]);
  }
  if (c.beerVariant && BEER[c.beerVariant]) notes.push(BEER[c.beerVariant]);
  if (c.highballVariant && HIGHBALL[c.highballVariant]) {
    notes.push(HIGHBALL[c.highballVariant]);
  }
  if (c.beerBallVariant && BEER_BALL[c.beerBallVariant]) {
    notes.push(`ビアボール ${BEER_BALL[c.beerBallVariant]}`);
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
      notes.push(part);
    }
  }
  if (c.seatLabel?.trim()) notes.push(`席${c.seatLabel.trim()}`);

  return { toppings, notes };
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
    const name = item.menu_item_name || item.menu_item_id || "メニュー";
    const qty = Number(item.quantity) || 1;
    const unit = Number(item.unit_price || 0);
    const extras = toppingSumVnd(item.customization);
    const baseUnit = Math.max(0, unit - extras);
    const { toppings, notes } = splitDetails(item.customization);
    const n = startIndex + i + 1;

    lines.push({
      text: namePrice(`${n}.${name} x${qty}`, baseUnit * qty),
      bold: true,
      align: "center",
    });

    for (const t of toppings) {
      lines.push({
        text: namePrice(`${detailPad}${DOT}${t.label}`, t.priceVnd * qty),
        align: "center",
      });
    }
    for (const note of notes) {
      lines.push({
        text: padRight(`${detailPad}${DOT}${note}`, COLS),
        align: "center",
      });
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
