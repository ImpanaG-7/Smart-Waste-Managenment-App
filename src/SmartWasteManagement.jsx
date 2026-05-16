import { useState, useRef, useEffect, useCallback } from "react";
 
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const MYSURU_DATA = {
  locality: "Saraswathipuram, Mysuru",
  ward: "Ward 33",
  population: 12400,
  households: 3100,
  wasteGeneratedPerDay: "4.2 tonnes",
  wasteBreakdown: { wet: 52, dry: 28, eWaste: 5, hazardous: 3, other: 12 },
  collectionDays: ["Monday", "Thursday"],
  segregationRate: 68,
  recyclingRate: 41,
  composting: "Active – 38 units",
  nearbyCenter: "MUDA Solid Waste Facility, Bannimantap",
  distanceToCenter: "2.8 km",
  monthlyStats: [
    { month: "Jan", wet: 120, dry: 75, eWaste: 14 },
    { month: "Feb", wet: 112, dry: 68, eWaste: 12 },
    { month: "Mar", wet: 131, dry: 82, eWaste: 18 },
    { month: "Apr", wet: 118, dry: 71, eWaste: 15 },
    { month: "May", wet: 128, dry: 79, eWaste: 16 },
    { month: "Jun", wet: 142, dry: 88, eWaste: 19 },
  ],
  achievements: ["68% households segregate waste", "38 active compost units", "ISO certified collection fleet", "Digital tracking since 2023"],
  challenges: ["Plastic mixed with wet waste", "E-waste collection only bi-monthly", "14% households still non-compliant"],
};

const WASTE_CENTERS_MYSURU = [
  { name: "MUDA Solid Waste Facility", area: "Bannimantap", lat: 12.2961, lng: 76.6396, types: ["Dry", "Wet", "E-Waste"], timings: "7am–5pm" },
  { name: "Rajiv Gandhi Nagar Collection Centre", area: "Rajiv Nagar", lat: 12.3047, lng: 76.6245, types: ["Dry", "Wet"], timings: "6am–2pm" },
  { name: "E-Waste Drop Zone", area: "Kuvempunagar", lat: 12.3198, lng: 76.6472, types: ["E-Waste"], timings: "9am–6pm" },
  { name: "Green Hub Mysuru", area: "Vijayanagar", lat: 12.3112, lng: 76.5998, types: ["Dry", "Wet", "Compost"], timings: "7am–4pm" },
];

const COLORS = {
  primary: "#166534",
  primary2: "#15803d",
  primary3: "#16a34a",
  accent: "#4ade80",
  light: "#dcfce7",
  lighter: "#f0fdf4",
  dark: "#14532d",
  teal: "#0d9488",
  lime: "#65a30d",
  emerald: "#059669",
  gold: "#ca8a04",
};

const WasteIcon = ({ type, size = 40 }) => {
  const icons = {
    "Dry Waste": { emoji: "📦", bg: "#fef3c7", border: "#f59e0b", label: "Dry" },
    "Wet Waste": { emoji: "🌿", bg: "#dcfce7", border: "#16a34a", label: "Wet" },
    "E-Waste": { emoji: "💻", bg: "#ede9fe", border: "#7c3aed", label: "E-Waste" },
    "Food Waste": { emoji: "🍎", bg: "#fff7ed", border: "#ea580c", label: "Food" },
  };
  const info = icons[type] || { emoji: "🗑️", bg: "#f1f5f9", border: "#64748b", label: type };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: info.bg, border: `2px solid ${info.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>{info.emoji}</div>
      <span style={{ fontSize: 11, fontWeight: 600, color: info.border }}>{info.label}</span>
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = COLORS.primary3, label, sublabel }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#166534" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>{value}%</span>
    </div>
    {sublabel && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{sublabel}</div>}
    <div style={{ height: 8, background: "#bbf7d0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #bbf7d0", boxShadow: "0 2px 12px rgba(22,101,52,0.07)", padding: 20, ...style }}>
    {children}
  </div>
);

const Badge = ({ children, color = COLORS.primary3 }) => (
  <span style={{ background: COLORS.light, color: COLORS.dark, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: `1px solid ${COLORS.accent}` }}>{children}</span>
);

const Btn = ({ children, onClick, style = {}, variant = "primary", disabled = false }) => {
  const base = { padding: "10px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.18s", opacity: disabled ? 0.6 : 1 };
  const variants = {
    primary: { background: COLORS.primary2, color: "#fff" },
    outline: { background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary3}` },
    ghost: { background: COLORS.light, color: COLORS.dark },
    danger: { background: "#dc2626", color: "#fff" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
};

