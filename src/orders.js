function parsePositiveInteger(value, label, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0 || number > max) {
    throw new RangeError(`${label} must be a positive integer not greater than ${max}`);
  }
  return number;
}

export function splitOrderLine(line) {
  return line
    .split(/\s*(?:\||;|\t)\s*/)
    .map((part) => part.trim())
    .filter((part, index, items) => part !== "" || index < items.length - 1);
}

export function buildPagePairs(order) {
  const pairs = [];
  for (let pairIndex = 0; pairIndex < Math.ceil(order.pages / 2); pairIndex += 1) {
    const frontPage = pairIndex * 2 + 1;
    const backPage = frontPage + 1 <= order.pages ? frontPage + 1 : null;
    pairs.push({
      file: order.file,
      quantity: order.quantity,
      pairIndex: pairIndex + 1,
      frontPage,
      backPage,
      note: order.note ?? "",
    });
  }
  return pairs;
}

export function expandPagePairs(orders) {
  return orders.flatMap(buildPagePairs);
}

export function parseOrders(text, limits) {
  const rows = String(text ?? "").split(/\r?\n/);
  const orders = [];
  const errors = [];

  rows.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    const parts = splitOrderLine(line);
    if (parts.length < 3) {
      errors.push({ line: index + 1, message: "Expected: file | quantity | pages", source: rawLine });
      return;
    }

    const [file, quantityValue, pagesValue, note = ""] = parts;
    if (!file) {
      errors.push({ line: index + 1, message: "File identifier is required", source: rawLine });
      return;
    }

    try {
      const quantity = parsePositiveInteger(quantityValue, "quantity", limits.maxQuantity);
      const pages = parsePositiveInteger(pagesValue, "pages", limits.maxPagesPerFile);
      orders.push({ file, quantity, pages, printPairs: Math.ceil(pages / 2), note });
    } catch (error) {
      errors.push({ line: index + 1, message: error.message, source: rawLine });
    }
  });

  if (orders.length > limits.maxOrders) {
    errors.push({ line: 0, message: `Order count exceeds the configured limit of ${limits.maxOrders}`, source: "" });
  }

  return {
    orders,
    errors,
    pagePairs: expandPagePairs(orders),
    summary: {
      orderCount: orders.length,
      printPairCount: orders.reduce((sum, order) => sum + order.printPairs, 0),
      totalQuantity: orders.reduce((sum, order) => sum + order.quantity, 0),
    },
  };
}

export function ordersToText(orders) {
  return orders
    .map((order) => `${order.file} | ${order.quantity} | ${order.pages}${order.note ? ` | ${order.note}` : ""}`)
    .join("\n");
}
