import "server-only";

// Read-only Notion integration: pull recent diary pages shared with the
// integration and flatten them to plain text for the suggestion prompt.
// Uses the Search API, so it works whether the diary is a database or
// plain pages — whatever is shared with the integration is what we see.

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const RECENT_DAYS = 14;
const MAX_PAGES = 5;
const MAX_BLOCK_REQUESTS = 10; // paginate up to 1,000 blocks per page
const MAX_CHARS_PER_ENTRY = 1500;

export interface DiaryEntry {
  title: string;
  date: string; // YYYY-MM-DD (last edited)
  text: string;
}

interface RichText {
  plain_text?: string;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "content-type": "application/json",
  };
}

function plain(rich: RichText[] | undefined): string {
  return (rich ?? []).map((t) => t.plain_text ?? "").join("");
}

// Title lives in whichever property has type "title" (DB pages) — fall back
// to the default "title" property (plain pages).
function pageTitle(page: Record<string, unknown>): string {
  const props = (page.properties ?? {}) as Record<
    string,
    { type?: string; title?: RichText[] }
  >;
  for (const p of Object.values(props)) {
    if (p?.type === "title") return plain(p.title) || "(제목 없음)";
  }
  return "(제목 없음)";
}

type Block = Record<string, unknown> & {
  type?: string;
  last_edited_time?: string;
};

function blockText(block: Block): string {
  const type = block.type;
  if (!type) return "";
  const content = block[type] as { rich_text?: RichText[] } | undefined;
  return plain(content?.rich_text).trim();
}

// Diaries are one long page with entries stacked chronologically — but the
// direction varies (newest-at-top vs appended-at-bottom). Detect it from
// block last_edited_time, prefer recently edited blocks, and slice the
// newest end of the text.
async function pageText(token: string, pageId: string): Promise<string> {
  const blocks: Block[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_BLOCK_REQUESTS; i++) {
    const url = `${NOTION_API}/blocks/${pageId}/children?page_size=100${
      cursor ? `&start_cursor=${cursor}` : ""
    }`;
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) break;
    const data = (await res.json()) as {
      results?: Block[];
      has_more?: boolean;
      next_cursor?: string;
    };
    blocks.push(...(data.results ?? []));
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  if (blocks.length === 0) return "";

  // Which end is newest? Compare edit times of the first/last dated blocks.
  const edited = blocks
    .map((b) => Date.parse(b.last_edited_time ?? ""))
    .filter((t) => !Number.isNaN(t));
  const newestFirst =
    edited.length >= 2 ? edited[0] >= edited[edited.length - 1] : true;

  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recent = blocks.filter(
    (b) => Date.parse(b.last_edited_time ?? "") >= cutoff,
  );
  const lines = (recent.length ? recent : blocks)
    .map(blockText)
    .filter(Boolean);
  const joined = lines.join("\n");
  return newestFirst
    ? joined.slice(0, MAX_CHARS_PER_ENTRY)
    : joined.slice(-MAX_CHARS_PER_ENTRY);
}

// Recent diary entries, newest first. Returns [] when the token is missing
// or anything fails — the suggestion prompt just proceeds without diary.
export async function getRecentDiary(): Promise<DiaryEntry[]> {
  const token = process.env.NOTION_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        filter: { value: "page", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 20,
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<Record<string, unknown> & { last_edited_time?: string }>;
    };

    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const recent = (data.results ?? [])
      .filter((p) => {
        const t = p.last_edited_time ? Date.parse(p.last_edited_time) : 0;
        return t >= cutoff;
      })
      .slice(0, MAX_PAGES);

    const entries: DiaryEntry[] = [];
    for (const page of recent) {
      const text = await pageText(token, String(page.id));
      if (!text.trim()) continue;
      entries.push({
        title: pageTitle(page),
        date: (page.last_edited_time ?? "").slice(0, 10),
        text,
      });
    }
    return entries;
  } catch {
    return [];
  }
}
