import { useEffect, useState } from "react";

function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Online hone par kuch bhi nahi dikhega
  if (isOnline) {
    return null;
  }

  // Sirf offline hone par dikhega
  return (
    <div
      style={{
        position: "fixed",
        top: "15px",
        right: "15px",
        padding: "8px 14px",
        borderRadius: "20px",
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: "14px",
        fontWeight: "600",
        zIndex: 9999,
      }}
    >
      🔴 Offline
    </div>
  );
}

export default NetworkStatus;
