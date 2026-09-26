/* Workshop 04 number binding. Every figure on the deck is an element with data-num="<key>" (a key
   in numbers of w04-data.json) or data-j="<path>" (any other JSON value). This file resolves them
   from window.W04_DATA (lib/w04-data.js, generated from the dataset; no fetch) and writes the text,
   so a slide can never show a number the dataset does not hold. scripts/workshop04/build-deck.mjs
   runs the same resolver at build time, so the HTML already carries the right text without JS.

   data-num forms (data-form):
     (none)   the English display string, for example "1,444.0 t"
     bare     without the unit: "1,444.0"
     abs      without the sign and unit: "495.5"
     absunit  without the sign: "495.5 t"
     de       the German display string
   data-j paths are dot-separated; an array segment is an index or an id matched against row_id,
   id, step, n or the file name of path without its extension. data-form="cell:N" picks cell N of
   a Markdown table line, data-form="md" drops a leading "# ", and int / fix1 / fix2 / pct format a
   plain number. */
(function (root) {
  "use strict";

  const UNIT = /\s+(t\/Mio\. EUR|kWh|MWh|t|l)$/;
  const SIGN = /^[+−-]/;

  function numberText(data, key, form) {
    const entry = data?.numbers?.[key];
    if (!entry) return null;
    const en = String(entry.en);
    switch (form || "") {
      case "": return en;
      case "de": return String(entry.de);
      case "bare": return en.replace(UNIT, "");
      case "abs": return en.replace(UNIT, "").replace(SIGN, "");
      case "absunit": return en.replace(SIGN, "");
      default: return null;
    }
  }

  function pick(list, segment) {
    if (/^\d+$/.test(segment)) return list[Number(segment)];
    return list.find((item) => item && typeof item === "object" && (
      item.row_id === segment || item.id === segment || item.step === segment || String(item.n) === segment
      || (typeof item.path === "string" && item.path.split("/").pop().replace(/\.[a-z]+$/, "") === segment)));
  }

  function resolvePath(data, path) {
    let value = data;
    for (const segment of String(path).split(".")) {
      if (value == null) return null;
      if (Array.isArray(value)) value = pick(value, segment);
      else if (typeof value === "object") value = value[segment];
      else return null;
    }
    return value;
  }

  function pathText(data, path, form) {
    const value = resolvePath(data, path);
    if (value == null || typeof value === "object") return null;
    let text = String(value);
    if (form === "md") text = text.replace(/^#+\s+/, "");
    if (form === "int") text = Number(value).toLocaleString("en-US");
    if (form === "fix1") text = Number(value).toFixed(1);
    if (form === "fix2") text = Number(value).toFixed(2);
    if (form === "pct") text = `${Number(value)}%`;
    const cell = /^cell:(\d+)$/.exec(form || "");
    if (cell) {
      const cells = text.split("|").map((part) => part.trim()).filter((part, index, all) => !(part === "" && (index === 0 || index === all.length - 1)));
      text = cells[Number(cell[1])] ?? "";
    }
    return text;
  }

  function textFor(data, attrs) {
    if (attrs.num) return numberText(data, attrs.num, attrs.form);
    if (attrs.j) return pathText(data, attrs.j, attrs.form);
    return null;
  }

  function fill(doc, data) {
    const problems = [];
    doc.querySelectorAll("[data-num], [data-j]").forEach((node) => {
      const text = textFor(data, { num: node.dataset.num, j: node.dataset.j, form: node.dataset.form });
      if (text == null) {
        problems.push(node.dataset.num || node.dataset.j);
        return;
      }
      if (node.textContent !== text) node.textContent = text;
    });
    return problems;
  }

  const api = Object.freeze({ numberText, pathText, resolvePath, textFor, fill });
  root.W04Fill = api;

  if (root.document && root.W04_DATA) {
    const problems = fill(root.document, root.W04_DATA);
    if (problems.length) console.error(`W04 numbers: ${problems.length} unresolved binding(s): ${problems.join(", ")}`);
  }
})(typeof window !== "undefined" ? window : globalThis);
