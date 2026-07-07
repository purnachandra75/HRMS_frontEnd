export const isBlankDateValue = (value) => {
  if (value === null || value === undefined) return true;
  const normalized = String(value).trim().toLowerCase();
  return !normalized || normalized === "n/a" || normalized === "na" || normalized === "null";
};

export const formatDateDDMMYYYY = (value, fallback = "N/A") => {
  if (isBlankDateValue(value)) return fallback;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const text = String(value).trim();
  const dateOnly = text.split("T")[0];
  const ymdMatch = dateOnly.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  }

  const dmyMatch = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : formatDateDDMMYYYY(parsed, fallback);
};
