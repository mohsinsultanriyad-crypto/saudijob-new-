import { useEffect, useMemo, useState } from "react";
import JobCard from "../components/JobCard.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import { getJobs } from "../services/api.js";
import useJobAlerts from "../hooks/useJobAlerts";
import { enablePushNotifications } from "../push";

export default function Alerts({
  roles,              // ✅ prop roles list (Helper, Plumber, etc.)
  alertPref,
  setAlertPref,
  alertList,
  setAlertList
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const selectedRoles = alertPref?.roles || [];
  const alerts = useMemo(() => alertList || [], [alertList]);

  // ✅ Start alerts engine (polling + store + browser notification)
  useJobAlerts(selectedRoles, setAlertList);

  // ✅ persist selected roles (so refresh ke baad bhi on rahe)
  useEffect(() => {
    localStorage.setItem("sj_roles", JSON.stringify(selectedRoles));
  }, [selectedRoles]);

  function toggleRole(role) {
    const norm = String(role).trim(); // keep same display value
    const cur = selectedRoles;
    const next = cur.includes(norm) ? cur.filter((x) => x !== norm) : [...cur, norm];
    setAlertPref({ roles: next });
  }

  function clearAlerts() {
    if (!confirm("Clear all alerts?")) return;
    setAlertList([]);
  }

  // ✅ Mark alert as seen when opening job
  function markAlertSeen(jobId) {
    setAlertList((prev) =>
      (prev || []).map((a) => (a.jobId === jobId ? { ...a, seen: true } : a))
    );
  }

  function openJob(job) {
    if (job?._id) markAlertSeen(job._id);
    setSelectedJob(job);
    setDetailsOpen(true);
  }

  // ✅ Auto-clean: remove deleted/expired jobs from alerts
  useEffect(() => {
    let cancelled = false;

    async function syncClean() {
      try {
        setSyncing(true);
        const data = await getJobs({ limit: 300, skip: 0, city: "All", role: "All", q: "" });
        const aliveIds = new Set((data?.items || []).map((j) => j?._id).filter(Boolean));
        if (cancelled) return;
        setAlertList((prev) => (prev || []).filter((a) => aliveIds.has(a.jobId)));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    syncClean();
    const t = setInterval(syncClean, 90000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [setAlertList]);

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-extrabold">Alerts</div>
          <div className="text-gray-500 font-semibold mt-1">
            Select roles to receive new job alerts{syncing ? " • Syncing..." : ""}
          </div>
        </div>

        <button
          onClick={clearAlerts}
          className="h-11 px-4 rounded-2xl bg-gray-50 border font-extrabold text-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="mt-5 bg-gray-50 border rounded-2xl p-4">
        <div className="text-xs font-extrabold text-gray-300 tracking-widest">
          ROLES (MULTI SELECT)
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(roles || []).map((r) => {
            const active = selectedRoles.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className={[
                  "px-3 py-2 rounded-full border text-sm font-extrabold",
                  active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600",
                ].join(" ")}
              >
                {r}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-gray-400 font-semibold">
          Alerts work inside the app. Keep the app open to receive updates.
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {alerts.length === 0 && (
          <div className="text-gray-400 font-extrabold">
            No alerts yet. Select roles and wait for new jobs.
          </div>
        )}

        {alerts.map((a) => {
          const job = a.jobSnapshot;
          return <JobCard key={a.id} job={job} onOpen={openJob} />;
        })}
      </div>

      <DetailsModal
        open={detailsOpen}
        job={selectedJob}
        onClose={() => setDetailsOpen(false)}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}
