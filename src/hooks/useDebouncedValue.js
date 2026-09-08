import { useEffect, useState } from 'react';

// Returns `value`, but updated only after `delayMs` has passed without `value` changing again -
// used to turn an as-you-type input into a debounced value safe to send to the backend.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default useDebouncedValue;
