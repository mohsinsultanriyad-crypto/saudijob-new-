import { NavLink } from "react-router-dom";

function Item({ to, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex-1 py-3 flex flex-col items-center gap-1 relative",
          isActive ? "text-green-600" : "text-gray-400"
        ].join(" ")
      }
    >
      <div className="text-[11px] font-extrabold tracking-wide">{label}</div>

      {badge > 0 && (
        <div className="absolute top-2 right-6 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
          {badge}
        </div>
      )}
    </NavLink>
  );
}

export default function BottomNav({ alertList }) {
  // ✅ Only count unseen alerts
  const unseenCount = (alertList || []).filter(a => a.seen !== true).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="max-w-md mx-auto flex">
        <Item to="/" label="ALL JOBS" badge={0} />
        <Item to="/post" label="POST JOB" badge={0} />
        <Item to="/alerts" label="ALERTS" badge={unseenCount} />
        <Item to="/viewed" label="VIEWED" badge={0} />
        <Item to="/my-posts" label="MY POSTS" badge={0} />
      </div>
    </div>
  );
}
