/**
 * Safely resolves relative and absolute media URLs (e.g. post pictures and attachments)
 */
export function getMediaUrl(picture) {
  if (!picture) return null;
  if (picture.startsWith('http://') || picture.startsWith('https://')) {
    return picture;
  }
  if (picture.startsWith('/uploads')) {
    return picture;
  }
  return `/uploads/${picture}`;
}

