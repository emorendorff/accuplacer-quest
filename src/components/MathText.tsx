// Renders MathText: prose with $inline$ and $$display$$ math (KaTeX), **bold**,
// *italic*, "- " bullet lists, "1. " numbered lists, and blank-line paragraphs.

import katex from 'katex';
import { Fragment, useMemo, type ReactNode } from 'react';

type Token = { kind: 'text' | 'math' | 'display'; value: string };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let buf = '';
  let i = 0;
  const flush = (kind: Token['kind']) => {
    if (buf) out.push({ kind, value: buf });
    buf = '';
  };
  while (i < src.length) {
    if (src[i] === '\\' && src[i + 1] === '$') {
      buf += '\\$';
      i += 2;
    } else if (src.startsWith('$$', i)) {
      const end = src.indexOf('$$', i + 2);
      if (end === -1) { buf += src.slice(i); break; }
      flush('text');
      out.push({ kind: 'display', value: src.slice(i + 2, end) });
      i = end + 2;
    } else if (src[i] === '$') {
      // Find the closing $, skipping escaped \$ inside the math.
      let j = i + 1;
      while (j < src.length && !(src[j] === '$' && src[j - 1] !== '\\')) j++;
      flush('text');
      out.push({ kind: 'math', value: src.slice(i + 1, j) });
      i = j + 1;
    } else {
      buf += src[i++];
    }
  }
  flush('text');
  return out;
}

function renderMath(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: false });
}

function Emphasis({ text }: { text: string }) {
  // **bold** first, then *italic* inside the remaining pieces.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        return p.split(/(\*[^*\s][^*]*\*)/g).map((q, j) =>
          q.startsWith('*') && q.endsWith('*') && q.length > 2 ? <em key={`${i}-${j}`}>{q.slice(1, -1)}</em> : <Fragment key={`${i}-${j}`}>{q.replace(/\\\$/g, '$')}</Fragment>,
        );
      })}
    </>
  );
}

function Inline({ src }: { src: string }) {
  const tokens = useMemo(() => tokenize(src), [src]);
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === 'text' ? (
          <Emphasis key={i} text={t.value} />
        ) : (
          <span key={i} className={t.kind === 'display' ? 'math-display' : 'math'} dangerouslySetInnerHTML={{ __html: renderMath(t.value, t.kind === 'display') }} />
        ),
      )}
    </>
  );
}

function withLineBreaks(src: string): ReactNode {
  const lines = src.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      <Inline src={line} />
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function MathText({ text, inline = false, vars }: { text: string; inline?: boolean; vars?: Record<string, string> }) {
  const src = vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
  if (inline) return <Inline src={src} />;

  const blocks = src.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*- /.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}><Inline src={l.replace(/^\s*- /, '')} /></li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+\. /.test(l))) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}><Inline src={l.replace(/^\s*\d+\. /, '')} /></li>)}</ol>;
        }
        return <p key={i}>{withLineBreaks(block)}</p>;
      })}
    </>
  );
}
