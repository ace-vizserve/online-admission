import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (JSON.stringify(value) === JSON.stringify(debouncedValue)) return;

    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
