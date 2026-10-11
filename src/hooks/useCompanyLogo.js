import { useEffect, useState } from 'react';
import { fetchPayslipLogoObjectUrl } from '../services/payslipSettingsService';

const getLoggedInUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))?.id ?? null;
  } catch {
    return null;
  }
};

// Object URL of the tenant logo (the one uploaded under Payslip Settings), kept in memory per
// user id so navigating between pages doesn't refetch it. null while loading or when no logo
// has been uploaded.
let cached = { userId: null, url: null, promise: null };

const loadLogo = (userId) => {
  if (cached.userId !== userId) {
    if (cached.url) window.URL.revokeObjectURL(cached.url);
    cached = { userId, url: null, promise: null };
  }
  if (!cached.promise) {
    cached.promise = fetchPayslipLogoObjectUrl().then((url) => {
      if (cached.userId === userId) cached.url = url;
      return url;
    });
  }
  return cached.promise;
};

export default function useCompanyLogo() {
  const userId = getLoggedInUserId();
  const [logoUrl, setLogoUrl] = useState(() => (userId && cached.userId === userId ? cached.url : null));

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    loadLogo(userId).then((url) => {
      if (!cancelled) setLogoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return logoUrl;
}
