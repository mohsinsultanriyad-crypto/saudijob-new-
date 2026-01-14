import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-3">
      <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl px-4 py-3 font-extrabold text-sm">
        You are offline. Showing last saved jobs if available.
      </div>
    </div>
  );
}
