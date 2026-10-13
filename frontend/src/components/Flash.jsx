import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Short success or error messages shown at the top of the page.
const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [flash, setFlash] = useState(null);

  const showFlash = useCallback((text, type = "success") => setFlash({ text, type, id: Date.now() }), []);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  return (
    <FlashContext.Provider value={showFlash}>
      {flash && <div className={`notice ${flash.type}`} key={flash.id}>{flash.text}</div>}
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const context = useContext(FlashContext);
  if (!context) throw new Error("useFlash must be used inside FlashProvider");
  return context;
}
