import { motion } from "framer-motion";

function normalizePhoneForWA(phoneRaw) {
  const p = String(phoneRaw || "").trim().replace(/[^\d+]/g, "");
  if (!p) return "";
  if (p.startsWith("0") && p.length === 10) return "966" + p.slice(1);
  if (p.startsWith("+")) return p.slice(1);
  return p;
}

function makeWhatsAppLink(job) {
  const phone = normalizePhoneForWA(job.phone);
  const text = `Hello, I am interested in ${job.jobRole} job in ${job.city}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function DetailsModal({ open, job, onClose, onEdit, onDelete }) {
  if (!open || !job) return null;

  const waLink = makeWhatsAppLink(job);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold">Job Details</div>
          <button onClick={onClose} className="text-2xl text-gray-400">×</button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-3xl font-extrabold">{job.jobRole}</div>
          {!!job.urgentActive && (
            <div className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-extrabold">
              URGENT (24H)
            </div>
          )}
        </div>

        <div className="mt-2 inline-flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-green-700 font-bold">
          {job.city}
        </div>

        <div className="mt-3 text-gray-400 text-sm font-bold">
          Views: {job.views || 0}
        </div>

        <div className="mt-5">
          <div className="text-gray-400 font-extrabold tracking-widest text-sm">DESCRIPTION</div>
          <div className="mt-2 text-gray-700">{job.description}</div>
        </div>

        <div className="mt-5 bg-gray-50 border rounded-2xl p-4">
          <div className="font-extrabold text-gray-700">Contact</div>
          <div className="mt-3 space-y-2 text-gray-700">
            <div><span className="text-gray-400 font-extrabold">Posted by:</span> {job.companyName || job.name}</div>
            <div><span className="text-gray-400 font-extrabold">Phone:</span> {job.phone}</div>
            <div><span className="text-gray-400 font-extrabold">Email:</span> {job.email}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onEdit}
            className="w-full bg-gray-50 border text-gray-800 font-extrabold py-3 rounded-2xl"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="w-full bg-red-50 border border-red-100 text-red-600 font-extrabold py-3 rounded-2xl"
          >
            Remove
          </button>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block w-full text-center bg-green-600 text-white font-extrabold py-4 rounded-2xl"
        >
          Apply on WhatsApp
        </a>

        <a
          href={`tel:${job.phone}`}
          className="mt-3 block w-full text-center bg-green-50 border border-green-100 text-green-700 font-extrabold py-4 rounded-2xl"
        >
          Call Now
        </a>
      </motion.div>
    </div>
  );
}
