export function getAvatarUrl(picture, name = 'User') {
  if (!picture || picture === 'default-avatar.png') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff`;
  }
  if (picture.startsWith('http://') || picture.startsWith('https://')) {
    return picture;
  }
  if (picture.startsWith('/uploads')) {
    return picture;
  }
  return `/uploads/${picture}`;
}

