"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync(); window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  if (!offline) return null;
  return <div role="status" className="fixed top-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xl"><WifiOff size={16} />Nema internet veze</div>;
}
