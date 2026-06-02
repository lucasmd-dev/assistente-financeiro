'use client';

import { Fragment, type ReactNode } from 'react';

// Renderizador Markdown leve e seguro (sem HTML cru): **negrito**, *itálico*, `code`,
// listas (-, *, •, 1.), títulos (#) e parágrafos.

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key++} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-[oklch(0.9_0.12_210)]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key++} className="italic text-white/90">{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownLite({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={key++}
        className={list.ordered ? 'ml-4 list-decimal space-y-1' : 'ml-4 list-disc space-y-1 marker:text-[oklch(0.7_0.18_286)]'}
      >
        {items.map((it, i) => (
          <li key={i} className="text-white/75">{parseInline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    const heading = line.match(/^#{1,3}\s+(.*)$/);

    if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (ordered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
    } else if (heading) {
      flushList();
      blocks.push(
        <p key={key++} className="font-display text-[0.95rem] font-bold text-white">
          {parseInline(heading[1])}
        </p>,
      );
    } else if (line.trim() === '') {
      flushList();
      blocks.push(<div key={key++} className="h-2" />);
    } else {
      flushList();
      blocks.push(
        <p key={key++} className="leading-relaxed text-white/75">
          {parseInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="space-y-1 text-sm">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
