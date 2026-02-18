import { useState, useEffect, useCallback } from "react";

const SYMPTOMS = [
  { key: "backPain", label: "Back Pain", emoji: "🔙", type: "severity", subOptions: ["Upper", "Lower", "Full"] },
  { key: "fingerSkinPeeling", label: "Finger Skin Peeling", emoji: "🖐️", type: "grade", hasImageLinks: true },
  { key: "toeSkinPeeling", label: "Toe Skin Peeling", emoji: "🦶", type: "grade", hasImageLinks: true },
  { key: "chills", label: "Chills", emoji: "🥶", type: "severity" },
  { key: "fatigue", label: "Fatigue", emoji: "😴", type: "severity" },
  { key: "jointStiffness", label: "Joint Stiffness", emoji: "🦴", type: "severity", subOptions: ["Morning only", "All day"] },
  { key: "skinRash", label: "Skin Rash / Redness", emoji: "🔴", type: "grade" },
  { key: "fever", label: "Fever", emoji: "🌡️", type: "temperature" },
  { key: "brainFog", label: "Brain Fog", emoji: "🌫️", type: "severity" },
  { key: "eyeDryness", label: "Eye Dryness", emoji: "👁️", type: "toggle" },
  { key: "sleepDisruption", label: "Sleep Disruption", emoji: "🌙", type: "severity" },
];

const TAGS = ["Stress", "Travel", "Weather change", "New medication", "Poor sleep", "Diet change", "Exercise", "Alcohol"];

const GRADE_OPTIONS = ["Mild", "Moderate", "Severe"];

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysBetween = (start, end) => {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
};

const severityColor = (val) => {
  if (val <= 2) return "#22c55e";
  if (val <= 4) return "#84cc16";
  if (val <= 6) return "#eab308";
  if (val <= 8) return "#f97316";
  return "#ef4444";
};

const severityBg = (val) => {
  if (val <= 2) return "#f0fdf4";
  if (val <= 4) return "#f7fee7";
  if (val <= 6) return "#fefce8";
  if (val <= 8) return "#fff7ed";
  return "#fef2f2";
};

const STORAGE_KEY = "symptom_tracker_data";

const loadEntries = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveEntries = (entries) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
};

// --- COMPONENTS ---

