export function createDefaultAvatar(role: 'Admin' | 'Inspector', name?: string): string {
  const initial = (name && name.trim().length > 0) 
    ? name.trim().charAt(0).toUpperCase() 
    : (role === 'Admin' ? 'A' : 'I');
  
  const accentColor = role === 'Admin' ? '%2306b6d4' : '%2310b981';
  const roleLabel = role === 'Admin' ? 'ADMIN' : 'INSPECTOR';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="%23090d16"/><rect x="2" y="2" width="116" height="116" rx="26" fill="none" stroke="${accentColor}" stroke-width="3" stroke-opacity="0.5"/><circle cx="60" cy="48" r="22" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2"/><text x="60" y="56" font-family="monospace, sans-serif" font-weight="bold" font-size="22" fill="%23f8fafc" text-anchor="middle">${initial}</text><rect x="20" y="82" width="80" height="20" rx="6" fill="${accentColor}"/><text x="60" y="96" font-family="sans-serif" font-weight="bold" font-size="10" fill="%23090d16" text-anchor="middle" letter-spacing="1">${roleLabel}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
