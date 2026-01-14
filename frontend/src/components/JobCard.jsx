export default function JobCard({ job, onOpen }) {
  const date = (() => {
    try {
      const d = new Date(job.createdAt);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  })();

  const urgentActive = !!job.urgentActive;

  return (
    <button
      onClick={() => onOpen(job)}
      className={[
        "w-full text-left rounded-2xl border shadow-sm p-4 hover:shadow transition",
        urgentActive ? "border-red-300 bg-red-50" : "bg-white"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xl font-extrabold">{job.jobRole}</div>
        <div className="flex items-center gap-2">
          {urgentActive && (
            <div className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-extrabold">
              URGENT
            </div>
          )}
          <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-bold">
            {date}
          </div>
        </div>
      </div>

      <div className="mt-2 text-gray-600 font-bold">City: {job.city}</div>
      <div className="mt-1 text-gray-500">Posted by: {job.companyName || job.name}</div>
      <div className="mt-2 text-gray-400 text-sm font-bold">Views: {job.views || 0}</div>

      <div className="mt-3 text-green-600 font-extrabold text-sm text-right">
        View Details
      </div>
    </button>
  );
}
