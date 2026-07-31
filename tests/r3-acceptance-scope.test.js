import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const documentPath = new URL("../docs/R3_ACCEPTANCE_BLOCKERS.md", import.meta.url);

test("R3 acceptance scope records owner blockers and preserved boundaries", async () => {
  const content = await readFile(documentPath, "utf8");
  for (const required of [
    "Актуальность ошибок совместимости",
    "Сквозная навигация",
    "Лицо + оборот",
    "Массовый TXT-ввод",
    "Приоритет расчёта",
    "Разная красочность лица и оборота",
    "no VERSION/release/root cutover",
  ]) {
    assert.match(content, new RegExp(required.replace(/[+]/g, "\\+")));
  }
});
