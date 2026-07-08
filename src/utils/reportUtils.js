export const normalizeEmploymentType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) return '';

  if (/full/.test(normalized)) return 'full';
  if (/part/.test(normalized)) return 'part';

  return normalized.replace(/\s+/g, '-');
};

export const getEmploymentTypeLabel = (value) => {
  const normalized = normalizeEmploymentType(value);

  if (!normalized) return 'N/A';
  if (normalized === 'full') return 'Full-Time';
  if (normalized === 'part') return 'Part-Time';

  return String(value || '').trim() || 'N/A';
};

export const matchesEmploymentFilter = (value, filter) => {
  const normalizedValue = normalizeEmploymentType(value);
  const normalizedFilter = String(filter || '').trim().toLowerCase();

  if (!normalizedFilter || normalizedFilter === 'all') return true;
  if (normalizedFilter === 'full') return normalizedValue === 'full';
  if (normalizedFilter === 'part') return normalizedValue === 'part';

  return normalizedValue === normalizedFilter;
};
