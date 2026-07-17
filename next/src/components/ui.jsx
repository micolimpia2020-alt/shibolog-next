import { C } from "../theme.js";

// 円形プログレスリング
export function Ring({ size = 180, stroke = 12, ratio = 0, color = C.accent, children }) {
  const r = (size - stroke) / 2;
  const cir = 2 * Math.PI * r;
  const done = Math.max(0, Math.min(1, ratio));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.dim} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${cir * done} ${cir}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dasharray .4s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

export function MacroRing({ label, remain, unit = "g", color, size = 92 }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.muted }}>残り</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "2px 0" }}>
        {remain}<span style={{ fontSize: 12, fontWeight: 600 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

export function Sheet({ onClose, title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(40,35,25,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", background: C.bg, borderRadius: "20px 20px 0 0", padding: "16px 16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: C.dim, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: C.muted, fontSize: 15 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, color = C.muted, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

export function EstBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, border: `1px solid ${C.accent}66`, borderRadius: 6, padding: "2px 6px", marginLeft: 6 }}>AI推定</span>;
}
