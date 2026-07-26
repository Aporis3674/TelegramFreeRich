/**
 * README guards.
 *
 * The two READMEs have to stay in step, and their table of contents has to
 * actually go somewhere. GitHub's heading slugs are unpredictable once emoji,
 * Persian text and zero-width joiners are involved — several links were quietly
 * dead — so both files use explicit `<a id>` anchors, and these tests keep it
 * that way.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const FILES = ['README.md', 'README_fa.md'];
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

/** @param {string} text */
const anchorsIn = (text) => [...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
/** @param {string} text */
const linksIn = (text) => [
  ...[...text.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]),
  ...[...text.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]),
];

describe.each(FILES)('%s', (name) => {
  const text = read(name);

  it('links only to anchors it defines', () => {
    const defined = new Set(anchorsIn(text));
    const dead = linksIn(text).filter((target) => !defined.has(target));
    expect(dead).toEqual([]);
  });

  it('defines each anchor once', () => {
    const anchors = anchorsIn(text);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('states the version that package.json says', () => {
    expect(text).toContain(`version-${pkg.version}-`);
  });

  it('references files that exist', () => {
    const local = [...text.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)].map((m) => m[1]);
    const missing = local.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
    expect(missing).toEqual([]);
  });

  it('has balanced <details> blocks', () => {
    // Only tags on their own line are real blocks; the rest are examples of
    // the Rich HTML vocabulary quoted inside tables and diagrams.
    const open = (text.match(/^<details>$/gm) || []).length;
    const close = (text.match(/^<\/details>$/gm) || []).length;
    expect(open).toBe(close);
    expect(open).toBeGreaterThan(0);
  });
});

describe('the two READMEs stay in step', () => {
  const [en, fa] = FILES.map(read);

  it('has the same sections in the same order', () => {
    const anchors = (text) => anchorsIn(text);
    expect(anchors(fa)).toEqual(anchors(en));
  });

  it('links to each other', () => {
    expect(en).toContain('README_fa.md');
    expect(fa).toContain('README.md');
  });

  it('shows the same badges', () => {
    const badges = (text) =>
      [...text.matchAll(/img\.shields\.io\/badge\/([^-]+)-/g)].map((m) => m[1]);
    expect(badges(fa)).toEqual(badges(en));
  });
});
