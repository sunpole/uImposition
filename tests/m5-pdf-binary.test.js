import test from "node:test";
import assert from "node:assert/strict";
import { createPdfFromJpegPages, mmToPdfPoints } from "../src/pdf-binary.js";

const onePixelJpeg = Uint8Array.from(Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////"
  + "2wBDAf//////////////////////////////////////////////////////////////////////////////////////"
  + "wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF/"
  + "/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAA"
  + "AAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAg"
  + "BAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQ"
  + "IBAT8Q/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
  "base64",
));

function page(widthMm = 210, heightMm = 297) {
  return {
    jpegBytes: onePixelJpeg,
    pixelWidth: 1,
    pixelHeight: 1,
    widthMm,
    heightMm,
  };
}

test("millimetres convert to PDF points", () => {
  assert.equal(Number(mmToPdfPoints(25.4).toFixed(6)), 72);
  assert.equal(Number(mmToPdfPoints(210).toFixed(4)), 595.2756);
});

test("two JPEG pages create a complete two-page PDF", () => {
  const bytes = createPdfFromJpegPages([page(), page(297, 210)]);
  const text = Buffer.from(bytes).toString("latin1");

  assert.equal(text.startsWith("%PDF-1.4"), true);
  assert.equal(text.endsWith("%%EOF\n"), true);
  assert.match(text, /\/Type \/Pages \/Count 2/);
  assert.equal((text.match(/\/Type \/Page /g) ?? []).length, 2);
  assert.equal((text.match(/\/Subtype \/Image/g) ?? []).length, 2);
  assert.match(text, /\/Filter \/DCTDecode/);
  assert.match(text, /xref\n0 9\n/);
  assert.match(text, /trailer\n<< \/Size 9 \/Root 1 0 R >>/);
  assert.match(text, /startxref\n\d+\n%%EOF/);
});

test("PDF writer rejects missing pages and malformed JPEG data", () => {
  assert.throws(() => createPdfFromJpegPages([]), /non-empty array/);
  assert.throws(
    () => createPdfFromJpegPages([{ ...page(), jpegBytes: new Uint8Array([1, 2, 3, 4]) }]),
    /JPEG start\/end markers/,
  );
  assert.throws(
    () => createPdfFromJpegPages([{ ...page(), widthMm: 0 }]),
    /positive number/,
  );
});
