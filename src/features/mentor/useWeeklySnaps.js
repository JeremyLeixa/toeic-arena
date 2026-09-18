// Les instantanés hebdomadaires de l'élève (RPC my_weekly_snapshots, même appel que MentorGoalCard) en série
// d'estimations TOEIC datées (lib/planner.js snapshotSeries). Lus par la lettre du lundi (allure vers
// l'objectif, estimation de la semaine) et la Chronique (jalon « première estimation »).
// null tant qu'ils chargent ; [] en cas d'échec, LOGGÉ : la lettre et la Chronique se passent alors de ces
// deux phrases, elles ne bloquent jamais sur le réseau.
import { useEffect, useState } from "react";
import { supabase } from "../../supabase.js";
import { snapshotSeries } from "../../lib/planner.js";

export function useWeeklySnaps(u) {
  var [snaps, setSnaps] = useState(null);
  var name = u && u.name, cc = (u && u.classCode) || "visitor";
  useEffect(function () {
    if (!name) { setSnaps([]); return; }
    var live = true;
    supabase.rpc("my_weekly_snapshots", { p_name: name, p_class_code: cc, p_limit: 8, p_exclude_week_id: null })
      .then(function (r) {
        if (!live) return;
        if (r.error) { console.warn("[mentor] snapshots fetch failed:", r.error.message); setSnaps([]); return; }
        if (r.data && r.data.ok === false) { console.warn("[mentor] snapshots refused:", r.data.error); setSnaps([]); return; }
        setSnaps(snapshotSeries((r.data && r.data.snapshots) || []));
      }, function (e) {
        console.warn("[mentor] snapshots fetch threw:", e && e.message);
        if (live) setSnaps([]);
      });
    return function () { live = false; };
  }, [name, cc]);
  return snaps;
}
