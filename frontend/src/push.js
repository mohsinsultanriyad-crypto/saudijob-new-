import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { api } from "./services/api";

const VAPID_KEY = "PASTE_YOUR_VAPID_PUBLIC_KEY_HERE";

export async function enablePushNotifications(selectedRoles) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Allow notifications");
    return;
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  if (!token) {
    alert("Token error");
    return;
  }

  await api.post("/api/push/register", {
    token,
    roles: selectedRoles
  });

  alert("Notifications Enabled");
}
