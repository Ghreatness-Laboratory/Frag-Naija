'use client';

import { useState } from 'react';

type CollapsibleTextProps = {
  text: string;
  className?: string;
  characterLimit?: number;
};

/** Keeps lengthy free text compact in cards while retaining the full content inline. */
export default function CollapsibleText({ text, className = '', characterLimit = 180 }: CollapsibleTextProps) {
  const [expanded, setExpanded] = useState(false);
  const content = text.trim();
  const isLong = content.length > characterLimit;
  const visibleText = expanded || !isLong ? content : `${content.slice(0, characterLimit).trimEnd()}…`;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap">{visibleText}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-1 text-[10px] font-black uppercase tracking-widest text-fn-green transition-colors hover:text-fn-gdim focus:outline-none focus:underline"
        >
          {expanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}
