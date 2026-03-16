import React, { useState, useEffect, useRef } from "react";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const savedRef = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - savedRef.current;
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      savedRef.current = elapsed;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!expanded) return;
    function handleOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [expanded]);

  function toggle() {
    setRunning((r) => !r);
  }
  function reset() {
    setRunning(false);
    setElapsed(0);
    savedRef.current = 0;
  }

  const isOverTime = elapsed >= 3600_000;

  return (
    <div ref={wrapperRef} className="gq-sw">
      <div className="gq-sw-pill" onClick={() => setExpanded((e) => !e)}>
        <span className={`gq-sw-dot${running ? " gq-sw-dot-running" : ""}`} />
        <span className={`gq-sw-time${isOverTime ? " gq-sw-overtime" : ""}`}>
          {formatTime(elapsed)}
        </span>
        <span className="gq-sw-chevron">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="gq-sw-panel">
          <div
            className={`gq-sw-display${isOverTime ? " gq-sw-overtime" : ""}`}
          >
            {formatTime(elapsed)}
          </div>
          <div className="gq-sw-controls">
            <button
              className={`gq-sw-btn ${running ? "gq-sw-btn-pause" : "gq-sw-btn-resume"}`}
              onClick={toggle}
            >
              {running ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button className="gq-sw-btn gq-sw-btn-reset" onClick={reset}>
              ↺ Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
