import { useEffect, useMemo, useState } from "react";
import JobCard from "../components/JobCard.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import { getJobs } from "../services/api.js";

const LS_VIEWED = "sj_viewed";

function readViewed() {
  try {
    const raw = localStorage.getItem(LS_VIEWED);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeViewed(arr) {
  try {
    localStorage.setItem(LS_VIEWED, JSON.stringify(arr));
  } catch {}
}

export default function Viewed() {
  const [items, setItems] = useState(() => readViewed());
  const [syncing, setSyncing] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const list = useMemo(() => items || [], [items]);

  // Reload from localStorage whenever this page mounts
  useEffect(() => {
    setItems(readViewed());
  }, []);

  // Auto-clean: remove deleted/expired jobs by checking server list
  useEffect(() => {
    let cancelled = false;

    async function syncClean() {
      try {
        setSyncing(true);

        // Fetch a big chunk of latest jobs (enough for normal use)
        const data = await getJobs({ limit: 300, skip: 0, city: "All", role: "All", q: "" });
        const aliveIds = new Set((data?.items || []).map((j) => j?._id).filter(Boolean));

        const current = readViewed();

        // Keep only viewed jobs that still exist on server
        const cleaned = current.filter((v) => aliveIds.has(v?._id));

        if (!cancelled) {
          // Update storage + UI
          writeViewed(cleaned);
          setItems(cleaned);
        }
      } catch {
        // Offline: do nothing (keep local list)
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    syncClean();

    return () => {
      cancelled = true;
    };
  }, []);

  function openJob(job) {
    setSelectedJob(job);
    setDetailsOpen(true);
  }

  function clearViewed() {
    if (!confirm("Clear viewed jobs on this device?")) return;
    writeViewed([]);
    setItems([]);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-extrabold">Viewed Jobs</div>
          <div className="text-gray-500 font-semibold mt-1">
            Stored on this device
            {syncing ? " • Syncing..." : ""}
          </div>
        </div>

        <button
          onClick={clearViewed}
          className="h-11 px-4 rounded-2xl bg-gray-50 border font-extrabold text-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {list.length === 0 && (
          <div className="text-gray-400 font-extrabold">No viewed jobs yet.</div>
        )}

        {list.map((job) => (
          <JobCard key={job._id} job={job} onOpen={openJob} />
        ))}
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
