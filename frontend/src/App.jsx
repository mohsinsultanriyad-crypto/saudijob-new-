import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";

import AllJobs from "./pages/AllJobs.jsx";
import PostJob from "./pages/PostJob.jsx";
import Viewed from "./pages/Viewed.jsx";
import MyPosts from "./pages/MyPosts.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Alerts from "./pages/Alerts.jsx";

import { getJobs } from "./services/api.js";

// Lists
const cities = [
  "Riyadh","Jeddah","Dammam","Khobar","Jubail","Mecca","Medina","Taif",
  "Tabuk","Hail","Abha","Jazan","Najran","Al Ahsa"
];

const roles = [
  "Helper","Multi Welder","Pipe Fitter","Electrician","Plumber","Painter",
  "Scaffolder","Safety Officer","Supervisor","Driver"
];

// LocalStorage keys
const LS_ALERT_PREF = "sj_alert_pref_v1";
const LS_ALERT_LIST = "sj_alert_list_v1";
const LS_SEEN_JOB_IDS = "sj_seen_job_ids_v1";
const LS_VIEWED = "sj_viewed"; // ✅ your Viewed key

function safeJsonParse(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const raw = localStorage.getItem(key);
  const arr = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(arr) ? arr : [];
}

function writeArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

export default function App() {
  // Alert preferences
  const [alertPref, setAlertPref] = useState(() => {
    const saved = localStorage.getItem(LS_ALERT_PREF);
    return saved ? safeJsonParse(saved, { roles: ["Helper"] }) : { roles: ["Helper"] };
  });

  // Alert list (cards)
  const [alertList, setAlertList] = useState(() => {
    const saved = localStorage.getItem(LS_ALERT_LIST);
    return saved ? safeJsonParse(saved, []) : [];
  });

  // Seen job ids (to avoid duplicates)
  const [seenIds, setSeenIds] = useState(() => {
    const saved = localStorage.getItem(LS_SEEN_JOB_IDS);
    return saved ? safeJsonParse(saved, []) : [];
  });

  // persist
  useEffect(() => {
    localStorage.setItem(LS_ALERT_PREF, JSON.stringify(alertPref));
  }, [alertPref]);

  useEffect(() => {
    localStorage.setItem(LS_ALERT_LIST, JSON.stringify(alertList));
  }, [alertList]);

  useEffect(() => {
    localStorage.setItem(LS_SEEN_JOB_IDS, JSON.stringify(seenIds));
  }, [seenIds]);

  const alertCount = useMemo(() => (alertList?.length || 0), [alertList]);

  /**
   * Best cleanup helper:
   * Removes a job from Alerts (state+storage) and Viewed (storage)
   * Use this after delete, and also can be called from other screens.
   */
  function cleanupJobEverywhere(jobId) {
    if (!jobId) return;

    // Alerts: state
    setAlertList((prev) => (prev || []).filter((a) => a.jobId !== jobId));

    // Alerts: storage
    try {
      const arr = readArray(LS_ALERT_LIST);
      const next = arr.filter((a) => a?.jobId !== jobId);
      writeArray(LS_ALERT_LIST, next);
    } catch {}

    // Viewed: storage
    try {
      const arrV = readArray(LS_VIEWED);
      const nextV = arrV.filter((v) => (v?._id || v?.jobId || v?.id) !== jobId);
      writeArray(LS_VIEWED, nextV);
    } catch {}
  }

  /**
   * Auto-clean (future-proof):
   * Checks server for alive job ids and removes deleted/expired from:
   * - Alerts list (state + storage)
   * - Viewed storage
   */
  async function syncCleanFromServer() {
    try {
      const data = await getJobs({ limit: 300, skip: 0, city: "All", role: "All", q: "" });
      const aliveIds = new Set((data?.items || []).map((j) => j?._id).filter(Boolean));

      // Alerts: state
      setAlertList((prev) => (prev || []).filter((a) => aliveIds.has(a.jobId)));

      // Alerts: storage
      try {
        const arr = readArray(LS_ALERT_LIST);
        const next = arr.filter((a) => aliveIds.has(a?.jobId));
        writeArray(LS_ALERT_LIST, next);
      } catch {}

      // Viewed: storage
      try {
        const arrV = readArray(LS_VIEWED);
        const nextV = arrV.filter((v) => aliveIds.has(v?._id || v?.jobId || v?.id));
        writeArray(LS_VIEWED, nextV);
      } catch {}
    } catch {
      // offline ignore
    }
  }

  // Core function: push matching jobs to alerts
  function onAlertNewJobs(newJobs) {
    const selectedRoles = (alertPref?.roles || []).map((x) => String(x).toLowerCase());
    if (!selectedRoles.length) return;
    if (!Array.isArray(newJobs) || !newJobs.length) return;

    const seen = new Set(seenIds);
    const existingAlertJobIds = new Set((alertList || []).map((a) => a.jobId));

    const fresh = [];

    for (const j of newJobs) {
      const id = j?._id;
      if (!id) continue;

      // mark as seen
      if (!seen.has(id)) seen.add(id);

      // avoid duplicates
      if (existingAlertJobIds.has(id)) continue;

      // match role
      const role = String(j.jobRole || "").toLowerCase();
      const match = selectedRoles.some((r) => role.includes(r));
      if (!match) continue;

      fresh.push({
        id: `${Date.now()}_${id}`,
        jobId: id,
        jobSnapshot: j,
        createdAt: new Date().toISOString()
      });
    }

    if (fresh.length) {
      setAlertList((prev) => [...fresh, ...(prev || [])].slice(0, 300));
    }

    // update seen list (limit size)
    const nextSeen = Array.from(seen).slice(-2000);
    setSeenIds(nextSeen);
  }

  // Background polling (alerts)
  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const data = await getJobs({ limit: 30, skip: 0, city: "All", role: "All", q: "" });
        if (stopped) return;
        const items = data?.items || [];
        onAlertNewJobs(items);
      } catch {
        // offline ignore
      }
    }

    poll();
    const t = setInterval(poll, 25000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertPref, seenIds, alertList]);

  // ✅ Auto-clean loop (best protection)
  const cleanLock = useRef(false);
  useEffect(() => {
    async function runClean() {
      if (cleanLock.current) return;
      cleanLock.current = true;
      try {
        await syncCleanFromServer();
      } finally {
        cleanLock.current = false;
      }
    }

    // App start clean
    runClean();

    // Every 90 sec clean
    const t = setInterval(runClean, 90000);
    return () => clearInterval(t);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white pb-24">
        <Header />
        <OfflineBanner />

        <Routes>
          <Route
            path="/"
            element={
              <AllJobs
                cities={cities}
                roles={roles}
                onAlertNewJobs={onAlertNewJobs}
                onJobDeleted={cleanupJobEverywhere}  // ✅ for instant cleanup (we will add in AllJobs.jsx)
              />
            }
          />
          <Route path="/post" element={<PostJob cities={cities} roles={roles} />} />
          <Route
            path="/alerts"
            element={
              <Alerts
                roles={roles}
                alertPref={alertPref}
                setAlertPref={setAlertPref}
                alertList={alertList}
                setAlertList={setAlertList}
              />
            }
          />
          <Route path="/viewed" element={<Viewed />} />
          <Route path="/my-posts" element={<MyPosts cities={cities} roles={roles} />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>

        <BottomNav alertList={alertList} />
      </div>
    </BrowserRouter>
  );
}