function SymptomToggle({ symptom, value, onChange }) {
  const active = value?.active || false;
  const severity = value?.severity || 0;
  const grade = value?.grade || "";
  const subOption = value?.subOption || "";
  const temperature = value?.temperature || "";
  const imageLinks = value?.imageLinks || [];
  const [showImageInputs, setShowImageInputs] = useState(false);

  const toggle = () => {
    if (active) {
      onChange({ active: false, severity: 0, grade: "", subOption: "", temperature: "", imageLinks: [] });
    } else {
      onChange({ active: true, severity: symptom.type === "severity" ? 5 : 0, grade: symptom.type === "grade" ? "Moderate" : "", subOption: "", temperature: "", imageLinks: [] });
    }
  };

  const updateImageLink = (index, url) => {
    const updated = [...imageLinks];
    updated[index] = url;
    onChange({ ...value, imageLinks: updated.filter((_, i) => i <= index || updated[i]) });
  };

  const addImageSlot = () => {
    if (imageLinks.length < 3) {
      onChange({ ...value, imageLinks: [...imageLinks, ""] });
      setShowImageInputs(true);
    }
  };

  const removeImageLink = (index) => {
    const updated = imageLinks.filter((_, i) => i !== index);
    onChange({ ...value, imageLinks: updated });
    if (updated.length === 0) setShowImageInputs(false);
  };

  return (
    <div style={{
      background: active ? "#eff6ff" : "#f9fafb",
      border: active ? "2px solid #3b82f6" : "2px solid #e5e7eb",
      borderRadius: 12,
      padding: "12px 16px",
      marginBottom: 8,
      transition: "all 0.15s ease",
    }}>
      <div
        onClick={toggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{symptom.emoji}</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: active ? "#1e40af" : "#374151" }}>{symptom.label}</span>
        </div>
        <div style={{
          width: 44, height: 26, borderRadius: 13,
          background: active ? "#3b82f6" : "#d1d5db",
          display: "flex", alignItems: "center",
          padding: 2, transition: "background 0.2s",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11,
            background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transform: active ? "translateX(18px)" : "translateX(0)",
            transition: "transform 0.2s",
          }} />
        </div>
      </div>

      {active && (
        <div style={{ marginTop: 12, paddingLeft: 36 }}>
          {symptom.type === "severity" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Severity</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: severityColor(severity) }}>{severity}/10</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => onChange({ ...value, severity: n })} style={{
                    width: 30, height: 34, borderRadius: 8, border: "none",
                    background: severity === n ? severityColor(n) : "#e5e7eb",
                    color: severity === n ? "#fff" : "#6b7280",
                    fontWeight: severity === n ? 700 : 500, fontSize: 13,
                    cursor: "pointer", transition: "all 0.1s",
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}

          {symptom.type === "grade" && (
            <div style={{ display: "flex", gap: 8 }}>
              {GRADE_OPTIONS.map(g => (
                <button key={g} onClick={() => onChange({ ...value, grade: g })} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8,
                  border: grade === g ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  background: grade === g ? "#dbeafe" : "#fff",
                  color: grade === g ? "#1e40af" : "#6b7280",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}>{g}</button>
              ))}
            </div>
          )}

          {symptom.type === "temperature" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number" step="0.1" placeholder="e.g. 100.4"
                value={temperature}
                onChange={(e) => onChange({ ...value, temperature: e.target.value })}
                style={{
                  width: 100, padding: "8px 12px", borderRadius: 8,
                  border: "2px solid #e5e7eb", fontSize: 15, outline: "none",
                }}
              />
              <span style={{ color: "#6b7280", fontSize: 13 }}>°F</span>
            </div>
          )}

          {symptom.subOptions && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {symptom.subOptions.map(opt => (
                <button key={opt} onClick={() => onChange({ ...value, subOption: subOption === opt ? "" : opt })} style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: subOption === opt ? "2px solid #8b5cf6" : "2px solid #e5e7eb",
                  background: subOption === opt ? "#ede9fe" : "#fff",
                  color: subOption === opt ? "#6d28d9" : "#6b7280",
                  fontWeight: 500, fontSize: 12, cursor: "pointer",
                }}>{opt}</button>
              ))}
            </div>
          )}

          {/* Image Links for skin peeling symptoms */}
          {symptom.hasImageLinks && (
            <div style={{ marginTop: 10 }}>
              {(imageLinks.length > 0 || showImageInputs) ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>📷</span> Photo Links
                  </div>
                  {imageLinks.map((link, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                      <input
                        type="url"
                        placeholder={`Image URL ${idx + 1} (e.g., Google Photos link)`}
                        value={link}
                        onChange={(e) => updateImageLink(idx, e.target.value)}
                        style={{
                          flex: 1, padding: "7px 10px", borderRadius: 8,
                          border: "2px solid #e5e7eb", fontSize: 13, outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 16, textDecoration: "none", flexShrink: 0,
                        }} title="Open link">🔗</a>
                      )}
                      <button onClick={() => removeImageLink(idx)} style={{
                        background: "none", border: "none", color: "#ef4444",
                        fontSize: 16, cursor: "pointer", padding: 2, flexShrink: 0,
                      }} title="Remove">✕</button>
                    </div>
                  ))}
                  {imageLinks.length < 3 && (
                    <button onClick={addImageSlot} style={{
                      background: "none", border: "1px dashed #d1d5db", borderRadius: 8,
                      padding: "6px 12px", fontSize: 12, color: "#6b7280",
                      cursor: "pointer", width: "100%",
                    }}>+ Add another photo link ({3 - imageLinks.length} remaining)</button>
                  )}
                </div>
              ) : (
                <button onClick={() => { addImageSlot(); setShowImageInputs(true); }} style={{
                  background: "none", border: "1px dashed #93c5fd", borderRadius: 8,
                  padding: "8px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600,
                  cursor: "pointer", width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 4,
                }}>
                  <span>📷</span> Add photo link (Google Photos, etc.)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickLog({ onSave, editEntry, onCancelEdit }) {
  const emptySymptoms = {};
  SYMPTOMS.forEach(s => { emptySymptoms[s.key] = { active: false, severity: 0, grade: "", subOption: "", temperature: "", imageLinks: [] }; });

  const [flareStart, setFlareStart] = useState("");
  const [flareEnd, setFlareEnd] = useState("");
  const [ongoing, setOngoing] = useState(true);
  const [symptoms, setSymptoms] = useState(emptySymptoms);
  const [overallSeverity, setOverallSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editEntry) {
      setFlareStart(editEntry.flareStart || "");
      setFlareEnd(editEntry.flareEnd || "");
      setOngoing(!editEntry.flareEnd);
      setSymptoms(editEntry.symptoms || emptySymptoms);
      setOverallSeverity(editEntry.overallSeverity || 5);
      setNotes(editEntry.notes || "");
      setSelectedTags(editEntry.tags || []);
    }
  }, [editEntry]);

  const reset = () => {
    setFlareStart(""); setFlareEnd(""); setOngoing(true);
    setSymptoms(emptySymptoms); setOverallSeverity(5);
    setNotes(""); setSelectedTags([]);
  };

  const handleSave = () => {
    const entry = {
      id: editEntry?.id || generateId(),
      createdAt: editEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      flareStart: flareStart || new Date().toISOString().split("T")[0],
      flareEnd: ongoing ? null : flareEnd,
      symptoms, overallSeverity, notes, tags: selectedTags,
    };
    onSave(entry);
    if (!editEntry) reset();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeCount = Object.values(symptoms).filter(s => s.active).length;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ paddingBottom: 100 }}>
      {editEntry && (
        <div style={{
          background: "#fefce8", border: "1px solid #fde047", borderRadius: 10,
          padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "#854d0e", fontWeight: 600 }}>✏️ Editing entry from {formatDate(editEntry.flareStart)}</span>
          <button onClick={() => { onCancelEdit(); reset(); }} style={{
            background: "none", border: "none", color: "#b45309", fontWeight: 600, cursor: "pointer", fontSize: 13,
          }}>Cancel</button>
        </div>
      )}

      {/* Dates */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Flare Start Date</label>
        <input type="date" value={flareStart || today} onChange={e => setFlareStart(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 15, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Flare End Date</label>
          <div onClick={() => setOngoing(!ongoing)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: ongoing ? "2px solid #3b82f6" : "2px solid #d1d5db",
              background: ongoing ? "#3b82f6" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {ongoing && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Still ongoing</span>
          </div>
        </div>
        {!ongoing && (
          <input type="date" value={flareEnd} onChange={e => setFlareEnd(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        )}
      </div>

      {/* Symptoms */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Symptoms</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: "#3b82f6",
            background: "#eff6ff", padding: "3px 10px", borderRadius: 20,
          }}>{activeCount} active</span>
        </div>
        {SYMPTOMS.map(s => (
          <SymptomToggle
            key={s.key} symptom={s} value={symptoms[s.key]}
            onChange={(val) => setSymptoms(prev => ({ ...prev, [s.key]: val }))}
          />
        ))}
      </div>

      {/* Overall Severity */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignBottom: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Overall Severity</span>
          <span style={{
            fontSize: 18, fontWeight: 800, color: severityColor(overallSeverity),
            background: severityBg(overallSeverity), padding: "2px 12px", borderRadius: 8,
          }}>{overallSeverity}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setOverallSeverity(n)} style={{
              flex: 1, height: 40, borderRadius: 8, border: "none",
              background: overallSeverity === n ? severityColor(n) : "#f3f4f6",
              color: overallSeverity === n ? "#fff" : "#9ca3af",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.1s",
            }}>{n}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Minimal</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Severe</span>
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "block", marginBottom: 8 }}>Tags</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAGS.map(tag => {
            const sel = selectedTags.includes(tag);
            return (
              <button key={tag} onClick={() => {
                setSelectedTags(sel ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]);
              }} style={{
                padding: "6px 14px", borderRadius: 20,
                border: sel ? "2px solid #8b5cf6" : "2px solid #e5e7eb",
                background: sel ? "#ede9fe" : "#fff",
                color: sel ? "#6d28d9" : "#6b7280",
                fontWeight: 500, fontSize: 12, cursor: "pointer",
              }}>{tag}</button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "block", marginBottom: 8 }}>Notes</span>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Anything else to note... triggers, medications, weather, mood..."
          rows={3}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #e5e7eb",
            fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: saved ? "#22c55e" : "#3b82f6", color: "#fff",
        fontSize: 16, fontWeight: 700, cursor: "pointer",
        transition: "background 0.2s",
      }}>
        {saved ? "✓ Saved!" : editEntry ? "Update Entry" : "Save Entry"}
      </button>
    </div>
  );
}

