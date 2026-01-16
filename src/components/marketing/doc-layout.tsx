import fs from "fs";
import path from "path";
import Link from "next/link";
import { Source_Serif_4, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";

type DocLayoutProps = {
  title: string;
  fileName: string;
};

type DocBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "rule" }
  | { type: "table"; rows: string[][] }
  | { type: "callout"; label: string; text: string };

const bodyFont = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-doc-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-doc-display",
});

const calloutPrefixes = [
  { prefix: "SUGGESTION:", label: "Suggestion" },
  { prefix: "Spotlight Feature:", label: "Spotlight Feature" },
  { prefix: "Teacher Benefit:", label: "Teacher Benefit" },
] as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isStandaloneHeading(text: string) {
  if (text.length > 90) return false;
  if (/[.!?]$/.test(text)) return false;
  if (/^[-*+]/.test(text)) return false;
  if (/^\d+[.)]\s+/.test(text)) return false;
  return /^[A-Z0-9]/.test(text);
}

function getHeadingLevel(text: string): 2 | 3 | 4 {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) return 4;
  if (text.length <= 55) return 2;
  return 3;
}

function parseDocContent(content: string): DocBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: DocBlock[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] | null = null;

  const flushList = () => {
    if (!list) return;
    blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    list = null;
  };

  const flushTable = () => {
    if (!table) return;
    blocks.push({ type: "table", rows: table });
    table = null;
  };

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) {
      flushList();
      flushTable();
      continue;
    }

    if (/^[-*_]{3,}$/.test(raw)) {
      flushList();
      flushTable();
      blocks.push({ type: "rule" });
      continue;
    }

    if (raw.includes("\t")) {
      flushList();
      const row = raw.split("\t").map((cell) => cell.trim());
      if (!table) table = [];
      table.push(row);
      continue;
    }
    flushTable();

    const callout = calloutPrefixes.find((item) => raw.startsWith(item.prefix));
    if (callout) {
      flushList();
      blocks.push({ type: "callout", label: callout.label, text: raw.slice(callout.prefix.length).trim() });
      continue;
    }

    const headingMatch = raw.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(4, headingMatch[1].length + 1) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: headingMatch[2].trim() });
      continue;
    }

    const orderedMatch = raw.match(/^\d+[.)]\s+(.*)$/);
    const unorderedMatch = raw.match(/^[-*+]\s+(.*)$/);
    if (orderedMatch || unorderedMatch) {
      flushTable();
      const ordered = Boolean(orderedMatch);
      const item = (orderedMatch ? orderedMatch[1] : unorderedMatch?.[1])?.trim();
      if (!item) continue;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }

    if (isStandaloneHeading(raw)) {
      flushList();
      blocks.push({ type: "heading", level: getHeadingLevel(raw), text: raw });
      continue;
    }

    blocks.push({ type: "paragraph", text: raw });
  }

  flushList();
  flushTable();

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const output: ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      output.push(text.slice(lastIndex, match.index));
    }
    output.push(
      <strong key={`bold-${match.index}`} className="font-semibold text-[var(--text)]">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    output.push(text.slice(lastIndex));
  }

  return output;
}

function renderDocBlocks(blocks: DocBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === "heading") {
      const HeadingTag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
      const headingClass =
        block.level === 2
          ? "text-2xl md:text-3xl font-semibold tracking-tight"
          : block.level === 3
            ? "text-xl md:text-2xl font-semibold tracking-tight"
            : "text-lg md:text-xl font-semibold tracking-tight";
      return (
        <HeadingTag
          key={`${block.type}-${index}`}
          id={slugify(block.text)}
          className={headingClass}
          style={{ fontFamily: "var(--font-doc-display)" }}
        >
          {block.text}
        </HeadingTag>
      );
    }

    if (block.type === "paragraph") {
      return (
        <p key={`${block.type}-${index}`} className="text-[color-mix(in_oklab,var(--text),black_12%)]">
          {renderInline(block.text)}
        </p>
      );
    }

    if (block.type === "list") {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={`${block.type}-${index}`}
          className={`space-y-2 pl-6 text-[color-mix(in_oklab,var(--text),black_12%)] ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
    }

    if (block.type === "rule") {
      return <hr key={`${block.type}-${index}`} className="border-[var(--border)]" />;
    }

    if (block.type === "table") {
      const [header, ...rows] = block.rows;
      return (
        <div key={`${block.type}-${index}`} className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[color-mix(in_oklab,var(--primary),white_90%)] text-[var(--text)]">
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={`head-${cellIndex}`} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[color-mix(in_oklab,var(--text),black_12%)]">
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (block.type === "callout") {
      return (
        <div
          key={`${block.type}-${index}`}
          className="rounded-xl border border-[color-mix(in_oklab,var(--primary),white_70%)] bg-[color-mix(in_oklab,var(--primary),white_90%)] p-4"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in_oklab,var(--primary),black_10%)]">
            {block.label}
          </div>
          <div className="mt-2 text-sm text-[color-mix(in_oklab,var(--text),black_12%)]">
            {renderInline(block.text)}
          </div>
        </div>
      );
    }

    return null;
  });
}

export function DocLayout({ title, fileName }: DocLayoutProps) {
  // Sanitize fileName to prevent path traversal
  const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9._/-]/g, '');
  if (sanitizedFileName !== fileName || fileName.includes('..')) {
    throw new Error('Invalid file name');
  }
  const content = fs.readFileSync(path.join(process.cwd(), sanitizedFileName), "utf8").trim();
  const blocks = parseDocContent(content);

  return (
    <div className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-[var(--background)] text-[var(--text)]`}>
      <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <Link href="/pricing" className="hover:text-[var(--text)]">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <Link href="/login" className="hover:text-[var(--text)]">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="veritas-light bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Resource</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
            <article
              className="space-y-6 text-[15px] leading-7 md:text-[17px] md:leading-8"
              style={{ fontFamily: "var(--font-doc-body)" }}
            >
              {renderDocBlocks(blocks)}
            </article>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
