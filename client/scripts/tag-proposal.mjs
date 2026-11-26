// Puts the `{{tags}}` of the commercial proposal into the designed deck: the one
// exported from the PDF Moura sends clients, with its logo, photo and background.
// Only the parts that change from one proposal to the next are tagged; the plan's
// items, the exclusions, the notes and the contacts stay as the design has them.
// Usage: node scripts/tag-proposal.mjs "<designed deck.pptx>" public/templates/proposal/proposal.pptx
// See client/features/documents/docs/commercial-proposal.md.

import { readFileSync, writeFileSync } from "node:fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import PizZip from "pizzip";

const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const [, , input, output] = process.argv;
const zip = new PizZip(readFileSync(input));

const kids = (el, name) =>
  Array.from(el.childNodes).filter(
    (n) => n.namespaceURI === A && n.localName === name,
  );
const paragraphsOf = (doc) => Array.from(doc.getElementsByTagNameNS(A, "p"));
const textOf = (p) =>
  kids(p, "r")
    .map((r) => kids(r, "t")[0]?.textContent ?? "")
    .join("");

/** The text in the first run, with its formatting; the rest of the runs go. */
function setText(p, text) {
  const [first, ...rest] = kids(p, "r");
  rest.forEach((run) => p.removeChild(run));
  const t = kids(first, "t")[0];
  while (t.firstChild) t.removeChild(t.firstChild);
  t.appendChild(t.ownerDocument.createTextNode(text));
}

function edit(path, change) {
  const doc = new DOMParser().parseFromString(
    zip.file(path).asText(),
    "text/xml",
  );
  const find = (start) => {
    const p = paragraphsOf(doc).find((para) => textOf(para).startsWith(start));
    if (!p) throw new Error(`No paragraph starting with "${start}" in ${path}`);
    return p;
  };
  change(find, doc);
  zip.file(path, new XMLSerializer().serializeToString(doc));
}

// Cover: the four labels share one paragraph that only wraps into lines; each gets its own.
edit("ppt/slides/slide1.xml", (find) => {
  const labels = find("Cliente:");
  const lines = [
    ["Cliente: ", "client"],
    ["Empreendimento: ", "project_name"],
    ["Município/UF: ", "city_state"],
    ["Data da proposta: ", "date"],
  ];
  let previous = labels;
  lines.forEach(([label, tag], index) => {
    const line = index === 0 ? labels : labels.cloneNode(true);
    setText(line, `${label}{{${tag}}}`);
    // The design's right margin was sized for the bare labels; the values need the width.
    line.firstChild.setAttribute("marR", "0");
    // Smaller and tighter, so a long client or building name still leaves all four lines on the page.
    kids(kids(line, "r")[0], "rPr")[0].setAttribute("sz", "2200");
    for (const spacing of kids(line.firstChild, "lnSpc")) {
      spacing.firstChild.setAttribute("val", "120000");
    }
    if (index > 0) {
      for (const spacing of kids(line.firstChild, "spcBef")) {
        line.firstChild.removeChild(spacing);
      }
      previous.parentNode.insertBefore(line, previous.nextSibling);
      previous = line;
    }
  });
});

edit("ppt/slides/slide3.xml", (find) => {
  setText(find("GESTÃO"), "{{plan_title}}");
  setText(find("Indicado"), "{{plan_description}}");
  setText(find("R$"), "{{price}}");
});

edit("ppt/slides/slide4.xml", (find) => {
  setText(
    find("Validade da proposta"),
    "Validade da proposta: {{validity_days}} dias",
  );
});

writeFileSync(
  output,
  zip.generate({ type: "nodebuffer", compression: "DEFLATE" }),
);
