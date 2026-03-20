// hooks/useToast.js
// Global toast notification system — call from anywhere in the app.
//
// USAGE:
//   import { useToast } from "./hooks/useToast";
//   const { toast } = useToast();
//   toast.error("GPS failed to load");
//   toast.success("Location saved");
//   toast.warn("Poor GPS accuracy");
//   toast.info("Tracking started");

import { useEffect, useRef, useState } from "react";

// ── Singleton event bus ───────────────────────────────────────────────────────
const listeners = new Set();
let toastId = 0;

function emit(toast) {
  listeners.forEach((fn) => fn(toast));
}

// ── Public API — call these anywhere (no hook needed) ─────────────────────────
export const toast = {
  success: (message, opts) => emit({ id: ++toastId, type: "success", message, ...opts }),
  error:   (message, opts) => emit({ id: ++toastId, type: "error",   message, ...opts }),
  warn:    (message, opts) => emit({ id: ++toastId, type: "warn",    message, ...opts }),
  info:    (message, opts) => emit({ id: ++toastId, type: "info",    message, ...opts }),
};

// ── Hook for components that also need toast ──────────────────────────────────
export function useToast() {
  return { toast };
}

// ── ToastContainer — mount ONCE at app root ───────────────────────────────────
const ICONS = {
  success: "✓",
  error:   "✕",
  warn:    "⚠",
  info:    "ℹ",
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", bar: "#22c55e", text: "#14532d" },
  error:   { bg: "#fff1f2", border: "#fda4af", icon: "#dc2626", bar: "#ef4444", text: "#7f1d1d" },
  warn:    { bg: "#fffbeb", border: "#fcd34d", icon: "#d97706", bar: "#f59e0b", text: "#78350f" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", bar: "#3b82f6", text: "#1e3a8a" },
};

const DURATION = 4500; // ms

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, { ...t, visible: true }]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, visible: false } : x))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, 380);
      }, DURATION);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const dismiss = (id) => {
    setToasts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, visible: false } : x))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 380);
  };

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); max-height: 100px; margin-bottom: 10px; }
          to   { opacity: 0; transform: translateX(110%); max-height: 0;   margin-bottom: 0;  }
        }
        @keyframes toastBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-item {
          animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .toast-item.hiding {
          animation: toastOut 0.38s ease-in forwards;
        }
      `}</style>

      <div style={{
        position:  "fixed",
        top:       20,
        right:     20,
        zIndex:    99999,
        display:   "flex",
        flexDirection: "column",
        gap:       10,
        maxWidth:  360,
        width:     "calc(100vw - 40px)",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              className={`toast-item${t.visible ? "" : " hiding"}`}
              style={{
                background:   c.bg,
                border:       `1px solid ${c.border}`,
                borderRadius: 12,
                boxShadow:    "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
                overflow:     "hidden",
                pointerEvents: "all",
                cursor:       "pointer",
              }}
              onClick={() => dismiss(t.id)}
            >
              {/* Content */}
              <div style={{
                display:    "flex",
                alignItems: "flex-start",
                gap:        10,
                padding:    "13px 14px 10px",
              }}>
                {/* Icon badge */}
                <div style={{
                  width:        28,
                  height:       28,
                  borderRadius: "50%",
                  background:   c.icon,
                  color:        "#fff",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  fontSize:     13,
                  fontWeight:   800,
                  flexShrink:   0,
                  marginTop:    1,
                }}>
                  {ICONS[t.type]}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.title && (
                    <div style={{
                      fontSize:   13,
                      fontWeight: 700,
                      color:      c.text,
                      marginBottom: 2,
                      lineHeight: 1.3,
                    }}>
                      {t.title}
                    </div>
                  )}
                  <div style={{
                    fontSize:   13,
                    color:      c.text,
                    opacity:    t.title ? 0.8 : 1,
                    lineHeight: 1.45,
                    wordBreak:  "break-word",
                  }}>
                    {t.message}
                  </div>
                </div>

                {/* Close */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                  style={{
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    color:      c.icon,
                    opacity:    0.6,
                    fontSize:   16,
                    lineHeight: 1,
                    padding:    "0 2px",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Progress bar */}
              <div style={{
                height:     3,
                background: `${c.bar}30`,
              }}>
                <div style={{
                  height:           "100%",
                  background:       c.bar,
                  animation:        `toastBar ${DURATION}ms linear forwards`,
                  transformOrigin:  "left",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}