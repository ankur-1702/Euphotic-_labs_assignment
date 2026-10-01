import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const announce = useCallback((message, type = "info") => {
    window.clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { toast, announce };
}