const TabNav = ({ tabs, active, onSelect }) => (
  <div style={{ display: "flex", gap: 4, background: COLORS.lighter, borderRadius: 14, padding: 4, border: `1px solid ${COLORS.light}`, overflowX: "auto", flexWrap: "nowrap" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onSelect(t.id)} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: active === t.id ? COLORS.primary2 : "transparent", color: active === t.id ? "#fff" : COLORS.dark, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
        <span>{t.icon}</span> {t.label}
      </button>
    ))}
  </div>
);

function AIDetector({ points, setPoints }) {
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setCameraMode(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch { alert("Camera access denied. Please upload an image instead."); }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setCameraMode(false);
  };

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg");
    setImage(url);
    setImageB64(url.split(",")[1]);
    stopCamera(); setResult(null);
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { setImage(ev.target.result); setImageB64(ev.target.result.split(",")[1]); setResult(null); };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!imageB64) return;
    setLoading(true); setResult(null);
    try {
      const resp = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageB64 } },
              { type: "text", text: `Analyze this image for waste content. Identify the primary type of waste visible. Respond ONLY with a JSON object (no markdown) with these exact keys:
{
  "wasteType": one of "Dry Waste" | "Wet Waste" | "E-Waste" | "Food Waste" | "Mixed Waste" | "No Waste Detected",
  "confidence": number 0-100,
  "description": "one sentence describing what you see",
  "items": ["list", "of", "specific", "items", "seen"],
  "recyclingTips": ["tip 1", "tip 2", "tip 3"],
  "reusingIdeas": ["idea 1", "idea 2"],
  "disposalMethod": "where and how to dispose this waste properly",
  "environmentalImpact": "brief note on environmental impact if not properly disposed",
  "urgency": "low" | "medium" | "high"
}` }
            ]
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) { setResult({ wasteType: "Error", description: "Could not analyze image. Please try again.", recyclingTips: [], reusingIdeas: [], items: [] }); }
    setLoading(false);
  };

  const urgencyColor = { low: "#16a34a", medium: "#ca8a04", high: "#dc2626" };
  const wasteColor = { "Dry Waste": "#f59e0b", "Wet Waste": "#16a34a", "E-Waste": "#7c3aed", "Food Waste": "#ea580c", "Mixed Waste": "#64748b" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "0 0 6px" }}>AI Waste Detector</h2>
        <p style={{ color: "#4b7c4e", fontSize: 14, margin: 0 }}>Upload or capture an image — our AI will identify the waste type and guide you</p>
      </div>

      {!cameraMode && !image && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Btn onClick={startCamera} style={{ padding: "16px 12px", borderRadius: 14, fontSize: 15 }}>📷 Use Camera</Btn>
          <Btn onClick={() => fileRef.current?.click()} variant="outline" style={{ padding: "16px 12px", borderRadius: 14, fontSize: 15 }}>📤 Upload Image</Btn>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      )}

      {cameraMode && (
        <Card style={{ padding: 12, textAlign: "center" }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 10, maxHeight: 280, background: "#000" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "center" }}>
            <Btn onClick={capture}>📸 Capture</Btn>
            <Btn onClick={stopCamera} variant="outline">✕ Cancel</Btn>
          </div>
        </Card>
      )}

      {image && (
        <Card style={{ padding: 12, textAlign: "center" }}>
          <img src={image} alt="Captured" style={{ width: "100%", borderRadius: 10, maxHeight: 260, objectFit: "cover" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={analyze} disabled={loading} style={{ minWidth: 140 }}>
              {loading ? "🔄 Analyzing..." : "🤖 Detect Waste"}
            </Btn>
            <Btn onClick={() => { setImage(null); setImageB64(null); setResult(null); }} variant="outline">Clear</Btn>
          </div>
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 36, animation: "spin 1.5s linear infinite", display: "inline-block" }}>🌀</div>
          <p style={{ color: COLORS.primary, marginTop: 12, fontWeight: 600 }}>AI is scanning your image...</p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {result && result.wasteType !== "Error" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ background: `linear-gradient(135deg, ${COLORS.lighter} 0%, #fff 100%)`, borderColor: wasteColor[result.wasteType] || "#ccc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <WasteIcon type={result.wasteType} size={52} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: wasteColor[result.wasteType] || COLORS.dark }}>{result.wasteType}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{result.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>Confidence: {result.confidence}%</span>
                  <span style={{ fontSize: 12, background: result.urgency === "high" ? "#fee2e2" : result.urgency === "medium" ? "#fef9c3" : "#dcfce7", color: urgencyColor[result.urgency], padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>⚡ {result.urgency} urgency</span>
                </div>
              </div>
            </div>
            {result.items?.length > 0 && (
              <div style={{ borderTop: "1px solid #bbf7d0", paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Items Detected</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {result.items.map((item, i) => <Badge key={i}>{item}</Badge>)}
                </div>
              </div>
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 10 }}>♻️ Recycling Tips</div>
              {result.recyclingTips?.map((tip, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 6, display: "flex", gap: 6 }}>
                  <span style={{ color: COLORS.accent, flexShrink: 0 }}>✓</span> {tip}
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.teal, marginBottom: 10 }}>💡 Reuse Ideas</div>
              {result.reusingIdeas?.map((idea, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 6, display: "flex", gap: 6 }}>
                  <span style={{ color: COLORS.teal, flexShrink: 0 }}>→</span> {idea}
                </div>
              ))}
            </Card>
          </div>

          <Card style={{ background: "#fffbeb", borderColor: "#fcd34d" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>📍 How to Dispose</div>
            <div style={{ fontSize: 13, color: "#78350f" }}>{result.disposalMethod}</div>
          </Card>

          <Card style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 6 }}>🌍 Environmental Note</div>
            <div style={{ fontSize: 13, color: "#166534" }}>{result.environmentalImpact}</div>
          </Card>
        </div>
      )}

      {result?.wasteType === "Error" && (
        <Card style={{ background: "#fff1f2", borderColor: "#fecdd3", textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ color: "#9f1239", fontWeight: 600 }}>{result.description}</div>
        </Card>
      )}
    </div>
  );
}

