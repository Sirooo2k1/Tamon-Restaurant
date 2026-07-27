/**
 * Epson ePOS-Print (HTTP) — TM-T88VI.
 * Mỗi dòng text luôn reset width/height/font (máy in giữ state dòng trước).
 */

function escapeXml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textEl({
  text,
  align = "left",
  bold = false,
  reverse = false,
  underline = false,
  font = "font_a",
  width = 1,
  height = 1,
}) {
  const w = Math.min(Math.max(Number(width) || 1, 1), 8);
  const h = Math.min(Math.max(Number(height) || 1, 1), 8);
  const f = font === "font_b" ? "font_b" : "font_a";
  const a = align === "center" || align === "right" ? align : "left";

  return (
    `<text lang="ja" align="${a}" font="${f}" width="${w}" height="${h}"` +
    ` em="${bold ? "true" : "false"}"` +
    ` ul="${underline ? "true" : "false"}"` +
    ` reverse="${reverse ? "true" : "false"}">` +
    `${escapeXml(text)}&#10;</text>`
  );
}

/**
 * @param {Array<string | Record<string, unknown>>} lines
 */
export function buildEposSoap(lines) {
  const parts = [];

  // Thu hẹp khoảng trống MÉP TRÊN (trước KITCHEN ORDER TICKET):
  // sau khi cắt, đầu in cách mép ~1cm — kéo giấy ngược vài dòng rồi mới in.
  // ESC e n (1B 65 n) = reverse feed n lines.
  parts.push("<command>1b6503</command>");

  for (const line of lines) {
    if (line == null) continue;

    if (typeof line === "object" && line.type === "hline") {
      const rule =
        typeof line.text === "string" && line.text
          ? line.text
          : "─".repeat(16);
      parts.push(textEl({ text: rule, align: "center" }));
      continue;
    }

    if (typeof line === "object" && line.type === "feed") {
      const n = Math.min(Math.max(Number(line.n) || 1, 1), 10);
      parts.push(`<feed line="${n}"/>`);
      continue;
    }

    // ESC 3 n / ESC 2 — chỉnh khoảng cách dòng (dots)
    if (typeof line === "object" && line.type === "linespace") {
      if (line.dots == null || line.dots === "default") {
        parts.push("<command>1b32</command>"); // ESC 2
      } else {
        const n = Math.min(Math.max(Number(line.dots) || 30, 1), 255);
        const hex = n.toString(16).padStart(2, "0");
        parts.push(`<command>1b33${hex}</command>`); // ESC 3 n
      }
      continue;
    }

    if (typeof line === "string") {
      parts.push(textEl({ text: line }));
      continue;
    }

    parts.push(
      textEl({
        text: String(line.text ?? ""),
        align: line.align,
        bold: Boolean(line.bold),
        reverse: Boolean(line.reverse),
        underline: Boolean(line.underline),
        font: line.font,
        width: line.double ? 2 : line.width,
        height: line.double ? 2 : line.height,
      })
    );
  }

  // Lề dưới (sau 合計) giữ như cũ — khoảng đẹp bạn muốn tham chiếu
  parts.push('<feed line="1"/>');
  parts.push('<cut type="feed"/>');

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
${parts.map((p) => `      ${p}`).join("\n")}
    </epos-print>
  </s:Body>
</s:Envelope>`;
}

export async function sendEposPrint(host, soapXml, timeoutMs = 15000) {
  const url = `http://${host}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=${timeoutMs}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: '""',
    },
    body: soapXml,
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ePOS HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!/success="true"/.test(body)) {
    const code = body.match(/code="([^"]*)"/)?.[1] || "unknown";
    throw new Error(`ePOS print failed code=${code}: ${body.slice(0, 300)}`);
  }
  return body;
}
