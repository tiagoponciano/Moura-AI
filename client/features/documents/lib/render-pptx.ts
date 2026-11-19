import { DOMParser, XMLSerializer, type Element } from "@xmldom/xmldom";
import PizZip from "pizzip";

const DRAWING = "http://schemas.openxmlformats.org/drawingml/2006/main";
const PRESENTATION =
  "http://schemas.openxmlformats.org/presentationml/2006/main";
const SLIDE = /^ppt\/slides\/slide\d+\.xml$/;
const TAG = /\{\{\s*(\w+)\s*\}\}/g;
const WHOLE_TAG = /^\{\{\s*(\w+)\s*\}\}$/;

export type PptxValue = string | string[];

function childElements(parent: Element, name: string): Element[] {
  const found: Element[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i] as Element;
    if (node.namespaceURI === DRAWING && node.localName === name) {
      found.push(node);
    }
  }
  return found;
}

/** The paragraphs of every text box, as PowerPoint shows them. */
function paragraphs(slide: Element): Element[] {
  const bodies = slide.getElementsByTagNameNS(PRESENTATION, "txBody");
  const found: Element[] = [];
  for (let i = 0; i < bodies.length; i++) {
    found.push(...childElements(bodies[i], "p"));
  }
  return found;
}

const runText = (run: Element) => childElements(run, "t")[0]?.textContent ?? "";

function setRunText(run: Element, text: string) {
  const node = childElements(run, "t")[0];
  if (!node?.ownerDocument) return;
  while (node.firstChild) node.removeChild(node.firstChild);
  node.appendChild(node.ownerDocument.createTextNode(text));
}

/** Puts the text in the first run, keeping its formatting, and empties the rest. */
function setRuns(runs: Element[], text: string) {
  runs.forEach((run, index) => setRunText(run, index === 0 ? text : ""));
}

function fillParagraph(
  paragraph: Element,
  values: Record<string, PptxValue>,
  missing: string[],
) {
  const runs = childElements(paragraph, "r");
  const text = runs.map(runText).join("");
  if (!text.match(TAG)) return;

  const whole = WHOLE_TAG.exec(text.trim());
  const list = whole ? values[whole[1]] : undefined;
  if (Array.isArray(list)) {
    if (list.length === 0) {
      paragraph.parentNode?.removeChild(paragraph);
      return;
    }
    setRuns(runs, list[0]);
    let previous = paragraph;
    for (const entry of list.slice(1)) {
      const clone = paragraph.cloneNode(true) as Element;
      const [first, ...rest] = childElements(clone, "r");
      rest.forEach((run) => clone.removeChild(run));
      setRunText(first, entry);
      previous.parentNode?.insertBefore(clone, previous.nextSibling);
      previous = clone;
    }
    return;
  }

  setRuns(
    runs,
    text.replace(TAG, (_, name: string) => {
      const value = values[name];
      if (value === undefined) {
        missing.push(name);
        return "";
      }
      return typeof value === "string" ? value : value.join(" ");
    }),
  );
}

function slides(zip: PizZip) {
  return Object.keys(zip.files)
    .filter((path) => SLIDE.test(path))
    .map((path) => ({
      path,
      document: new DOMParser().parseFromString(
        zip.file(path)!.asText(),
        "text/xml",
      ),
    }));
}

/** Every `{{tag}}` the deck holds, for checking a template and its values agree. */
export function pptxTags(template: Uint8Array): Set<string> {
  const tags = new Set<string>();
  for (const { document } of slides(new PizZip(template))) {
    for (const paragraph of paragraphs(document.documentElement!)) {
      const text = childElements(paragraph, "r").map(runText).join("");
      for (const match of text.matchAll(TAG)) tags.add(match[1]);
    }
  }
  return tags;
}

/**
 * Replaces the `{{tags}}` of a `.pptx` and returns the deck and the tags that
 * had no value, which become empty text. A paragraph made only of one tag whose
 * value is a list becomes one paragraph per entry, each with the original
 * paragraph's formatting; an empty list removes the paragraph.
 */
export function fillPptx(
  template: Uint8Array,
  values: Record<string, PptxValue>,
): { file: Uint8Array; missing: string[] } {
  const zip = new PizZip(template);
  const missing: string[] = [];
  for (const { path, document } of slides(zip)) {
    for (const paragraph of paragraphs(document.documentElement!)) {
      fillParagraph(paragraph, values, missing);
    }
    zip.file(path, new XMLSerializer().serializeToString(document));
  }
  return {
    file: zip.generate({ type: "uint8array", compression: "DEFLATE" }),
    missing,
  };
}