function Quiz({ points, setPoints }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const fileRef = useRef(null);

  const questions = [
    { id: "collected", text: "Did you collect and segregate waste today?", options: ["Yes ✅", "No ❌"], emoji: "🗑️" },
    { id: "dumped", text: "Did you dump it at a certified waste management centre?", options: ["Yes ✅", "No, I need help finding one ❌"], emoji: "🏭" },
  ];

  const q = questions[step];

  const handleAnswer = (ans) => {
    const newAnswers = { ...answers, [q.id]: ans };
    setAnswers(newAnswers);
    if (q.id === "collected" && ans.startsWith("No")) { setStep("no_collect"); return; }
    if (q.id === "dumped" && ans.startsWith("No")) { setStep("find_centre"); return; }
    if (step < questions.length - 1) setStep(step + 1);
    else setStep("upload");
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(f);
  };

  const submit = () => {
    let pts = 0;
    if (answers.collected?.startsWith("Yes")) pts += 50;
    if (answers.dumped?.startsWith("Yes")) pts += 100;
    if (photo) pts += 75;
    if (location.trim().length > 3) pts += 25;
    setPointsEarned(pts);
    setPoints(prev => prev + pts);
    setSubmitted(true);
  };

  const reset = () => { setStep(0); setAnswers({}); setPhoto(null); setLocation(""); setSubmitted(false); setPointsEarned(0); };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
      <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 26 }}>Awesome Work!</h2>
      <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.primary2, margin: "12px 0" }}>+{pointsEarned} pts</div>
      <p style={{ color: "#4b7c4e", fontSize: 15 }}>You've earned {pointsEarned} green credit points for your responsible waste management!</p>
      <Card style={{ background: "#f0fdf4", margin: "16px 0", display: "inline-block", padding: "14px 28px" }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>Total Points</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.primary }}>{points}</div>
        <div style={{ fontSize: 12, color: COLORS.emerald }}>🌱 Green Champion</div>
      </Card>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
        <Btn onClick={reset}>Play Again</Btn>
        <Btn variant="outline">Share 📣</Btn>
      </div>
    </div>
  );

  if (step === "no_collect") return (
    <Card style={{ textAlign: "center", background: "#fff7ed", borderColor: "#fed7aa", padding: 28 }}>
      <div style={{ fontSize: 48 }}>💪</div>
      <h3 style={{ color: "#9a3412", fontFamily: "'Playfair Display', serif" }}>That's okay! Let's start today</h3>
      <p style={{ color: "#c2410c", fontSize: 14, lineHeight: 1.6 }}>Collecting and segregating waste takes just a few minutes but makes a huge difference. Separate your wet, dry, and e-waste into different bins.</p>
      <Btn onClick={reset} style={{ marginTop: 12 }}>Start Fresh Quiz</Btn>
    </Card>
  );

  if (step === "find_centre") return (
    <Card style={{ background: "#eff6ff", borderColor: "#bfdbfe", padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
      <h3 style={{ color: "#1e40af", margin: "0 0 8px" }}>Find a Waste Centre Near You</h3>
      <p style={{ color: "#1d4ed8", fontSize: 13, marginBottom: 16 }}>Go to the "Find Centres" tab — it will locate the nearest waste management centre using your GPS!</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn onClick={reset} variant="outline">Back to Quiz</Btn>
      </div>
    </Card>
  );

  if (step === "upload") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ background: "#f0fdf4", textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>📸</div>
        <h3 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", margin: "8px 0" }}>Upload Proof & Location</h3>
        <p style={{ color: "#4b7c4e", fontSize: 13 }}>Upload a photo of the waste you collected and enter where you disposed it to earn bonus points!</p>
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 10 }}>📷 Photo of Collected Waste (+75 pts)</div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        {photo
          ? <div style={{ position: "relative" }}>
              <img src={photo} alt="waste" style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "cover" }} />
              <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>
          : <Btn onClick={() => fileRef.current?.click()} variant="outline" style={{ width: "100%" }}>+ Add Photo</Btn>}
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 8 }}>📍 Disposal Location (+25 pts)</div>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. MUDA Facility, Bannimantap, Mysuru" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #bbf7d0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Enter the name or address of where you dropped off the waste</div>
      </Card>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={submit} style={{ flex: 1, padding: 14 }}>Submit & Earn Points 🌟</Btn>
        <Btn onClick={submit} variant="outline">Skip</Btn>
      </div>
    </div>
  );

  const progress = (step / questions.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
        <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "0 0 4px" }}>Waste Hero Challenge</h2>
        <p style={{ color: "#4b7c4e", fontSize: 13 }}>Complete the challenge to earn Green Credit Points!</p>
      </div>

      <div style={{ background: "#bbf7d0", borderRadius: 8, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: COLORS.primary2, borderRadius: 8, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>Question {step + 1} of {questions.length}</div>

      <Card style={{ textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{q.emoji}</div>
        <h3 style={{ color: COLORS.dark, fontSize: 18, fontWeight: 700, marginBottom: 20, lineHeight: 1.4 }}>{q.text}</h3>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {q.options.map(opt => (
            <Btn key={opt} onClick={() => handleAnswer(opt)} variant={opt.startsWith("Yes") ? "primary" : "outline"} style={{ minWidth: 140, padding: 14 }}>{opt}</Btn>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[{ label: "Collect Waste", pts: 50, done: answers.collected?.startsWith("Yes") }, { label: "Dump at Centre", pts: 100, done: answers.dumped?.startsWith("Yes") }, { label: "Add Photo", pts: 75, done: false }].map(item => (
          <div key={item.label} style={{ background: item.done ? "#dcfce7" : COLORS.lighter, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${item.done ? "#86efac" : "#d1fae5"}` }}>
            <div style={{ fontSize: 18 }}>{item.done ? "✅" : "⬜"}</div>
            <div style={{ fontSize: 11, color: COLORS.dark, fontWeight: 600, marginTop: 4 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: COLORS.emerald }}>+{item.pts} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindCentre() {
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  const locate = () => {
    setLocating(true); setError(null);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        const withDist = WASTE_CENTERS_MYSURU.map(c => ({ ...c, distance: parseFloat(getDistance(lat, lng, c.lat, c.lng)) })).sort((a, b) => a.distance - b.distance);
        setNearest(withDist);
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Showing all centres in Mysuru.");
        const withDist = WASTE_CENTERS_MYSURU.map(c => ({ ...c, distance: parseFloat(getDistance(12.2958, 76.6394, c.lat, c.lng)) }));
        setNearest(withDist); setLocating(false);
      }
    );
  };

  const openMaps = (centre) => {
    const url = userPos
      ? `https://www.google.com/maps/dir/${userPos.lat},${userPos.lng}/${centre.lat},${centre.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centre.name + " Mysuru")}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "0 0 6px" }}>Find Nearest Centre</h2>
        <p style={{ color: "#4b7c4e", fontSize: 14 }}>New to Mysuru? Let us guide you to the nearest waste management centre</p>
      </div>

      {!nearest && (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📍</div>
          <h3 style={{ color: COLORS.dark, marginBottom: 8 }}>Share Your Location</h3>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>We'll find the closest certified waste management centre to you and show you the route on Google Maps.</p>
          <Btn onClick={locate} disabled={locating} style={{ padding: "14px 28px", fontSize: 15 }}>
            {locating ? "📡 Locating..." : "📍 Use My Location"}
          </Btn>
          {error && <div style={{ marginTop: 12, color: "#ca8a04", fontSize: 13 }}>{error}</div>}
        </Card>
      )}

      {nearest && (
        <>
          {userPos && (
            <Card style={{ background: "#f0fdf4", borderColor: "#86efac", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>📡</div>
              <div>
                <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 14 }}>Location Found</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{userPos.lat.toFixed(4)}°N, {userPos.lng.toFixed(4)}°E</div>
              </div>
            </Card>
          )}

          <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🏭</span> Waste Centres in Mysuru ({nearest.length})
          </div>

          {nearest.map((c, i) => (
            <Card key={c.name} style={{ border: i === 0 ? `2px solid ${COLORS.primary3}` : "1.5px solid #bbf7d0", position: "relative" }} >
              {i === 0 && <div style={{ position: "absolute", top: -12, left: 14, background: COLORS.primary2, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>⭐ Nearest</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>📍 {c.area}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: COLORS.primary2, fontSize: 18 }}>{c.distance} km</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>away</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {c.types.map(t => <Badge key={t}>{t}</Badge>)}
                <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>⏰ {c.timings}</span>
              </div>
              <Btn onClick={() => openMaps(c)} style={{ width: "100%", background: "#1967d2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🗺️ Get Directions on Google Maps
              </Btn>
            </Card>
          ))}

          <Btn onClick={() => { setNearest(null); setUserPos(null); }} variant="outline">🔄 Refresh Location</Btn>
        </>
      )}
    </div>
  );
}

function DataSheet() {
  const d = MYSURU_DATA;
  const total = Object.values(d.wasteBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "0 0 4px" }}>Mysuru Waste Dashboard</h2>
        <Badge>{d.locality}</Badge>
        <span style={{ margin: "0 8px", color: "#9ca3af" }}>·</span>
        <Badge>{d.ward}</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ label: "Population", value: d.population.toLocaleString(), icon: "👥" }, { label: "Households", value: d.households.toLocaleString(), icon: "🏠" }, { label: "Waste/Day", value: d.wasteGeneratedPerDay, icon: "🗑️" }, { label: "Segregation", value: `${d.segregationRate}%`, icon: "♻️" }].map(m => (
          <Card key={m.label} style={{ background: COLORS.lighter, textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: 24 }}>{m.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, margin: "4px 0" }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{m.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 14, marginBottom: 14 }}>🗑️ Waste Composition</div>
        {[{ label: "Wet Waste", pct: d.wasteBreakdown.wet, color: "#16a34a" }, { label: "Dry Waste", pct: d.wasteBreakdown.dry, color: "#ca8a04" }, { label: "E-Waste", pct: d.wasteBreakdown.eWaste, color: "#7c3aed" }, { label: "Hazardous", pct: d.wasteBreakdown.hazardous, color: "#dc2626" }, { label: "Other", pct: d.wasteBreakdown.other, color: "#64748b" }].map(w => (
          <ProgressBar key={w.label} label={w.label} value={w.pct} color={w.color} sublabel={`${Math.round((w.pct / total) * 4.2 * 10) / 10} tonnes/day approx`} />
        ))}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 14, marginBottom: 12 }}>📈 Monthly Collection (Tonnes) — Jan–Jun 2025</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.lighter }}>
                {["Month", "Wet", "Dry", "E-Waste"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: COLORS.dark, fontWeight: 700 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {d.monthlyStats.map((r, i) => (
                <tr key={r.month} style={{ background: i % 2 ? "#f9fafb" : "#fff", borderBottom: "1px solid #f0fdf4" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: COLORS.dark }}>{r.month}</td>
                  <td style={{ padding: "8px 10px", color: "#166534" }}>{r.wet}t</td>
                  <td style={{ padding: "8px 10px", color: "#92400e" }}>{r.dry}t</td>
                  <td style={{ padding: "8px 10px", color: "#5b21b6" }}>{r.eWaste}t</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ background: "#f0fdf4" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 10 }}>🏆 Achievements</div>
          {d.achievements.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#166534", marginBottom: 6, display: "flex", gap: 6 }}><span>✅</span>{a}</div>)}
        </Card>
        <Card style={{ background: "#fffbeb" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>⚠️ Challenges</div>
          {d.challenges.map((c, i) => <div key={i} style={{ fontSize: 12, color: "#b45309", marginBottom: 6, display: "flex", gap: 6 }}><span>⚡</span>{c}</div>)}
        </Card>
      </div>

      <Card style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
        <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: 8, fontSize: 14 }}>📍 Primary Collection Centre</div>
        <div style={{ fontSize: 14, color: "#1e40af", marginBottom: 4 }}>🏭 {d.nearbyCenter}</div>
        <div style={{ fontSize: 13, color: "#3b82f6" }}>📏 {d.distanceToCenter} from locality centre</div>
        <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 4 }}>📅 Collection Days: {d.collectionDays.join(", ")}</div>
        <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 4 }}>🌿 Composting: {d.composting}</div>
      </Card>
    </div>
  );
}

function PointsPanel({ points }) {
  const level = points >= 500 ? "🌳 Eco Hero" : points >= 200 ? "🌿 Green Star" : points >= 50 ? "🌱 Sprout" : "🌾 Beginner";
  const nextLevel = points >= 500 ? 1000 : points >= 200 ? 500 : points >= 50 ? 200 : 50;
  const pct = Math.min((points / nextLevel) * 100, 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🏅</div>
        <h2 style={{ color: COLORS.dark, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "8px 0 4px" }}>Your Green Score</h2>
      </div>
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.emerald} 100%)`, textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>{points}</div>
        <div style={{ fontSize: 14, color: "#a7f3d0", marginTop: 4 }}>Green Credit Points</div>
        <div style={{ fontSize: 22, marginTop: 10 }}>{level}</div>
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 8 }}>Progress to next level</div>
        <ProgressBar value={Math.round(pct)} label={`${points} / ${nextLevel} pts`} />
        <div style={{ fontSize: 12, color: "#6b7280" }}>Next: {nextLevel - points} points needed</div>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, color: COLORS.dark, marginBottom: 12, fontSize: 14 }}>🎯 Ways to Earn Points</div>
        {[{ act: "Collect & Segregate Waste", pts: 50 }, { act: "Dump at Certified Centre", pts: 100 }, { act: "Upload Proof Photo", pts: 75 }, { act: "Enter Disposal Location", pts: 25 }, { act: "Use AI Detector", pts: 10 }].map(e => (
          <div key={e.act} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0fdf4", fontSize: 13 }}>
            <span style={{ color: "#374151" }}>{e.act}</span>
            <span style={{ fontWeight: 700, color: COLORS.primary2 }}>+{e.pts} pts</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("detect");
  const [points, setPoints] = useState(0);

  const tabs = [
    { id: "detect", label: "AI Detector", icon: "🔍" },
    { id: "quiz", label: "Challenge", icon: "🎮" },
    { id: "centres", label: "Find Centres", icon: "🗺️" },
    { id: "data", label: "Dashboard", icon: "📊" },
    { id: "score", label: "My Score", icon: "🏅" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 50%, #fff 100%)", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        button { font-family: inherit; }
        input { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ background: COLORS.primary, padding: "16px 20px", boxShadow: "0 4px 20px rgba(22,101,52,0.3)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 28 }}>♻️</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: "#fff", fontSize: 18, lineHeight: 1.2 }}>SmartWaste</div>
              <div style={{ fontSize: 11, color: "#86efac", letterSpacing: 1.5, textTransform: "uppercase" }}>Mysuru Green Initiative</div>
            </div>
          </div>
          <div style={{ background: "#14532d", borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>🌟</span>
            <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 16 }}>{points}</span>
            <span style={{ color: "#86efac", fontSize: 11 }}>pts</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #bbf7d0", padding: "10px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <TabNav tabs={tabs} active={tab} onSelect={setTab} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 40px" }}>
        {tab === "detect" && <AIDetector points={points} setPoints={setPoints} />}
        {tab === "quiz" && <Quiz points={points} setPoints={setPoints} />}
        {tab === "centres" && <FindCentre />}
        {tab === "data" && <DataSheet />}
        {tab === "score" && <PointsPanel points={points} />}
      </div>

      {/* Footer */}
      <div style={{ background: COLORS.dark, color: "#86efac", textAlign: "center", padding: "14px 20px", fontSize: 12 }}>
        🌍 SmartWaste Mysuru · Every action counts · Built for a greener Karnataka
      </div>
    </div>
  );
}
