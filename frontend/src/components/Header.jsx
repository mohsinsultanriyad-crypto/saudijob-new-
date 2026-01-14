import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const loc = useLocation();
  const onLegal = loc.pathname === "/privacy" || loc.pathname === "/terms";

  return (
    <div className="sticky top-0 z-40 bg-white border-b">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-extrabold">
            S
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold">
              SAUDI <span className="text-green-600">JOB</span>{" "}
              <span className="text-xs font-semibold text-gray-400 tracking-widest">
                KINGDOM OF SAUDI ARABIA
              </span>
            </div>
          </div>
        </div>

        {!onLegal && (
          <Link
            to="/privacy"
            className="text-xs font-extrabold text-gray-500 px-3 py-2 rounded-xl bg-gray-50 border"
          >
            Legal
          </Link>
        )}
      </div>
    </div>
  );
}
