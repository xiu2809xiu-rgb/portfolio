/**
 * Nothing inside <head> may have to wait.
 *
 *   npm run build && node scripts/_hydration-head.mjs [directory]
 *
 * The root layout renders its own <head>. React hydrates that element with a
 * cursor it saves on the way in and restores on the way out, and the saving is
 * not safe to do twice: if a direct child of <head> is not ready the first time
 * React gets there, the head is started again, the saved position is replaced by
 * one inside the head, and the body's first elements are then matched against
 * the head's. Nothing lines up, so React throws the server's HTML away and
 * renders the whole document again in the browser (error #418). It only happens
 * when the missing piece arrives in the few milliseconds between the two
 * attempts, which makes it an occasional full-page flash on a slow device and
 * invisible everywhere else — the worst kind of bug to find by looking.
 *
 * What makes a child "not ready" is visible in the build output, so this reads
 * it instead of trying to lose a race on purpose. In the payload each page
 * streams to the browser, a child of <head> has to wait when:
 *
 *   · one of its props is an export of a 'use client' module — the server sends
 *     a reference, and the value exists only once that module's chunk has
 *     loaded. This is the mistake that is easy to make: importing a constant
 *     from a client component's file into the layout;
 *   · one of its props points at a row that arrives later in the stream;
 *   · the child itself is deferred — an unresolved async component or a promise.
 *
 * Any of the three fails the check, for every prerendered page. So does a page
 * with no <head> in its payload at all: that means the build output has changed
 * shape, and a check that can no longer see what it checks should not pass.
 *
 * The directory defaults to the build's prerendered pages.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? join('.next', 'server', 'app'));

/** Pages Next renders outside the root layout. They have no <head> of ours to check. */
const NO_LAYOUT = /^_(?:not-found|global-error)\.html$/;

function htmlFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...htmlFiles(path));
    else if (name.endsWith('.html')) found.push(path);
  }
  return found;
}

/** The streamed payload: every `self.__next_f.push([1, "…"])` in the page, joined. */
function payloadOf(html) {
  const pieces = [];
  // Attributes are allowed for: a nonce, if the site ever gains a content security policy.
  const pattern = /<script[^>]*>self\.__next_f\.push\((\[1,[\s\S]*?\])\)<\/script>/g;
  for (const match of html.matchAll(pattern)) pieces.push(JSON.parse(match[1])[1]);
  return pieces.join('');
}

/**
 * Splits the payload into rows, in the order the browser receives them.
 *
 * A row is `<hex id>:<body>` up to a newline — except text rows, which are
 * `<id>:T<hex byte length>,<text>` and may contain newlines of their own.
 */
