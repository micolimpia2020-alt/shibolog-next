import { C } from "../theme.js";
import { WD, weekOf, parseKey, dateKey } from "../lib/model.js";

export default function WeekStrip({ date, setDate, mode, markedDates }) {
  const today = dateKey();
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
      {weekOf(date).map((k, i) => {
        const sel = k === date;
        return (
          <button key={k} onClick={() => setDate(k)}
            style={{ flex: 1, border: "none", cursor: "pointer", background: sel ? C.card : "transparent", borderRadius: 12, padding: "8px 0", boxShadow: sel ? "0 1px 4px rgba(74,70,63,0.1)" : "none" }}>
            <div style={{ fontSize: 11, color: C.muted }}>{WD[i]}</div>
            <div style={{
              margin: "4px auto 0", width: 32, height: 32, lineHeight: "30px", borderRadius: "50%",
              border: `1.5px solid ${sel ? mode.accent : C.border}`, fontWeight: k === today ? 800 : 600,
              color: C.text, background: markedDates?.has(k) ? `${mode.accent}26` : "transparent", fontSize: 14,
            }}>{parseKey(k).getDate()}</div>
          </button>
        );
      })}
    </div>
  );
}