function TimelineView({ entries, onEdit, onDelete }) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>No entries yet</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Log your first flare to see it here</div>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => new Date(b.flareStart) - new Date(a.flareStart));

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</div>
      {sorted.map(entry => {
        const activeSymptoms = SYMPTOMS.filter(s => entry.symptoms?.[s.key]?.active);
        const duration = daysBetween(entry.flareStart, entry.flareEnd);
        return (
          <div key={entry.id} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: 16, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                  {formatDate(entry.flareStart)} {entry.flareEnd ? `→ ${formatDate(entry.flareEnd)}` : "→ Ongoing"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {duration} day{duration !== 1 ? "s" : ""}{!entry.flareEnd ? " so far" : ""}
                </div>
              </div>
              <div style={{
                background: severityBg(entry.overallSeverity),
                color: severityColor(entry.overallSeverity),
                fontWeight: 800, fontSize: 14,
                padding: "4px 12px", borderRadius: 8,
                border: `2px solid ${severityColor(entry.overallSeverity)}20`,
              }}>{entry.overallSeverity}/10</div>
            </div>

            {activeSymptoms.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                {activeSymptoms.map(s => (
                  <span key={s.key} style={{
                    background: "#f3f4f6", borderRadius: 6, padding: "3px 8px",
                    fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                    {entry.symptoms[s.key].severity > 0 && (
                      <span style={{ color: severityColor(entry.symptoms[s.key].severity), fontWeight: 700 }}>
                        {entry.symptoms[s.key].severity}
                      </span>
                    )}
                    {entry.symptoms[s.key].grade && (
                      <span style={{ color: "#6b7280", fontWeight: 600 }}>{entry.symptoms[s.key].grade}</span>
                    )}
                    {entry.symptoms[s.key].imageLinks?.filter(l => l).length > 0 && (
                      <span style={{ color: "#3b82f6", fontWeight: 600 }} title="Has photo links">📷{entry.symptoms[s.key].imageLinks.filter(l => l).length}</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {entry.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {entry.tags.map(t => (
                  <span key={t} style={{
                    background: "#ede9fe", color: "#6d28d9", borderRadius: 20,
                    padding: "2px 10px", fontSize: 11, fontWeight: 600,
                  }}>{t}</span>
                ))}
              </div>
            )}

            {/* Image links from skin peeling symptoms */}
            {(() => {
              const allLinks = [];
              ["fingerSkinPeeling", "toeSkinPeeling"].forEach(key => {
                const sym = entry.symptoms?.[key];
                if (sym?.active && sym?.imageLinks?.length > 0) {
                  sym.imageLinks.filter(l => l).forEach((link, i) => {
                    const label = key === "fingerSkinPeeling" ? "Finger" : "Toe";
                    allLinks.push({ label: `${label} photo ${i + 1}`, link });
                  });
                }
              });
              if (allLinks.length === 0) return null;
              return (
                <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                  {allLinks.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{
                      background: "#eff6ff", color: "#2563eb", borderRadius: 6,
                      padding: "3px 8px", fontSize: 11, fontWeight: 600,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 3,
                    }}>📷 {item.label}</a>
                  ))}
                </div>
              );
            })()}

            {entry.notes && (
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>
                {entry.notes.length > 120 ? entry.notes.slice(0, 120) + "..." : entry.notes}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => onEdit(entry)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "2px solid #e5e7eb",
                background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Edit</button>
              <button onClick={() => onDelete(entry.id)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "2px solid #fecaca",
                background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardView({ entries }) {
  if (entries.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Need more data</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Log at least 2 entries to see patterns</div>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => new Date(a.flareStart) - new Date(b.flareStart));
  const latest = sorted[sorted.length - 1];
  const ongoingFlare = !latest.flareEnd;
  const daysSinceLast = daysBetween(latest.flareStart, null);

  const avgDuration = entries.filter(e => e.flareEnd).reduce((sum, e) => sum + daysBetween(e.flareStart, e.flareEnd), 0) / Math.max(1, entries.filter(e => e.flareEnd).length);

  const avgSeverity = entries.reduce((sum, e) => sum + (e.overallSeverity || 0), 0) / entries.length;

  // Symptom frequency
  const freq = {};
  SYMPTOMS.forEach(s => { freq[s.key] = 0; });
  entries.forEach(e => {
    SYMPTOMS.forEach(s => {
      if (e.symptoms?.[s.key]?.active) freq[s.key]++;
    });
  });
  const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]).filter(([, count]) => count > 0);

  // Co-occurrence
  const coOccur = {};
  entries.forEach(e => {
    const active = SYMPTOMS.filter(s => e.symptoms?.[s.key]?.active).map(s => s.key);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const pair = [active[i], active[j]].sort().join("+");
        coOccur[pair] = (coOccur[pair] || 0) + 1;
      }
    }
  });
  const topPairs = Object.entries(coOccur).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Severity over time (simple sparkline)
  const maxEntries = sorted.slice(-12);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={{ background: ongoingFlare ? "#fef2f2" : "#f0fdf4", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: ongoingFlare ? "#dc2626" : "#16a34a", marginTop: 4 }}>
            {ongoingFlare ? "In Flare" : "Remission"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {ongoingFlare ? `Day ${daysSinceLast}` : `${daysSinceLast}d since last`}
          </div>
        </div>
        <div style={{ background: "#f5f3ff", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Avg Duration</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed", marginTop: 4 }}>{avgDuration.toFixed(1)}d</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{entries.length} total flares</div>
        </div>
        <div style={{ background: severityBg(avgSeverity), borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Avg Severity</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: severityColor(avgSeverity), marginTop: 4 }}>{avgSeverity.toFixed(1)}/10</div>
        </div>
        <div style={{ background: "#eff6ff", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Tracked</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>{entries.length}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>entries logged</div>
        </div>
      </div>

      {/* Severity Trend */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Severity Trend</div>
        <div style={{ display: "flex", alignItems: "end", gap: 4, height: 80 }}>
          {maxEntries.map((e, i) => {
            const h = (e.overallSeverity / 10) * 70 + 10;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", maxWidth: 28, height: h, borderRadius: 6,
                  background: severityColor(e.overallSeverity),
                  opacity: 0.85, minWidth: 12,
                }} />
                <span style={{ fontSize: 9, color: "#9ca3af" }}>
                  {new Date(e.flareStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Symptom Frequency */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Symptom Frequency</div>
        {sortedFreq.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No symptom data yet</div>}
        {sortedFreq.map(([key, count]) => {
          const sym = SYMPTOMS.find(s => s.key === key);
          const pct = (count / entries.length) * 100;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, width: 24 }}>{sym?.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{sym?.label}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{count}/{entries.length} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#3b82f6", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Co-occurrence */}
      {topPairs.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Top Symptom Pairs</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Symptoms that appear together most often</div>
          {topPairs.map(([pair, count]) => {
            const [a, b] = pair.split("+");
            const sa = SYMPTOMS.find(s => s.key === a);
            const sb = SYMPTOMS.find(s => s.key === b);
            return (
              <div key={pair} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{ fontSize: 13 }}>
                  {sa?.emoji} {sa?.label} + {sb?.emoji} {sb?.label}
                </span>
                <span style={{
                  background: "#eff6ff", color: "#2563eb", fontWeight: 700,
                  fontSize: 12, padding: "2px 10px", borderRadius: 20,
                }}>{count}×</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExportView({ entries }) {
  const exportCSV = () => {
    const headers = ["Flare Start", "Flare End", "Duration (days)", "Overall Severity", "Tags", "Notes",
      ...SYMPTOMS.map(s => `${s.label} Active`), ...SYMPTOMS.map(s => `${s.label} Severity/Grade`),
      "Finger Skin Peeling Photos", "Toe Skin Peeling Photos"];
    const rows = entries.map(e => {
      const dur = daysBetween(e.flareStart, e.flareEnd);
      const fingerLinks = (e.symptoms?.fingerSkinPeeling?.imageLinks || []).filter(l => l).join(" | ");
      const toeLinks = (e.symptoms?.toeSkinPeeling?.imageLinks || []).filter(l => l).join(" | ");
      return [
        e.flareStart, e.flareEnd || "Ongoing", dur, e.overallSeverity,
        `"${(e.tags || []).join(", ")}"`, `"${(e.notes || "").replace(/"/g, '""')}"`,
        ...SYMPTOMS.map(s => e.symptoms?.[s.key]?.active ? "Yes" : "No"),
        ...SYMPTOMS.map(s => {
          const sym = e.symptoms?.[s.key];
          if (!sym?.active) return "";
          if (sym.severity) return sym.severity;
          if (sym.grade) return sym.grade;
          if (sym.temperature) return sym.temperature;
          return "Yes";
        }),
        `"${fingerLinks}"`, `"${toeLinks}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `symptom-tracker-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `symptom-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            saveEntries(data);
            window.location.reload();
          }
        } catch { alert("Invalid backup file"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Export for Doctor</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Download your symptom data as a spreadsheet</div>
        <button onClick={exportCSV} disabled={entries.length === 0} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: entries.length > 0 ? "#3b82f6" : "#d1d5db", color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: entries.length > 0 ? "pointer" : "not-allowed",
        }}>📄 Download CSV ({entries.length} entries)</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Backup & Restore</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Save a full backup or restore from one</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportJSON} disabled={entries.length === 0} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid #e5e7eb",
            background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600,
            cursor: entries.length > 0 ? "pointer" : "not-allowed",
          }}>💾 Save Backup</button>
          <button onClick={importJSON} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid #e5e7eb",
            background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>📂 Restore</button>
        </div>
      </div>

      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>⚠️ Data Privacy</div>
        <div style={{ fontSize: 12, color: "#a16207", lineHeight: 1.5 }}>
          All your data is stored locally in this browser only. Nothing is sent to any server.
          Export a backup regularly — clearing browser data will erase your logs.
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---

const TABS = [
  { key: "log", label: "Log", emoji: "✏️" },
  { key: "timeline", label: "Timeline", emoji: "📋" },
  { key: "dashboard", label: "Dashboard", emoji: "📊" },
  { key: "export", label: "Export", emoji: "💾" },
];

export default function SymptomTracker() {
  const [tab, setTab] = useState("log");
  const [entries, setEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { setEntries(loadEntries()); }, []);

  const handleSave = useCallback((entry) => {
    setEntries(prev => {
      const exists = prev.find(e => e.id === entry.id);
      const updated = exists ? prev.map(e => e.id === entry.id ? entry : e) : [...prev, entry];
      saveEntries(updated);
      return updated;
    });
    setEditEntry(null);
  }, []);

  const handleEdit = useCallback((entry) => {
    setEditEntry(entry);
    setTab("log");
  }, []);

  const handleDelete = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  const confirmDelete = useCallback(() => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== deleteConfirm);
      saveEntries(updated);
      return updated;
    });
    setDeleteConfirm(null);
  }, [deleteConfirm]);

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "16px 20px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Symptom Tracker</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Autoimmune Flare Monitor</div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 80px" }}>
        {tab === "log" && (
          <QuickLog onSave={handleSave} editEntry={editEntry} onCancelEdit={() => setEditEntry(null)} />
        )}
        {tab === "timeline" && (
          <TimelineView entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        {tab === "dashboard" && <DashboardView entries={entries} />}
        {tab === "export" && <ExportView entries={entries} />}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24,
            maxWidth: 320, width: "100%", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Delete this entry?</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "2px solid #e5e7eb",
                background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={confirmDelete} style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#fff", borderTop: "1px solid #e5e7eb",
        display: "flex", padding: "8px 0 12px", zIndex: 10,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key !== "log") setEditEntry(null); }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: tab === t.key ? "#3b82f6" : "#9ca3af",
              fontWeight: tab === t.key ? 700 : 500,
            }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ fontSize: 11 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
