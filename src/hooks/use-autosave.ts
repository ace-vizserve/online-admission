import { useEffect, useRef } from "react";

export function useAutoSave(
  setterFunc: (params: Record<string, unknown>) => void,
  data: Record<string, unknown>,
  delay: number
) {
  const prevDataRef = useRef<string>("");

  const serializedData = JSON.stringify(data);

  useEffect(() => {
    if (!data) return;
    if (prevDataRef.current == serializedData) return;

    const timeout = setTimeout(() => {
      try {
        setterFunc(data);

        prevDataRef.current = serializedData;

        console.log(`[useAutoSave] Saved `);
      } catch (error) {
        console.error("[useAutoSave] Failed to save:", error);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [data, delay, serializedData, setterFunc]);
}