function rowsOf(payload) {
  const rows = new Map();
  let at = 0;
  let order = 0;
  while (at < payload.length) {
    const head = /^([0-9a-f]*):/.exec(payload.slice(at, at + 12));
    if (!head) {
      const end = payload.indexOf('\n', at);
      at = end < 0 ? payload.length : end + 1;
      continue;
    }
    const id = head[1];
    let cursor = at + head[0].length;
    if (payload[cursor] === 'T') {
      const comma = payload.indexOf(',', cursor);
      let bytes = Number.parseInt(payload.slice(cursor + 1, comma), 16);
      cursor = comma + 1;
      while (bytes > 0 && cursor < payload.length) {
        const code = payload.codePointAt(cursor);
        bytes -= Buffer.byteLength(String.fromCodePoint(code));
        cursor += code > 0xffff ? 2 : 1;
      }
      rows.set(id, { kind: 'text', order });
      at = cursor;
    } else {
      const end = payload.indexOf('\n', cursor);
      const body = payload.slice(cursor, end < 0 ? payload.length : end);
      const kind = body.startsWith('I[') ? 'client-module' : /^[[{"]/.test(body) ? 'model' : 'other';
      // A later row with the same id replaces an earlier placeholder; keep the first for ordering.
      if (id && !rows.has(id)) rows.set(id, { kind, order, body });
      at = end < 0 ? payload.length : end + 1;
    }
    order += 1;
  }
  return rows;
}

const isElement = (value) => Array.isArray(value) && value[0] === '$' && value.length >= 4;

/**
 * A value taken from another row: `$1c`, or `$1c:props:children:0` for something
 * inside it. The optional letter marks a Map, Set, FormData, Blob, server
 * function or iterator held in that row; the browser reads them all the same way.
 */
const VALUE_REFERENCE = /^\$[QWKBih]?([0-9a-f]+)((?::[^:]+)*)$/;
/** A row the reader is told it may have to wait for: a lazy element, or a promise. */
const DEFERRED_REFERENCE = /^\$[L@]([0-9a-f]+)$/;

function parsed(row) {
  if (row.value === undefined) {
    try {
      row.value = JSON.parse(row.body);
    } catch {
      row.value = null;
    }
  }
  return row.value;
}

/** Every <head> element in a parsed row, however deep. */
function* headsIn(value) {
  if (!value || typeof value !== 'object') return;
  if (isElement(value) && value[1] === 'head') yield value;
  for (const item of Array.isArray(value) ? value : Object.values(value)) yield* headsIn(item);
}

function checkPage(file) {
  const rows = rowsOf(payloadOf(readFileSync(file, 'utf8')));
  const problems = [];
  let heads = 0;

  /** Is this element type the Fragment symbol? Its children count as the head's own. */
  const isFragment = (type) => {
    const reference = typeof type === 'string' ? VALUE_REFERENCE.exec(type) : null;
    const row = reference && !reference[2] ? rows.get(reference[1]) : null;
    return row?.kind === 'model' && parsed(row) === '$Sreact.fragment';
  };

  /**
   * What a reference stands for, read the way the browser reads it at the moment
   * <head> arrives. Gives `{ value }` when it can be read there and then. When it
   * would have to wait, records why and gives null.
   */
  const read = (text, headOrder, describe, trail = new Set()) => {
    const match = VALUE_REFERENCE.exec(text) ?? DEFERRED_REFERENCE.exec(text);
    if (!match || trail.has(text)) return { value: undefined };
    trail.add(text);

    const [, id, path = ''] = match;
    const row = rows.get(id);
    if (!row) {
      problems.push(`${describe} reads row ${id}, which the page never sends`);
      return null;
    }
    if (row.kind === 'client-module') {
      const exported = /"([^"]*)"\]?$/.exec(row.body)?.[1] ?? '?';
      problems.push(`${describe} takes "${exported}" from a 'use client' module as a value`);
      return null;
    }
    if (row.order > headOrder) {
      problems.push(`${describe} reads row ${id}, which arrives after <head> does`);
      return null;
    }
    if (row.kind !== 'model') return { value: undefined }; // a finished piece of text

    let value = parsed(row);
    for (const key of path ? path.slice(1).split(':') : []) {
      // A step along the path can land on another reference, which must be readable too.
      while (typeof value === 'string' && (VALUE_REFERENCE.test(value) || DEFERRED_REFERENCE.test(value))) {
        const next = read(value, headOrder, describe, trail);
        if (!next) return null;
        value = next.value;
      }
      if (value === null || typeof value !== 'object') return { value: undefined };
      // On the wire an element is ["$", type, key, props]; a path names those parts.
      value = isElement(value) ? { type: value[1], key: value[2], props: value[3] }[key] : value[key];
    }
    return { value };
  };

  /** Walks one child's own props — not into nested elements, which wait on their own. */
  const scanProps = (value, headOrder, describe, seen) => {
    if (typeof value === 'string') {
      if (!VALUE_REFERENCE.test(value) || seen.has(value)) return;
      seen.add(value);
      const target = read(value, headOrder, describe);
      // Whatever it points at has to be self-contained as well.
      if (target && target.value !== undefined) scanProps(target.value, headOrder, describe, seen);
      return;
    }
    if (!value || typeof value !== 'object' || isElement(value)) return;
    for (const item of Array.isArray(value) ? value : Object.values(value)) {
      scanProps(item, headOrder, describe, seen);
    }
  };

  const checkChild = (child, headOrder, seen = new Set()) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (typeof child === 'string') {
      if (DEFERRED_REFERENCE.test(child)) {
        problems.push(`a child of <head> is deferred (${child})`);
        return;
      }
      if (!VALUE_REFERENCE.test(child) || seen.has(child)) return; // ordinary text
      seen.add(child);
      const target = read(child, headOrder, 'a child of <head>');
      if (target && target.value !== undefined) checkChild(target.value, headOrder, seen);
      return;
    }
    if (isElement(child)) {
      const [, type, , props] = child;
      if (isFragment(type)) {
        checkChild(props?.children, headOrder, seen);
        return;
      }
      scanProps(props, headOrder, `<${typeof type === 'string' ? type : '?'}> in <head>`, new Set());
      return;
    }
    if (Array.isArray(child)) for (const item of child) checkChild(item, headOrder, seen);
  };

  for (const row of rows.values()) {
    if (row.kind !== 'model' || !row.body.includes('"head"')) continue;
    for (const head of headsIn(parsed(row))) {
      heads += 1;
      checkChild(head[3]?.children, row.order);
    }
  }
  return { heads, problems };
}

const files = htmlFiles(ROOT);
let heads = 0;
let failing = 0;

for (const file of files) {
  const name = relative(ROOT, file).replaceAll('\\', '/');
  const result = checkPage(file);
  const problems = [...new Set(result.problems)];
  if (!result.heads && !NO_LAYOUT.test(name)) {
    problems.push('no <head> element was found in its payload — has the build output changed shape?');
  }
  heads += result.heads;
  if (!problems.length) continue;
  failing += 1;
  console.log(`✗ ${name}`);
  for (const problem of problems) console.log(`    ${problem}`);
}

console.log(
  `${files.length} prerendered pages, ${heads} <head> elements: ` +
    (failing ? `${failing} page(s) fail` : 'nothing in <head> waits'),
);
if (!heads) {
  console.log('No <head> element was found in any payload — has the build output moved?');
  process.exit(1);
}
process.exit(failing ? 1 : 0);
