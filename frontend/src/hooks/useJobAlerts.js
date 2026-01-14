import { useEffect, useRef } from "react";
import { getJobs } from "../services/api";

const LAST_KEY = "sj_last_job_time";

function getLastTime() {
  return Number(localStorage.getItem(LAST_KEY) || 0);
}
function setLastTime(t) {
  localStorage.setItem(LAST_KEY, String(t));
}

function normalize(x) {
  return String(x || "").trim().toLowerCase();
}

export default function useJobAlerts(selectedRoles, setAlertList) {
  const rolesRef = useRef(selectedRoles || []);

  useEffect(() => {
    rolesRef.current = selectedRoles || [];
  }, [selectedRoles]);

  useEffect(() => {
    if (!setAlertList) return;

    const timer = setInterval(async () => {
      const wanted = (rolesRef.current || []).map(normalize);
      if (wanted.length === 0) return;

      try {
        const data = await getJobs({ limit: 50, skip: 0 });
        const items = data?.items || [];

        const last = getLastTime();

        const matches = items.filter((j) => {
          const t = new Date(j.createdAt).getTime();
          const role = normalize(j.jobRole);
          return t > last && wanted.includes(role);
        });

        if (!matches.length) return;

        const maxT = Math.max(...matches.map((j) => new Date(j.createdAt).getTime()));
        setLastTime(maxT);

        setAlertList((prev) => {
          const list = prev || [];
          const existing = new Set(list.map((a) => a.jobId));
          const add = [];

          for (const job of matches) {
            if (existing.has(job._id)) continue;

            add.push({
              id: job._id,
              jobId: job._id,
              jobSnapshot: job,
              seen: false,
              savedAt: Date.now()
            });
          }

          return add.length ? [...add, ...list] : list;
        });
      } catch {}
    }, 15000);

    return () => clearInterval(timer);
  }, [setAlertList]);
}
