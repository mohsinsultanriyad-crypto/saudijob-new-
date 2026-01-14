import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function EditModal({ open, job, cities, roles, onClose, onSave }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (open && job) {
      setEmail("");
      setForm({
        name: job.name || "",
        companyName: job.companyName || "",
        phone: job.phone || "",
        city: job.city || "Riyadh",
        jobRole: job.jobRole || "Helper",
        description: job.description || "",
        isUrgent: !!job.isUrgent
      });
    }
  }, [open, job]);

  if (!open || !job || !form) return null;

  async function handleSave() {
    if (!email.trim()) return alert("Email is required (same posting email).");
    if (!form.name || !form.phone || !form.city || !form.jobRole || !form.description) {
      return alert("Please fill all fields.");
    }
    try {
      setSaving(true);
      await onSave(email.trim(), form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold">Edit Job</div>
          <button onClick={onClose} className="text-2xl text-gray-400">×</button>
        </div>

        <div className="mt-4 bg-gray-50 border rounded-2xl px-4 py-3">
          <div className="text-xs font-extrabold text-gray-300 tracking-widest">EMAIL (VERIFY)</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Same email used in posting"
            className="w-full outline-none bg-transparent font-semibold mt-2"
          />
        </div>

        <div className="mt-4 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-red-600">Urgent Hiring</div>
              <div className="text-xs text-gray-500 font-semibold">
                Top and highlighted for 24 hours
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.isUrgent}
              onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
              className="h-6 w-6"
            />
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">FULL NAME</div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full outline-none bg-transparent font-semibold mt-2"
            />
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">COMPANY NAME (OPTIONAL)</div>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full outline-none bg-transparent font-semibold mt-2"
            />
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">PHONE</div>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full outline-none bg-transparent font-semibold mt-2"
            />
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">CITY</div>
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full outline-none bg-transparent font-bold mt-2"
            >
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">JOB ROLE</div>
            <select
              value={form.jobRole}
              onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
              className="w-full outline-none bg-transparent font-bold mt-2"
            >
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 border rounded-2xl px-4 py-3">
            <div className="text-xs font-extrabold text-gray-300 tracking-widest">DESCRIPTION</div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full outline-none bg-transparent h-28 resize-none font-semibold mt-2"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white font-extrabold py-4 rounded-2xl shadow-lg disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
