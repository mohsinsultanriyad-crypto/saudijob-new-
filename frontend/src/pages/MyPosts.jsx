import { useEffect, useRef, useState } from "react";
import JobCard from "../components/JobCard.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import EditModal from "../components/EditModal.jsx";
import { deleteJob, getMyPosts, updateJob } from "../services/api.js";

export default function MyPosts({ cities, roles }) {
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const limit = 20;
  const skipRef = useRef(0);

  async function loadFirst(em) {
    if (!em) return;
    try {
      setLoading(true);
      skipRef.current = 0;

      const data = await getMyPosts({ email: em, limit, skip: 0 });
      setItems(data.items || []);
      setTotal(data.total || 0);
      skipRef.current = (data.items || []).length;
    } catch (e) {
      console.error(e);
      alert("Could not load posts. Check email.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    if (items.length >= total) return;
    try {
      setLoadingMore(true);
      const data = await getMyPosts({ email: verifiedEmail, limit, skip: skipRef.current });
      const next = [...items, ...(data.items || [])];
      setItems(next);
      setTotal(data.total || total);
      skipRef.current = next.length;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (verifiedEmail) loadFirst(verifiedEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedEmail]);

  function openJob(job) {
    setSelectedJob(job);
    setDetailsOpen(true);
  }

  async function handleDelete() {
    if (!selectedJob) return;
    try {
      await deleteJob(selectedJob._id, verifiedEmail);
      setDetailsOpen(false);
      await loadFirst(verifiedEmail);
      alert("Job deleted.");
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  }

  async function handleEditSave(emailVerify, payload) {
    try {
      const updated = await updateJob(selectedJob._id, emailVerify, payload);
      setEditOpen(false);
      setSelectedJob(updated);
      await loadFirst(verifiedEmail);
      alert("Job updated.");
    } catch (e) {
      console.error(e);
      alert("Update failed.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="text-3xl font-extrabold">My Posts</div>
      <div className="text-gray-500 font-semibold mt-1">Enter your posting email to manage jobs</div>

      <div className="mt-5 bg-gray-50 border rounded-2xl px-4 py-3">
        <div className="text-xs font-extrabold text-gray-300 tracking-widest">EMAIL</div>
        <div className="mt-2 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="same email used in posting"
            className="flex-1 outline-none bg-transparent font-semibold"
          />
          <button
            onClick={() => setVerifiedEmail(email.trim().toLowerCase())}
            className="px-4 rounded-xl bg-green-600 text-white font-extrabold"
          >
            Load
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading && <div className="text-gray-400 font-extrabold">Loading...</div>}
        {!loading && verifiedEmail && items.length === 0 && (
          <div className="text-gray-400 font-extrabold">No jobs found for this email.</div>
        )}

        {items.map((job) => <JobCard key={job._id} job={job} onOpen={openJob} />)}

        {!loading && verifiedEmail && items.length < total && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full bg-gray-50 border rounded-2xl py-3 font-extrabold text-gray-700 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      <DetailsModal
        open={detailsOpen}
        job={selectedJob}
        onClose={() => setDetailsOpen(false)}
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
