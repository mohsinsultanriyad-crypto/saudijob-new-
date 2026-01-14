const KEY = "sj_alerts";

export function loadAlerts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAlerts(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addAlertJob(job) {
  const list = loadAlerts();

  // already exists?
  if (list.some((x) => x._id === job._id)) return;

  list.unshift({
    ...job,
    seen: false,
    savedAt: Date.now(),
  });

  saveAlerts(list);
}

export function markAlertSeen(id) {
  const list = loadAlerts().map((x) =>
    x._id === id ? { ...x, seen: true } : x
  );
  saveAlerts(list);
}

export function removeAlert(id) {
  const list = loadAlerts().filter((x) => x._id !== id);
  saveAlerts(list);
}

export function unseenCount() {
  return loadAlerts().filter((x) => !x.seen).length;
}