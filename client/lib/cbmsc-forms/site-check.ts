import "server-only";
import {
  fetchCbmscDriveFileIds,
  fetchGoogleDocTitle,
  resolveGoogleDocIds,
} from "./google";
import { parseFormTitle } from "./title";
import type { SiteCheck, SiteForm } from "./types";

const rejected = (results: PromiseSettledResult<unknown>[]) =>
  results.filter((result) => result.status === "rejected");

/**
 * Server-only. Reads every form listed on the CBMSC page. Never throws: a page
 * that cannot be read or lists nothing is `failed`, and a Drive file or title
 * that cannot be read makes the check `partial`.
 */
export async function readCbmscSite(): Promise<SiteCheck> {
  const checkedAt = new Date().toISOString();
  const failed = (cause: unknown): SiteCheck => {
    console.error("The CBMSC site check failed", cause);
    return { checkedAt, status: "failed", failures: 1, forms: [] };
  };

  let driveIds: string[];
  try {
    driveIds = await fetchCbmscDriveFileIds();
  } catch (cause) {
    return failed(cause);
  }
  if (!driveIds.length) return failed("The page has no Drive links");

  const pdfs = await Promise.allSettled(
    driveIds.map((id) => resolveGoogleDocIds({ kind: "drive-file", id })),
  );
  const docIds = [
    ...new Set(
      pdfs.flatMap((pdf) => (pdf.status === "fulfilled" ? pdf.value : [])),
    ),
  ];
  const titles = await Promise.allSettled(docIds.map(fetchGoogleDocTitle));

  const forms: SiteForm[] = [];
  titles.forEach((title, index) => {
    if (title.status === "fulfilled") {
      forms.push({
        googleDocId: docIds[index],
        ...parseFormTitle(title.value),
      });
    }
  });
  const problems = [...rejected(pdfs), ...rejected(titles)];
  if (!forms.length) return failed(problems);
  if (problems.length)
    console.error("The CBMSC site check is partial", problems);

  return {
    checkedAt,
    status: problems.length ? "partial" : "complete",
    failures: problems.length,
    forms,
  };
}
