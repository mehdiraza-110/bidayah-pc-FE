// Share / import for a Build From Scratch selection. Everything happens in the
// browser: a build is just a list of product ids + quantities, packed into a
// short code that can travel as a link, pasted text, or a downloaded file.
//
// Code format: "BDY1-" + base64url of [version=1, count, (16-byte uuid, qty)*].
// ~23 chars per part, so a full 9-step build is ~210 characters.
// Prices are never carried — the receiver always sees current live prices.

import type { PcBuilderPreselect } from '@/lib/gamingPcBuilder';

export interface BuildShareItem {
  product_id: string;
  quantity: number;
}

const PREFIX = 'BDY1-';
const VERSION = 1;
const MAX_QUANTITY = 99;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuidToBytes = (uuid: string): number[] => {
  const hex = uuid.replace(/-/g, '');
  return Array.from({ length: 16 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
};

const bytesToUuid = (bytes: number[]): string => {
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const toBase64Url = (bytes: number[]): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (value: string): number[] => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Array.from(binary, (ch) => ch.charCodeAt(0));
};

export const encodeBuild = (items: BuildShareItem[]): string => {
  const valid = items.filter((i) => UUID_RE.test(i.product_id) && i.quantity > 0).slice(0, 255);
  const bytes = [VERSION, valid.length];
  valid.forEach(({ product_id, quantity }) => {
    bytes.push(...uuidToBytes(product_id), Math.min(quantity, MAX_QUANTITY));
  });
  return PREFIX + toBase64Url(bytes);
};

export const decodeBuild = (code: string): BuildShareItem[] | null => {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(PREFIX)) return null;
    const bytes = fromBase64Url(trimmed.slice(PREFIX.length));
    if (bytes[0] !== VERSION) return null;
    const count = bytes[1];
    if (bytes.length !== 2 + count * 17) return null;

    const items: BuildShareItem[] = [];
    for (let i = 0; i < count; i++) {
      const offset = 2 + i * 17;
      const quantity = bytes[offset + 16];
      if (quantity < 1 || quantity > MAX_QUANTITY) return null;
      items.push({ product_id: bytesToUuid(bytes.slice(offset, offset + 16)), quantity });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
};

export const buildShareLink = (code: string): string =>
  `${window.location.origin}/pc-builder?build=${encodeURIComponent(code)}`;

// Downloadable file: the code plus a human-readable parts list, so the file
// is meaningful even if someone opens it in a text editor.
export const buildShareFileContent = (
  code: string,
  parts: { category: string; name: string; quantity: number }[]
): string =>
  JSON.stringify({ app: 'bidayah-pc-builder', version: VERSION, code, parts }, null, 2);

// Accepts whatever a friend might paste or upload: a bare code, a share link,
// or the contents of a downloaded build file.
export const extractBuildFromText = (text: string): BuildShareItem[] | null => {
  const input = text.trim();
  if (!input) return null;

  if (input.startsWith('{')) {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed?.code === 'string' ? decodeBuild(parsed.code) : null;
    } catch {
      return null;
    }
  }

  const fromLink = input.match(/[?&]build=([^&#\s]+)/);
  return decodeBuild(fromLink ? decodeURIComponent(fromLink[1]) : input);
};

export const toPreselect = (items: BuildShareItem[]): PcBuilderPreselect => ({
  buildName: 'Shared build',
  buildSurcharge: 0,
  items,
});
