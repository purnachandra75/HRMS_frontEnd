import { useEffect, useState } from 'react';
import { getEmployeeById } from '../services/employeeService';

const CACHE_KEY = 'employee-code';

const readCache = (empId) => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return cached && String(cached.empId) === String(empId) ? cached.code : null;
  } catch {
    return null;
  }
};

const writeCache = (empId, code) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ empId, code }));
  } catch {
    // Storage unavailable - just refetch next time.
  }
};

// The client-assigned Employee ID (e.g. "EMP001") for the given internal employee id, for
// display - the internal id is only a database key. Cached per id for the browser session.
export default function useEmployeeCode(empId) {
  const [code, setCode] = useState(() => (empId ? readCache(empId) : null));

  useEffect(() => {
    if (!empId) return undefined;
    const cached = readCache(empId);
    if (cached) {
      setCode(cached);
      return undefined;
    }
    let cancelled = false;
    getEmployeeById(empId)
      .then((employee) => {
        const value = employee?.employeeId ? String(employee.employeeId) : null;
        if (cancelled || !value) return;
        writeCache(empId, value);
        setCode(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [empId]);

  return code;
}
