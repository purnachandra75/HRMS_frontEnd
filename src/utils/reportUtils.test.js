import { normalizeEmploymentType, getEmploymentTypeLabel, matchesEmploymentFilter } from './reportUtils';

describe('reportUtils', () => {
  it('normalizes common employment type variants', () => {
    expect(normalizeEmploymentType('Full Time')).toBe('full');
    expect(normalizeEmploymentType('Part-Time')).toBe('part');
    expect(normalizeEmploymentType('Contract')).toBe('contract');
  });

  it('formats labels for display', () => {
    expect(getEmploymentTypeLabel('full-time')).toBe('Full-Time');
    expect(getEmploymentTypeLabel('part time')).toBe('Part-Time');
    expect(getEmploymentTypeLabel('')).toBe('N/A');
  });

  it('matches full-time and part-time filters across variants', () => {
    expect(matchesEmploymentFilter('Full-Time', 'full')).toBe(true);
    expect(matchesEmploymentFilter('parttime', 'part')).toBe(true);
    expect(matchesEmploymentFilter('Full-Time', 'part')).toBe(false);
    expect(matchesEmploymentFilter('Part Time', 'all')).toBe(true);
  });
});
