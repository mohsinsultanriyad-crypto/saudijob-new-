import { useEffect, useMemo, useRef, useState } from "react";
import JobCard from "../components/JobCard.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import EditModal from "../components/EditModal.jsx";
import { addView, deleteJob, getJobs, updateJob } from "../services/api.js";

const LS_CACHE_JOBS = "sj_cache_jobs_v1";
const LS_VIEWED = "sj_viewed";

function removeJobFromLocalStorageList(key, jobId) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    const next = (arr || []).filter((x) => (x?._id || x?.id || x?.jobId) !== jobId);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

export default function AllJobs({ cities, roles, onAlertNewJobs, onJobDeleted }) {
  const [query, setQuery] = useState("");
  const [filterCity, setFilterCity] = useState("All");
  const [filterRole, setFilterRole] = useState("All");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const limit = 20;
  const skipRef = useRef(0);
  const hasMore = useMemo(() => items.length < total, [items.length, total]);

  // load cached first
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(LS_CACHE_JOBS) || "null");
      if (cached?.items?.length) {
        setItems(cached.items);
        setTotal(cached.total || cached.items.length);
      }
    } catch {}
  }, []);

  async function loadFirst() {
    try {
      setLoading(true);
      skipRef.current = 0;

      const data = await getJobs({
        limit,
        skip: 0,
        city: filterCity,
        role: filterRole,
        q: query.trim(),
      });

      setItems(data.items || []);
      setTotal(data.total || 0);
      skipRef.current = (data.items || []).length;

      localStorage.setItem(
        LS_CACHE_JOBS,
        JSON.stringify({ items: data.items || [], total: data.total || 0 })
      );

      onAlertNewJobs?.(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      const data = await getJobs({
        limit,
        skip: skipRef.current,
        city: filterCity,
        role: filterRole,
        q: query.trim(),
      });

      const next = [...items, ...(data.items || [])];
      setItems(next);
      setTotal(data.total || total);
      skipRef.current = next.length;

      localStorage.setItem(
        LS_CACHE_JOBS,
        JSON.stringify({ items: next, total: data.total || total })
      );

      onAlertNewJobs?.(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(loadFirst, 350);
    return () => clearTimeout(t);
  }, [query, filterCity, filterRole]);

  const bottomRef = useRef(null);
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "300px", threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, items.length, total]);

  async function openJob(job) {
    setSelectedJob(job);
    setDetailsOpen(true);

    try {
      if (job?._id) await addView(job._id);

      setItems((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, views: (j.views || 0) + 1 } : j
        )
      );
      setSelectedJob((prev) =>
        prev ? { ...prev, views: (prev.views || 0) + 1 } : prev
      );

      const viewed = (() => {
        try {
          return JSON.parse(localStorage.getItem(LS_VIEWED) || "[]");
        } catch {
          return [];
        }
      })();

      const exists = viewed.some((x) => x._id === job._id);
      const nextViewed = exists ? viewed : [job, ...viewed].slice(0, 200);
      localStorage.setItem(LS_VIEWED, JSON.stringify(nextViewed));
    } catch (e) {
      console.error(e);
    }
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelectedJob(null);
  }

  // ✅ DELETE (with best cleanup)
  async function handleDelete() {
    if (!selectedJob) return;
    const em = prompt("Enter email to confirm delete (same posting email):");
    if (!em) return;

    try {
      await deleteJob(selectedJob._id, em.trim());

      const deletedId = selectedJob._id;

      // 1) Tell parent to clean Alerts / Viewed screens
      onJobDeleted?.(deletedId);

      // 2) Remove from current list instantly
      setItems((prev) => prev.filter((j) => j._id !== deletedId));

      // 3) Remove from Viewed localStorage (important)
      removeJobFromLocalStorageList(LS_VIEWED, deletedId);

      // 4) Remove from cache too (so it doesn't come back on reload)
      removeJobFromLocalStorageList(LS_CACHE_JOBS, deletedId);
      // Note: LS_CACHE_JOBS stores object {items,total}, so we handle separately:
      try {
        const cached = JSON.parse(localStorage.getItem(LS_CACHE_JOBS) || "null");
        if (cached?.items?.length) {
          const nextItems = cached.items.filter((j) => j._id !== deletedId);
          localStorage.setItem(
            LS_CACHE_JOBS,
            JSON.stringify({ items: nextItems, total: Math.max(0, (cached.total || nextItems.length) - 1) })
          );
        }
      } catch {}

      closeDetails();
      alert("Job deleted.");
    } catch (e) {
      console.error(e);
      alert("Delete failed. Email mismatch or error.");
    }
  }

  async function handleEditSave(emailVerify, payload) {
    try {
      const updated = await updateJob(selectedJob._id, emailVerify, payload);
      setEditOpen(false);
      setSelectedJob(updated);
      await loadFirst();
      alert("Job updated.");
    } catch (e) {
      console.error(e);
      alert("Update failed. Email mismatch or error.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-extrabold">Explore Jobs</div>

        {/* ✅ Refresh icon (no "R") */}
        <button
          onClick={loadFirst}
          className="h-12 w-12 rounded-full border bg-white flex items-center justify-center font-extrabold"
          title="Refresh"
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex-1 bg-gray-50 border rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-gray-400 font-extrabold">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Role, city, company"
            className="bg-transparent outline-none w-full font-semibold"
          />
        </div>

        {/* ✅ Filter icon (no "F") */}
        <div
          className="w-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center font-extrabold text-green-700"
          title="Filters"
          aria-label="Filters"
        >
          ≡
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 border rounded-2xl px-3 py-2">
          <div className="text-[10px] font-extrabold text-gray-300 tracking-widest">
            CITY
          </div>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="w-full bg-transparent outline-none font-bold text-gray-700"
          >
            <option>All</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 border rounded-2xl px-3 py-2">
          <div className="text-[10px] font-extrabold text-gray-300 tracking-widest">
            ROLE
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-transparent outline-none font-bold text-gray-700"
          >
            <option>All</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 border rounded-2xl py-6 text-center text-gray-400 font-extrabold">
        ADVERTISEMENT PLACEHOLDER
      </div>

      <div className="mt-5 space-y-4">
        {loading && <div className="text-gray-400 font-extrabold">Loading...</div>}
        {!loading && items.length === 0 && (
          <div className="text-gray-400 font-extrabold">No jobs found.</div>
        )}

        {items.map((job) => (
          <JobCard key={job._id} job={job} onOpen={openJob} />
        ))}

        <div ref={bottomRef} />

        {loadingMore && (
          <div className="text-gray-400 font-extrabold">Loading more...</div>
        )}
        {!loading && !loadingMore && !hasMore && items.length > 0 && (
          <div className="text-gray-300 font-extrabold text-center py-4">
            End of list
          </div>
        )}
      </div>

      <DetailsModal
        open={detailsOpen}
        job={selectedJob}
        onClose={closeDetails}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
      />

      <EditModal
        open={editOpen}
        job={selectedJob}
        cities={cities}
        roles={roles}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  );
}
