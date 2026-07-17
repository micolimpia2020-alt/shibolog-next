import { C } from "../theme.js";

// 軽量SVG折れ線チャート
// series: [{ label, color, data: [{x:index, y:value}] }]（null値はスキップして線をつなぐ）
// refLine: { value, label, color }
export default function LineChart({ series, refLine, labels, height = 150 }) {
  const W = 340, H = height, PAD = { l: 34, r: 8, t: 12, b: 20 };
  const allY = series.flatMap(s => s.data.map(p => p.y)).filter(v => v != null && !isNaN(v));
  if (refLine?.value != null) allY.push(refLine.value);
  if (allY.length === 0) return <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 20 }}>データがまだありません</div>;
  let min = Math.min(...allY), max = Math.max(...allY);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1; min -= pad; max += pad;
  const n = Math.max(...series.map(s => s.data.length), 2);
  const px = i => PAD.l + (W - PAD.l - PAD.r) * (n > 1 ? i / (n - 1) : 0);
  const py = v => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - min) / (max - min));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {[0, 0.5, 1].map(f => {
        const v = min + (max - min) * f;
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={py(v)} y2={py(v)} stroke={C.dim} strokeWidth="1" />
            <text x={PAD.l - 4} y={py(v) + 3} textAnchor="end" fontSize="9" fill={C.muted}>{Math.round(v * 10) / 10}</text>
          </g>
        );
      })}
      {refLine?.value != null && (
        <g>
          <line x1={PAD.l} x2={W - PAD.r} y1={py(refLine.value)} y2={py(refLine.value)} stroke={refLine.color} strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={W - PAD.r} y={py(refLine.value) - 4} textAnchor="end" fontSize="9" fill={refLine.color} fontWeight="700">{refLine.label}</text>
        </g>
      )}
      {series.map((s, si) => {
        const pts = s.data.filter(p => p.y != null && !isNaN(p.y));
        if (!pts.length) return null;
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x)},${py(p.y)}`).join(" ");
        return (
          <g key={si}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
            {pts.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r="2.5" fill={s.color} />)}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        (n <= 10 || i % Math.ceil(n / 7) === 0) &&
        <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize="8" fill={C.muted}>{l}</text>
      ))}
    </svg>
  );
}
