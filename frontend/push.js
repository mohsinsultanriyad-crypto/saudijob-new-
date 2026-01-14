import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { api } from "./services/api";

const VAPID_KEY = "PASTE_YOUR_VAPID_PUBLIC_KEY_HERE";

export async function enablePushNotifications(selectedRoles) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Please allow notification permission");
    return;
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  if (!token) {
    alert("Token not generated");
    return;
  }

  await api.post("/api/push/register", {
    token,
    roles: selectedRoles
  });

  alert("Notifications enabled successfully");
}