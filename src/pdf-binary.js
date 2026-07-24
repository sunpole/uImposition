const encoder = new TextEncoder();

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return number;
}

function requireJpeg(bytes, label) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) {
    throw new TypeError(`${label} must be a JPEG Uint8Array`);
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    throw new RangeError(`${label} does not contain JPEG start/end markers`);
  }
  return bytes;
}

function concatChunks(chunks, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function formatPoint(value) {
  return Number(value.toFixed(4)).toString();
}

export function mmToPdfPoints(mm) {
  return positiveNumber(mm, "mm") * 72 / 25.4;
}

export function createPdfFromJpegPages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new TypeError("pages must be a non-empty array");
  }

  const normalizedPages = pages.map((page, index) => ({
    jpegBytes: requireJpeg(page?.jpegBytes, `pages[${index}].jpegBytes`),
    pixelWidth: positiveInteger(page?.pixelWidth, `pages[${index}].pixelWidth`),
    pixelHeight: positiveInteger(page?.pixelHeight, `pages[${index}].pixelHeight`),
    widthPt: mmToPdfPoints(page?.widthMm),
    heightPt: mmToPdfPoints(page?.heightMm),
  }));

  const chunks = [];
  const offsets = [];
  let length = 0;

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushText = (text) => pushBytes(encoder.encode(text));
  const startObject = (objectNumber) => {
    offsets[objectNumber] = length;
    pushText(`${objectNumber} 0 obj\n`);
  };
  const endObject = () => pushText("endobj\n");

  pushText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  startObject(1);
  pushText("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObject();

  const pageObjectNumbers = normalizedPages.map((_, index) => 3 + index * 3);
  startObject(2);
  pushText(`<< /Type /Pages /Count ${normalizedPages.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] >>\n`);
  endObject();

  normalizedPages.forEach((page, index) => {
    const pageObject = pageObjectNumbers[index];
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const imageName = `Im${index + 1}`;
    const widthPt = formatPoint(page.widthPt);
    const heightPt = formatPoint(page.heightPt);
    const content = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/${imageName} Do\nQ\n`;
    const contentBytes = encoder.encode(content);

    startObject(pageObject);
    pushText(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] `
      + `/Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> `
      + `/Contents ${contentObject} 0 R >>\n`,
    );
    endObject();

    startObject(contentObject);
    pushText(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushText("endstream\n");
    endObject();

    startObject(imageObject);
    pushText(
      `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} `
      + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`,
    );
    pushBytes(page.jpegBytes);
    pushText("\nendstream\n");
    endObject();
  });

  const objectCount = 2 + normalizedPages.length * 3;
  const xrefOffset = length;
  pushText(`xref\n0 ${objectCount + 1}\n`);
  pushText("0000000000 65535 f \n");
  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber += 1) {
    const offset = offsets[objectNumber];
    if (!Number.isInteger(offset)) throw new Error(`Missing PDF object ${objectNumber}`);
    pushText(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return concatChunks(chunks, length);
}
