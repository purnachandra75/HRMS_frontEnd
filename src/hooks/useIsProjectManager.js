import { useEffect, useState } from 'react';
import { getManagerStatus } from '../services/managerService';

// Whether the logged-in employee currently manages an active project - drives whether
// "My Team" navigation/dashboard entries appear at all. Starts false so nothing flashes into
// view before the check resolves; only becomes true once the backend confirms it.
export default function useIsProjectManager() {
  const [isProjectManager, setIsProjectManager] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getManagerStatus().then((result) => {
      if (!cancelled) setIsProjectManager(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isProjectManager;
}
