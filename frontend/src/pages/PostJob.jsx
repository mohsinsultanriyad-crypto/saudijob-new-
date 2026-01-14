import { useState } from "react";
import { createJob } from "../services/api.js";

function Field({ label, children, tall }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-gray-300 tracking-widest">{label}</div>
      <div className={["mt-2 bg-gray-50 border rounded-2xl px-4 flex items-center gap-2", tall ? "py-4" : "py-3"].join(" ")}>
        {children}
      </div>
    </div>
  );
}

export default function PostJob({ cities, roles }) {
  const [posting, setPosting] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [jobRole, setJobRole] = useState("Helper");
  const [description, setDescription] = useState("");

  async function handlePost() {
    if (!name || !phone || !email || !city || !jobRole || !description) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setPosting(true);
      await createJob({ name, companyName, phone, email, city, jobRole, description, isUrgent });

      setIsUrgent(false);
      setName("");
      setCompanyName("");
      setPhone("");
      setEmail("");
      setCity("Riyadh");
      setJobRole("Helper");
      setDescription("");

      alert("Job posted successfully.");
    } catch (e) {
      console.error(e);
      alert("Post failed. Please check email format.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="text-3xl font-extrabold">Post a Job</div>
      <div className="text-gray-500 font-semibold mt-1">Hire talent across the Kingdom</div>

      <div className="mt-6 space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-red-600">Urgent Hiring</div>
            <div className="text-xs text-gray-500 font-semibold">Top and highlighted for 24 hours</div>
          </div>
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="h-6 w-6"
          />
        </div>

        <Field label="FULL NAME">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="w-full outline-none bg-transparent font-semibold" />
        </Field>

        <Field label="COMPANY NAME (OPTIONAL)">
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name"
            className="w-full outline-none bg-transparent font-semibold" />
        </Field>

        <Field label="PHONE NUMBER">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx"
            className="w-full outline-none bg-transparent font-semibold" />
        </Field>

        <Field label="EMAIL (FOR EDIT / DELETE)">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com"
            className="w-full outline-none bg-transparent font-semibold" />
        </Field>

        <Field label="CITY">
          <select value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full outline-none bg-transparent font-bold">
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="JOB ROLE">
          <select value={jobRole} onChange={(e) => setJobRole(e.target.value)}
            className="w-full outline-none bg-transparent font-bold">
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label="JOB DESCRIPTION" tall>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write job details"
            className="w-full outline-none bg-transparent h-28 resize-none font-semibold" />
        </Field>

        <button
          onClick={handlePost}
          disabled={posting}
          className="mt-2 w-full bg-green-600 text-white font-extrabold py-4 rounded-2xl shadow-lg disabled:opacity-60"
        >
          {posting ? "Publishing..." : "Publish Job"}
        </button>

        <div className="text-xs text-gray-400 font-semibold">Jobs are auto-removed after 7 days.</div>
      </div>
    </div>
  );
}
