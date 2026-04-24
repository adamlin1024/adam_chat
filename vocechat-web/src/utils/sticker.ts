const STICKER_REGEX = /^!\[[^\]]*\]\((\/stickers\/[^)\s]+)\)\s*$/;

export function getStickerUrl(content: string | undefined | null): string | null {
  if (!content) return null;
  const match = content.trim().match(STICKER_REGEX);
  return match ? match[1] : null;
}

export function isStickerContent(
  content: string | undefined | null,
  content_type?: string
): boolean {
  if (content_type && content_type !== "text/markdown") return false;
  return getStickerUrl(content) !== null;
}
