import React, { useState, useEffect, useRef } from "react";
import {
  Scale,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Printer,
  Info,
  AlertTriangle,
  FileText,
  Zap,
  Trash2,
  Plus,
  Minus,
  Settings,
  Eye,
  Crosshair,
  Activity,
  BarChart2,
  Maximize,
  Repeat,
  Clock,
  Archive,
  Menu,
  X,
  MessageSquare,
  MessageCircle,
  Download,
  Upload,
  Camera
} from "lucide-react";

/* ---------------------------------------------------------------- */
/* Constants & pure helpers                                          */
/* ---------------------------------------------------------------- */

const STEPS = [
  { id: "setup", icon: Settings, label: "Instrument Setup" },
  { id: "visual", icon: Eye, label: "Visual Exam" },
  { id: "zero", icon: Crosshair, label: "Zero Baseline" },
  { id: "zerotrack", icon: Activity, label: "Zero Tracking" },
  { id: "accuracy", icon: BarChart2, label: "Accuracy Test" },
  { id: "discrimination", icon: Maximize, label: "Discrimination" },
  { id: "eccentricity", icon: Activity, label: "Eccentricity" },
  { id: "repeatability", icon: Repeat, label: "Repeatability" },
  { id: "creep", icon: Clock, label: "Creep & Zero Return" },
  { id: "tare", icon: Archive, label: "Tare Device" },
  { id: "report", icon: FileText, label: "Final Report" },
];

const VISUAL_ITEMS = [
  "Manufacturer's name or registered trade mark legibly marked",
  "Accuracy class clearly marked (I / II / III / IIII)",
  "Maximum capacity (Max) marked on the descriptive plate",
  "Minimum capacity (Min) marked on the descriptive plate",
  "Verification scale interval (e) marked",
  "Actual scale interval (d) marked, if different from e",
  "Pattern / model approval number marked, where applicable",
  "Descriptive marking plate is indelible, grouped together and sealable",
  "Position provided for verification / control marks is intact and undamaged",
  "No visible physical damage to housing, load receptor or display affecting metrology",
];

const BANDS = {
  I: [50000, 200000],
  II: [5000, 20000, 100000],
  III: [500, 2000, 10000],
  IV: [50, 200, 1000],
};

const CLASS_LABEL = {
  I: "Class I — Special accuracy",
  II: "Class II — High accuracy",
  III: "Class III — Medium accuracy",
  IV: "Class IIII — Ordinary accuracy",
};

const ENGINEER_OPTIONS = ["Vijay Gore", "Shital Borse", "Swapnil Waghmare", "Shivahari Mundhe", "Dhananjay Muley"];
const OFFICER_OPTIONS = ["Shrimant Gaikwad", "Dhananjay Muley"];

function n(v) {
  const x = parseFloat(v);
  return Number.isNaN(x) ? null : x;
}

function computeE(I, deltaL, L, e) {
  const i = n(I), dl = n(deltaL), l = n(L), ee = n(e);
  if (i === null || dl === null || l === null || ee === null) return null;
  return i + 0.5 * ee - dl - l;
}

function getMPE(cls, load, e, mode) {
  const l = n(load), ee = n(e);
  if (l === null || ee === null || ee === 0) return null;
  const bands = BANDS[cls] || BANDS.III;
  const ratio = l / ee;
  let mult;
  if (ratio <= bands[0]) mult = 0.5;
  else if (ratio <= bands[1]) mult = 1;
  else mult = 1.5;
  let mpe = mult * ee;
  if (mode === "inspection") mpe *= 2;
  return mpe;
}

function round(v, dp = 4) {
  if (v === null || v === undefined || Number.isNaN(v)) return v;
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return round(v, 4).toString();
}

function suggestLoads(cls, eN, minN, maxN) {
  if (!eN || !maxN) return [];
  const bands = BANDS[cls] || BANDS.III;
  const raw = [minN, bands[0] * eN, bands[1] * eN, maxN / 2, maxN];
  const seen = new Set();
  const out = [];
  raw
    .filter((v) => v !== null && !Number.isNaN(v) && v >= minN && v <= maxN)
    .sort((a, b) => a - b)
    .forEach((v) => {
      const key = round(v, 2);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    });
  return out.length ? out : [minN, maxN];
}

function suggestLoadsMultiRange(cls, ranges) {
  if (!ranges.length) return [];
  const out = new Set();
  ranges.forEach((r) => {
    suggestLoads(cls, r.e, r.min, r.max).forEach((v) => out.add(round(v, 2)));
  });
  return Array.from(out).sort((a, b) => a - b);
}

function repsForClass(cls) {
  return cls === "I" || cls === "II" ? 6 : 3;
}

function parseRanges(str) {
  if (!str) return [];
  return String(str).split("/").map((s) => parseFloat(s.trim())).filter((v) => !Number.isNaN(v));
}

function buildRanges(maxStr, minVal, eStr) {
  const maxes = parseRanges(maxStr);
  const es = parseRanges(eStr);
  if (!maxes.length) return [];
  return maxes.map((max, i) => {
    const e = es[i] !== undefined ? es[i] : es[es.length - 1];
    const min = i === 0 ? minVal : maxes[i - 1];
    return { index: i, max, min, e, n: e ? Math.round(max / e) : 0 };
  });
}

function rangeForLoad(ranges, load) {
  if (!ranges.length) return null;
  const l = n(load);
  if (l === null) return ranges[ranges.length - 1];
  const match = ranges.find((r) => l <= r.max + 1e-9);
  return match || ranges[ranges.length - 1];
}

/* ---------------------------------------------------------------- */
/* UI Components                                                     */
/* ---------------------------------------------------------------- */

const PASS_BG = "#dcfce7", PASS_FG = "#166534";
const FAIL_BG = "#fee2e2", FAIL_FG = "#991b1b";

function Badge({ status, textOverride }) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
        {textOverride || "Pending"}
      </span>
    );
  if (status === "pass")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: PASS_BG, color: PASS_FG }}>
        <CheckCircle2 size={14} /> {textOverride || "Pass"}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: FAIL_BG, color: FAIL_FG }}>
      <XCircle size={14} /> {textOverride || "Fail"}
    </span>
  );
}

function Field({ label, children, hint, className = "" }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`} style={{ color: '#1e293b' }}>
      <span className="font-semibold text-slate-700" style={{ color: '#334155' }}>{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-500 font-medium" style={{ color: '#64748b' }}>{hint}</span>}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm ${props.className || ""}`}
      style={{ color: '#1e293b', ...props.style }}
    />
  );
}

function TextAreaObs({ value, onChange }) {
  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-bold text-slate-700 flex items-center gap-2" style={{ color: '#334155' }}>
          <MessageSquare size={16} className="text-indigo-500"/> Observations / Remarks
        </span>
        <textarea
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm min-h-[80px]"
          style={{ color: '#1e293b' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter any specific observations, anomalies, or environmental conditions noted during this test..."
        />
      </label>
    </div>
  );
}

function Instructions({ title, children }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 mb-6 flex gap-3 shadow-sm" style={{ color: '#334155' }}>
      <Info size={20} className="text-indigo-600 mt-0.5 shrink-0" />
      <div className="text-sm leading-relaxed text-slate-700" style={{ color: '#334155' }}>
        <div className="font-bold text-slate-900 mb-1" style={{ color: '#1e293b' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function SectionCard({ children, title, subtitle, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      {(title || action) && (
        <div className="flex justify-between items-start mb-6">
          <div>
            {title && <h2 className="text-2xl font-bold text-slate-800" style={{ color: '#1e293b' }}>{title}</h2>}
            {subtitle && <p className="text-slate-500 text-sm mt-1" style={{ color: '#64748b' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Continue", backLabel = "Back", nextDisabled }) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={16} /> {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
      >
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main App Component                                                */
/* ---------------------------------------------------------------- */

const DEFAULT_INSTRUMENT = {
  labName: "Weighcal Metrology Services Private Limited",
  labAddress: "Plot No. BH-1/23, Thakare Nagar, N-2 CIDCO, Aurangabad, Pin code-431001",
  labPhone: "9637700799",
  gatcNo: "IND/GATC/MH/26/09",
  certNo: "",
  ownerName: "",
  ownerAddress: "",
  ownerPhone: "",
  verifiedWhere: "insitu",
  make: "",
  model: "",
  srNo: "",
  yearOfMfg: "",
  modelApprovalNo: "",
  max: "",
  min: "",
  e: "",
  d: "",
  unit: "kg",
  accuracyClass: "III",
  mode: "verification",
  calibrationEngineer: ENGINEER_OPTIONS[3],
  principalOfficer: OFFICER_OPTIONS[0],
  date: new Date().toISOString().split('T')[0],
  ambientTemp: "",
  relHumidity: "",
  supplyVoltage: "230V, 50Hz",
  verificationFee: "500",
  receiptNo: "",
  receiptDate: "",
  sealNo: "",
  remarks: "",
  instrumentType: "Electronic",
};

const DEFAULT_OBS = {
  visual: "", zero: "", zerotrack: "", accuracy: "", discrimination: "", eccentricity: "", repeatability: "", creep: "", tare: ""
};

export default function App() {
  const [step, setStep] = useState("setup");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // State Persistence
  const [instrument, setInstrument] = useState(() => {
    const saved = localStorage.getItem('nawi-instrument');
    return saved ? JSON.parse(saved) : DEFAULT_INSTRUMENT;
  });
  const [observations, setObservations] = useState(() => {
    const saved = localStorage.getItem('nawi-obs');
    return saved ? JSON.parse(saved) : DEFAULT_OBS;
  });
  const [visualChecklist, setVisualChecklist] = useState(() => {
    const saved = localStorage.getItem('nawi-visual');
    return saved ? JSON.parse(saved) : VISUAL_ITEMS.map((label, i) => ({ id: i, label, value: "" }));
  });
  const [zeroTest, setZeroTest] = useState(() => {
    const saved = localStorage.getItem('nawi-zero');
    return saved ? JSON.parse(saved) : { load: "", I: "", deltaL: "" };
  });
  const [zeroTrack, setZeroTrack] = useState(() => {
    const saved = localStorage.getItem('nawi-zerotrack');
    return saved ? JSON.parse(saved) : { settingReadings: ["", "", ""], trackingRangeObserved: "" };
  });
  const [accuracyRows, setAccuracyRows] = useState(() => {
    const saved = localStorage.getItem('nawi-accuracy');
    return saved ? JSON.parse(saved) : null;
  });
  const [discRows, setDiscRows] = useState(() => {
    const saved = localStorage.getItem('nawi-disc');
    return saved ? JSON.parse(saved) : null;
  });
  const [eccRows, setEccRows] = useState(() => {
    const saved = localStorage.getItem('nawi-ecc');
    return saved ? JSON.parse(saved) : null;
  });
  const [eccLoad, setEccLoad] = useState(() => {
    const saved = localStorage.getItem('nawi-ecc-load');
    return saved ? JSON.parse(saved) : null;
  });
  const [eccPositions, setEccPositions] = useState(4);
  const [repBlocks, setRepBlocks] = useState(() => {
    const saved = localStorage.getItem('nawi-rep');
    return saved ? JSON.parse(saved) : null;
  });
  const [creepTest, setCreepTest] = useState(() => {
    const saved = localStorage.getItem('nawi-creep');
    return saved ? JSON.parse(saved) : { load: "", I0: "", I15: "", I30: "", I240: "", zeroBefore: "", zeroAfter: "" };
  });
  const [tareTest, setTareTest] = useState(() => {
    const saved = localStorage.getItem('nawi-tare');
    return saved ? JSON.parse(saved) : { tareLoad: "", zeroAfterTare: "", testLoad: "", I: "", deltaL: "" };
  });

  useEffect(() => {
    localStorage.setItem('nawi-instrument', JSON.stringify(instrument));
    localStorage.setItem('nawi-obs', JSON.stringify(observations));
    localStorage.setItem('nawi-visual', JSON.stringify(visualChecklist));
    localStorage.setItem('nawi-zero', JSON.stringify(zeroTest));
    localStorage.setItem('nawi-zerotrack', JSON.stringify(zeroTrack));
    localStorage.setItem('nawi-creep', JSON.stringify(creepTest));
    localStorage.setItem('nawi-tare', JSON.stringify(tareTest));
    if (accuracyRows) localStorage.setItem('nawi-accuracy', JSON.stringify(accuracyRows));
    if (discRows) localStorage.setItem('nawi-disc', JSON.stringify(discRows));
    if (eccRows) localStorage.setItem('nawi-ecc', JSON.stringify(eccRows));
    if (eccLoad) localStorage.setItem('nawi-ecc-load', JSON.stringify(eccLoad));
    if (repBlocks) localStorage.setItem('nawi-rep', JSON.stringify(repBlocks));
  }, [instrument, observations, visualChecklist, zeroTest, zeroTrack, creepTest, tareTest, accuracyRows, discRows, eccRows, eccLoad, repBlocks]);

  const updateObs = (key) => (val) => setObservations(prev => ({...prev, [key]: val}));

  /* ---------- Share & Download Logic ---------- */

  const ranges = buildRanges(instrument.max, n(instrument.min) || 0, instrument.e);
  const maxN = ranges.length ? ranges[ranges.length - 1].max : 0;
  const minN = n(instrument.min) || 0;
  const eN = ranges.length ? ranges[0].e : 0;
  const dN = n(instrument.d) || eN;
  const cls = instrument.accuracyClass;
  const nIntervals = ranges.map((r) => r.n).join("/");
  const unit = instrument.unit;
  const isMultiRange = ranges.length > 1;

  function eFor(load) {
    if (!ranges.length) return eN;
    const r = rangeForLoad(ranges, load);
    return r ? r.e : eN;
  }
  function dFor(load) {
    const dArr = parseRanges(instrument.d);
    if (!dArr.length) return eFor(load);
    if (dArr.length === ranges.length && ranges.length) {
      const r = rangeForLoad(ranges, load);
      return dArr[r ? r.index : 0];
    }
    return dArr[0];
  }

  const E0 = computeE(zeroTest.I, zeroTest.deltaL, zeroTest.load, eFor(zeroTest.load));

  // Compute Results dynamically for sharing
  function accuracyResult(row) {
    const e = eFor(row.load);
    const E = computeE(row.I, row.deltaL, row.load, e);
    if (E === null || E0 === null) return { complete: false, e };
    const Ec = E - E0;
    const mpe = getMPE(cls, row.load, e, instrument.mode);
    return { complete: true, e, E, E0, Ec, mpe, pass: Math.abs(Ec) <= mpe + 1e-9 };
  }
  function discResult(row) {
    const d = dFor(row.load);
    const i1 = n(row.I1), i2 = n(row.I2);
    if (i1 === null || i2 === null) return { complete: false };
    const diff = i2 - i1;
    return { complete: true, diff, d, pass: diff >= d - 1e-9 };
  }
  function repResult(row, load) {
    const e = eFor(load);
    const E = computeE(row.I, row.deltaL, load, e);
    if (E === null) return { complete: false };
    const mpe = getMPE(cls, load, e, instrument.mode);
    return { complete: true, E, mpe, pass: Math.abs(E) <= mpe + 1e-9 };
  }
  function visualResult() {
    if (!visualChecklist.every((it) => it.value !== "")) return { complete: false };
    const pass = visualChecklist.every((it) => it.value !== "No");
    return { complete: true, pass };
  }
  function zeroTrackResult() {
    const readings = zeroTrack.settingReadings.map((v) => n(v));
    const settingComplete = readings.every((r) => r !== null);
    const trackVal = n(zeroTrack.trackingRangeObserved);
    if (!settingComplete || trackVal === null) return { complete: false };
    const eZero = eFor(0);
    const settingPass = readings.every((r) => Math.abs(r) <= 0.25 * eZero + 1e-9);
    const percent = maxN ? (trackVal / maxN) * 100 : null;
    const trackPass = percent !== null && percent <= 4 + 1e-9;
    return { complete: true, readings, eZero, settingPass, percent, trackPass, pass: settingPass && trackPass };
  }
  function creepResult() {
      const { I0, I15, I30, I240, zeroBefore, zeroAfter, load } = creepTest;
      const e = eFor(load);
      const i0 = n(I0), i15 = n(I15), i30 = n(I30), i240 = n(I240);
      const zb = n(zeroBefore), za = n(zeroAfter);
      const creepComplete = i0 !== null && i15 !== null && i30 !== null;
      const zrComplete = zb !== null && za !== null;
      if (!creepComplete || !zrComplete) return { complete: false };
      const diff30 = Math.abs(i30 - i0);
      const diff15_30 = Math.abs(i30 - i15);
      let creepPass = diff30 <= 0.5 * e && diff15_30 <= 0.2 * e;
      if (!creepPass && i240 !== null) {
          const mpe = getMPE(cls, load, e, instrument.mode);
          const diff240 = Math.abs(i240 - i0);
          creepPass = diff240 <= mpe;
      }
      const zrDiff = Math.abs(za - zb);
      const zrPass = zrDiff <= 0.5 * eFor(0);
      return { complete: true, diff30, diff15_30, creepPass, zrDiff, zrPass, pass: creepPass && zrPass, e };
  }
  function tareResult() {
    const zeroDev = n(tareTest.zeroAfterTare);
    if (zeroDev === null || tareTest.testLoad === "" || tareTest.tareLoad === "") return { complete: false };
    const eTare = eFor(tareTest.tareLoad);
    const zeroPass = Math.abs(zeroDev) <= 0.25 * eTare + 1e-9;
    const net = accuracyResult({ load: tareTest.testLoad, I: tareTest.I, deltaL: tareTest.deltaL });
    if (!net.complete) return { complete: false };
    return { complete: true, zeroDev, eTare, zeroPass, net, pass: zeroPass && net.pass };
  }
  function statusFrom(resultFn) {
    const r = resultFn();
    return r.complete ? { status: r.pass ? "pass" : "fail", complete: true, ...r } : { status: "pending", complete: false };
  }
  function overallForRows(rows, resultFn, extra) {
    if (!rows || !rows.length) return { status: "pending", complete: false };
    const results = rows.map((r) => resultFn(r, extra));
    const allComplete = results.every((r) => r.complete);
    if (!allComplete) return { status: "pending", complete: false, results };
    const pass = results.every((r) => r.pass);
    return { status: pass ? "pass" : "fail", complete: true, results };
  }

  const accuracyOverall = overallForRows(accuracyRows, accuracyResult);
  const discOverall = overallForRows(discRows, discResult);
  const eccOverall = overallForRows(eccRows, accuracyResult);
  let repOverall = { status: "pending", complete: false };
  if (repBlocks) {
    const blockVerdicts = repBlocks.map((b) => {
      const results = b.rows.map((r) => repResult(r, b.load));
      const complete = results.every((r) => r.complete);
      if (!complete) return { complete: false };
      const errs = results.map((r) => r.E);
      const range = Math.max(...errs) - Math.min(...errs);
      const mpe = getMPE(cls, b.load, eN, instrument.mode);
      const pass = results.every((r) => r.pass) && range <= mpe + 1e-9;
      return { complete: true, pass, range, mpe, results };
    });
    const complete = blockVerdicts.every((b) => b.complete);
    repOverall = complete ? { status: blockVerdicts.every((b) => b.pass) ? "pass" : "fail", complete: true, blockVerdicts } : { status: "pending", complete: false };
  }
  const visualOverall = statusFrom(visualResult);
  const zeroTrackOverall = statusFrom(zeroTrackResult);
  const creepOverall = statusFrom(creepResult);
  const tareOverall = statusFrom(tareResult);

  const allStatuses = [
    accuracyOverall.status, discOverall.status, eccOverall.status,
    repOverall.status, visualOverall.status, zeroTrackOverall.status,
    tareOverall.status, creepOverall.status
  ];
  const overallVerdict = allStatuses.includes("fail") ? "fail" : allStatuses.every((s) => s === "pass") ? "pass" : "pending";
  const mpeAtMax = getMPE(cls, maxN, eFor(maxN), instrument.mode);

  /* ---------- Action Handlers ---------- */

  const clearData = () => {
    if(window.confirm("Clear all test data and reset form?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const loadDemoData = () => {
    if(window.confirm("Load standard passing data for a 30kg Class III scale?")) {
      setInstrument({
        ...DEFAULT_INSTRUMENT, make: "Acme Scales", model: "M-30K", srNo: "SN-2026-991", yearOfMfg: "2026",
        max: "30", min: "0.2", e: "0.01", d: "0.01", unit: "kg", accuracyClass: "III", ambientTemp: "25", relHumidity: "55",
      });
      setObservations({
          ...DEFAULT_OBS,
          visual: "Descriptive plate is securely riveted. Control marks intact.",
          accuracy: "No hysteresis observed during load removal.",
          creep: "Temperature remained stable at 25°C throughout 30m period."
      });
      setVisualChecklist(VISUAL_ITEMS.map((label, i) => ({ id: i, label, value: "Yes" })));
      setZeroTest({ load: "0.1", I: "0.1", deltaL: "0.005" });
      setZeroTrack({ settingReadings: ["0", "0", "0"], trackingRangeObserved: "0.5" });
      setAccuracyRows([
        { id: 1, load: 0.2, direction: "Increasing", I: "0.2", deltaL: "0.005" },
        { id: 2, load: 5, direction: "Increasing", I: "5", deltaL: "0.005" },
        { id: 3, load: 20, direction: "Increasing", I: "20", deltaL: "0.005" },
        { id: 4, load: 30, direction: "Increasing", I: "30", deltaL: "0.005" },
        { id: 5, load: 0.2, direction: "Decreasing", I: "0.2", deltaL: "0.005" },
        { id: 6, load: 5, direction: "Decreasing", I: "5", deltaL: "0.005" },
        { id: 7, load: 20, direction: "Decreasing", I: "20", deltaL: "0.005" },
        { id: 8, load: 30, direction: "Decreasing", I: "30", deltaL: "0.005" },
      ]);
      setDiscRows([
        { id: 1, load: 0.2, I1: "0.2", I2: "0.21" },
        { id: 2, load: 15, I1: "15", I2: "15.01" },
        { id: 3, load: 30, I1: "30", I2: "30.01" },
      ]);
      setEccLoad(10);
      setEccRows([
        { label: "Position A (front-left)", load: 10, I: "10", deltaL: "0.005" },
        { label: "Position B (front-right)", load: 10, I: "10", deltaL: "0.005" },
        { label: "Position C (rear-right)", load: 10, I: "10", deltaL: "0.005" },
        { label: "Position D (rear-left)", load: 10, I: "10", deltaL: "0.005" },
      ]);
      setRepBlocks([
        { label: "Half load", load: 15, rows: Array.from({length: 3}, () => ({ I: "15", deltaL: "0.005" })) },
        { label: "Full load (Max)", load: 30, rows: Array.from({length: 3}, () => ({ I: "30", deltaL: "0.005" })) }
      ]);
      setCreepTest({ load: "30", I0: "30", I15: "30.001", I30: "30.002", I240: "", zeroBefore: "0", zeroAfter: "0.002" });
      setTareTest({ tareLoad: "10", zeroAfterTare: "0", testLoad: "15", I: "15", deltaL: "0.005" });
      setStep("report");
    }
  };

  const shareToWhatsApp = () => {
    const text = `*NAWI Verification Report*\n\n` +
      `*Test Centre:* ${instrument.labName}\n` +
      `*Make/Model:* ${instrument.make || "N/A"} / ${instrument.model || "N/A"}\n` +
      `*Serial No:* ${instrument.srNo || "N/A"}\n` +
      `*Max Capacity:* ${instrument.max} ${instrument.unit}\n` +
      `*Accuracy Class:* ${instrument.accuracyClass}\n\n` +
      `*OVERALL VERDICT:* ${overallVerdict.toUpperCase()}\n\n` +
      `*-- Test Breakdown --*\n` +
      `*Visual:* ${visualOverall.status.toUpperCase()}\n` +
      `*Accuracy:* ${accuracyOverall.status.toUpperCase()}\n` +
      `*Eccentricity:* ${eccOverall.status.toUpperCase()}\n` +
      `*Repeatability:* ${repOverall.status.toUpperCase()}\n` +
      `*Creep Test:* ${creepOverall.status.toUpperCase()}\n\n` +
      `_Sent from NAWI Verification Suite_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const exportData = () => {
    const data = { instrument, observations, visualChecklist, zeroTest, zeroTrack, accuracyRows, discRows, eccRows, eccLoad, repBlocks, creepTest, tareTest };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NAWI_Data_${instrument.srNo || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.instrument) setInstrument(data.instrument);
        if (data.observations) setObservations(data.observations);
        if (data.visualChecklist) setVisualChecklist(data.visualChecklist);
        if (data.zeroTest) setZeroTest(data.zeroTest);
        if (data.zeroTrack) setZeroTrack(data.zeroTrack);
        if (data.accuracyRows) setAccuracyRows(data.accuracyRows);
        if (data.discRows) setDiscRows(data.discRows);
        if (data.eccRows) setEccRows(data.eccRows);
        if (data.eccLoad) setEccLoad(data.eccLoad);
        if (data.repBlocks) setRepBlocks(data.repBlocks);
        if (data.creepTest) setCreepTest(data.creepTest);
        if (data.tareTest) setTareTest(data.tareTest);
        alert("Data imported successfully!");
      } catch (err) {
        alert("Error importing data. Invalid file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const downloadUISnapshot = () => {
     const html = `<!DOCTYPE html><html><head><title>NAWI Suite Offline Snapshot</title></head><body style="font-family: sans-serif; padding: 2rem;">
     <h2>NAWI Verification Suite - Download Info</h2>
     <p>To safely download the fully interactive application for your friend, please use the <b>Download</b> or <b>Copy Code</b> button located at the top right of the code block in your AI Interface, and save it as a <code>.jsx</code> file.</p>
     <p>Alternatively, you can use the <b>Export Data</b> button to download your exact test parameters and send them the <code>.json</code> file.</p>
     </body></html>`;
     const blob = new Blob([html], { type: "text/html" });
     const a = document.createElement("a");
     a.href = URL.createObjectURL(blob);
     a.download = `NAWI_Suite_Instructions.html`;
     a.click();
  };

  /* ---------- Nav Logic ---------- */

  function initAccuracy() {
    const loads = isMultiRange ? suggestLoadsMultiRange(cls, ranges) : suggestLoads(cls, eN, minN, maxN);
    const rows = [];
    let id = 1;
    loads.forEach((load) => {
      rows.push({ id: id++, load, direction: "Increasing", I: "", deltaL: "" });
      rows.push({ id: id++, load, direction: "Decreasing", I: "", deltaL: "" });
    });
    setAccuracyRows(rows);
  }

  function initDiscrimination() {
    const loads = [minN, round(maxN / 2, 2), maxN];
    setDiscRows(loads.map((load, i) => ({ id: i + 1, load, I1: "", I2: "" })));
  }

  function initEccentricity(positions = eccPositions) {
    const load = round(maxN / 3, 2) || 0;
    setEccLoad(load);
    const labels = positions === 4
        ? ["Position A (front-left)", "Position B (front-right)", "Position C (rear-right)", "Position D (rear-left)"]
        : Array.from({ length: positions }, (_, i) => `Position ${i + 1}`);
    setEccRows(labels.map((label) => ({ label, I: "", deltaL: "" })));
  }

  function initRepeatability() {
    const reps = repsForClass(cls);
    const loads = [{ label: "Half load", load: round(maxN / 2, 2) || 0 }, { label: "Full load (Max)", load: maxN || 0 }];
    setRepBlocks(loads.map((l) => ({ ...l, rows: Array.from({ length: reps }, () => ({ I: "", deltaL: "" })) })));
  }
  
  function initCreep() {
    setCreepTest(prev => ({...prev, load: maxN || ""}));
  }

  function goto(stepId) {
    if (stepId === "accuracy" && !accuracyRows) initAccuracy();
    if (stepId === "discrimination" && !discRows) initDiscrimination();
    if (stepId === "eccentricity" && !eccRows) initEccentricity();
    if (stepId === "repeatability" && !repBlocks) initRepeatability();
    if (stepId === "creep" && !creepTest.load) initCreep();
    
    setStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSidebarOpen(false);
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const renderContent = () => {
    switch(step) {
      case "setup": return <SetupStep instrument={instrument} setInstrument={setInstrument} maxN={maxN} minN={minN} eN={eN} nIntervals={nIntervals} isMultiRange={isMultiRange} ranges={ranges} onNext={() => goto("visual")} />;
      case "visual": return <VisualExamStep items={visualChecklist} setItems={setVisualChecklist} resultFn={visualResult} obs={observations.visual} setObs={updateObs('visual')} onBack={() => goto("setup")} onNext={() => goto("zero")} />;
      case "zero": return <ZeroStep zeroTest={zeroTest} setZeroTest={setZeroTest} eN={eN} unit={unit} E0={E0} obs={observations.zero} setObs={updateObs('zero')} onBack={() => goto("visual")} onNext={() => goto("zerotrack")} />;
      case "zerotrack": return <ZeroTrackingStep zeroTrack={zeroTrack} setZeroTrack={setZeroTrack} resultFn={zeroTrackResult} eZero={eFor(0)} maxN={maxN} unit={unit} obs={observations.zerotrack} setObs={updateObs('zerotrack')} onBack={() => goto("zero")} onNext={() => goto("accuracy")} />;
      case "accuracy": return accuracyRows ? <AccuracyStep rows={accuracyRows} setRows={setAccuracyRows} resultFn={accuracyResult} E0={E0} unit={unit} obs={observations.accuracy} setObs={updateObs('accuracy')} onBack={() => goto("zerotrack")} onNext={() => goto("discrimination")} /> : null;
      case "discrimination": return discRows ? <DiscriminationStep rows={discRows} setRows={setDiscRows} resultFn={discResult} unit={unit} dFor={dFor} obs={observations.discrimination} setObs={updateObs('discrimination')} onBack={() => goto("accuracy")} onNext={() => goto("eccentricity")} /> : null;
      case "eccentricity": return eccRows ? <EccentricityStep rows={eccRows} setRows={setEccRows} resultFn={accuracyResult} eccLoad={eccLoad} unit={unit} positions={eccPositions} setPositions={(p) => { setEccPositions(p); initEccentricity(p); }} obs={observations.eccentricity} setObs={updateObs('eccentricity')} onBack={() => goto("discrimination")} onNext={() => goto("repeatability")} /> : null;
      case "repeatability": return repBlocks ? <RepeatabilityStep blocks={repBlocks} setBlocks={setRepBlocks} resultFn={repResult} unit={unit} cls={cls} obs={observations.repeatability} setObs={updateObs('repeatability')} onBack={() => goto("eccentricity")} onNext={() => goto("creep")} /> : null;
      case "creep": return <CreepStep creepTest={creepTest} setCreepTest={setCreepTest} resultFn={creepResult} unit={unit} obs={observations.creep} setObs={updateObs('creep')} onBack={() => goto("repeatability")} onNext={() => goto("tare")} />;
      case "tare": return <TareDeviceStep tareTest={tareTest} setTareTest={setTareTest} resultFn={tareResult} unit={unit} maxN={maxN} obs={observations.tare} setObs={updateObs('tare')} onBack={() => goto("creep")} onNext={() => goto("report")} />;
      case "report": return <ReportStep instrument={instrument} maxN={maxN} minN={minN} eN={eN} dN={dN} nIntervals={nIntervals} unit={unit} mpeAtMax={mpeAtMax} observations={observations} accuracyOverall={accuracyOverall} discOverall={discOverall} eccOverall={eccOverall} repOverall={repOverall} visualOverall={visualOverall} zeroTrackOverall={zeroTrackOverall} tareOverall={tareOverall} creepOverall={creepOverall} overallVerdict={overallVerdict} onBack={() => goto("tare")} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 print:hidden flex flex-col`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
              <Scale size={18} />
            </div>
            <span className="font-bold text-white tracking-wide">NAWI Suite</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <nav className="space-y-1 px-3">
            {STEPS.map((s) => {
              const active = s.id === step;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => goto(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <Icon size={16} className={active ? "text-indigo-200" : "text-slate-400"} />
                  {s.label}
                  {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
           <button onClick={loadDemoData} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-slate-800 text-indigo-400 rounded-lg hover:bg-slate-700 transition-colors">
              <Zap size={14} /> Demo Data
           </button>
           <button onClick={clearData} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-slate-800 text-red-400 rounded-lg hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Reset Forms
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header - Sharing & Actions */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between print:hidden shadow-sm z-10 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-indigo-600">
              <Menu size={24} />
            </button>
            <div className="font-bold text-slate-800 md:hidden">{STEPS.find(s => s.id === step)?.label}</div>
            <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="text-slate-400">Step:</span> <span className="text-indigo-700">{STEPS.find(s => s.id === step)?.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
             <button onClick={shareToWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
               <MessageCircle size={14} /> Send WhatsApp Report
             </button>
             
             <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
               <Download size={14} /> Export Data
             </button>

             <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
               <Upload size={14} /> Import Data
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
             </label>

             <button onClick={downloadUISnapshot} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
               <Camera size={14} /> Download UI Snap
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="w-full pb-20">
            {renderContent()}
          </div>
        </main>
      </div>

    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Step Components                                                   */
/* ---------------------------------------------------------------- */

function SetupStep({ instrument, setInstrument, maxN, minN, eN, nIntervals, isMultiRange, ranges, onNext }) {
  const set = (k) => (e) => setInstrument((s) => ({ ...s, [k]: e.target.value }));

  return (
    <SectionCard title="Instrument & Certificate Setup" subtitle="Enter nameplate and environmental details for the Certificate of Verification.">
      <div className="text-xs font-bold uppercase tracking-widest mt-8 mb-4 pb-2 border-b border-slate-200 text-indigo-800" style={{ color: '#3730a3' }}>Test Centre & Certificate</div>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Approved Test Centre (Name)"><TextInput value={instrument.labName} onChange={set("labName")} /></Field>
        <Field label="GATC No."><TextInput value={instrument.gatcNo} onChange={set("gatcNo")} placeholder="IND/GATC/MH/26/09" /></Field>
        <Field label="Test Centre Address"><TextInput value={instrument.labAddress} onChange={set("labAddress")} /></Field>
        <Field label="Certificate No."><TextInput value={instrument.certNo} onChange={set("certNo")} placeholder="IND/GATC/MH/26/09/26/133" /></Field>
        <Field label="Date of verification"><TextInput type="date" value={instrument.date} onChange={set("date")} /></Field>
        <Field label="Calibration Engineer">
          <select className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" style={{ color: '#1e293b' }} value={instrument.calibrationEngineer} onChange={set("calibrationEngineer")}>
            {ENGINEER_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </Field>
      </div>

      <div className="text-xs font-bold uppercase tracking-widest mt-8 mb-4 pb-2 border-b border-slate-200 text-indigo-800" style={{ color: '#3730a3' }}>Owner Details</div>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Owner / Firm name (M/s)"><TextInput value={instrument.ownerName} onChange={set("ownerName")} /></Field>
        <Field label="Owner Address"><TextInput value={instrument.ownerAddress} onChange={set("ownerAddress")} /></Field>
      </div>

      <div className="text-xs font-bold uppercase tracking-widest mt-8 mb-4 pb-2 border-b border-slate-200 text-indigo-800" style={{ color: '#3730a3' }}>Instrument Nameplate</div>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Make / Model"><TextInput value={instrument.make} onChange={set("make")} placeholder="e.g. Acme/M-30" /></Field>
        <Field label="Serial Number"><TextInput value={instrument.srNo} onChange={set("srNo")} /></Field>
        <Field label="Unit of mass">
          <select className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={instrument.unit} onChange={set("unit")}>
            <option value="kg">kg</option><option value="g">g</option>
          </select>
        </Field>
        <Field label="Accuracy Class">
          <select className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={instrument.accuracyClass} onChange={set("accuracyClass")}>
            {Object.entries(CLASS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label={`Maximum (Max) — ${instrument.unit}`} hint="Use '/' for multi-range"><TextInput value={instrument.max} onChange={set("max")} placeholder="30" /></Field>
        <Field label={`Minimum (Min) — ${instrument.unit}`}><TextInput type="number" value={instrument.min} onChange={set("min")} placeholder="0.2" /></Field>
        <Field label={`Scale interval (e) — ${instrument.unit}`} hint="Use '/' for multi-range"><TextInput value={instrument.e} onChange={set("e")} placeholder="0.01" /></Field>
        <Field label={`Actual interval (d) — ${instrument.unit}`} hint="Usually equal to e"><TextInput value={instrument.d} onChange={set("d")} placeholder="same as e" /></Field>
      </div>

      {ranges.length > 0 && (
        <div className="mt-6 text-sm rounded-lg border border-indigo-200 p-4 bg-indigo-50/50">
          {isMultiRange ? (
            <>Multi-range instrument. <b>n = {nIntervals}</b>. Automatic MPE scaling active.</>
          ) : (
            <>Verification scale intervals, <b>n = Max / e = {nIntervals}</b>.</>
          )}
        </div>
      )}

      <NavButtons backLabel="—" onBack={() => {}} onNext={onNext} nextLabel="Start Visual Exam" />
    </SectionCard>
  );
}

function VisualExamStep({ items, setItems, resultFn, obs, setObs, onBack, onNext }) {
  const update = (idx, value) => setItems((its) => its.map((it, i) => (i === idx ? { ...it, value } : it)));
  const overall = resultFn();

  return (
    <SectionCard title="Visual Examination">
      <Instructions title="Rule 7 Compliance">
        Inspect the descriptive plate and physical condition. All applicable items must pass (Yes or N/A).
      </Instructions>

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={it.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 bg-white shadow-sm">
            <span className="text-sm font-medium text-slate-700">{it.label}</span>
            <select
              className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shrink-0"
              value={it.value} onChange={(e) => update(idx, e.target.value)}
            >
              <option value="">--</option><option value="Yes">Yes</option><option value="No">No</option><option value="N/A">N/A</option>
            </select>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200">
        <span className="font-bold text-slate-700">Overall Result:</span>
        <Badge status={!overall.complete ? "pending" : overall.pass ? "pass" : "fail"} />
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Zero Error" />
    </SectionCard>
  );
}

function ZeroStep({ zeroTest, setZeroTest, eN, unit, E0, obs, setObs, onBack, onNext }) {
  const suggested = round(10 * eN, 4);
  const set = (k) => (e) => setZeroTest((s) => ({ ...s, [k]: e.target.value }));

  return (
    <SectionCard title="Initial Zero Error (E₀)">
      <Instructions title="Procedure">
        Apply load ~10e ({fmt(suggested)} {unit}). Note Indication (I). Add e/10 increments until indication changes. Record added load (ΔL). E₀ corrects future readings.
      </Instructions>

      <div className="grid md:grid-cols-3 gap-6">
        <Field label={`Load (L) — ${unit}`}><TextInput type="number" value={zeroTest.load} onChange={set("load")} placeholder={fmt(suggested)} /></Field>
        <Field label="Indication (I)"><TextInput type="number" value={zeroTest.I} onChange={set("I")} /></Field>
        <Field label="ΔL to next division"><TextInput type="number" value={zeroTest.deltaL} onChange={set("deltaL")} /></Field>
      </div>

      <div className="mt-8 text-center p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50">
        <div className="text-sm text-slate-500 font-semibold mb-2">Calculated Zero Error (E₀)</div>
        <div className="text-3xl font-black text-indigo-700 font-mono tracking-tight">
          {E0 !== null ? `${fmt(E0)} ${unit}` : "—"}
        </div>
        <div className="text-xs text-slate-400 mt-2 font-mono">E₀ = I + ½e − ΔL − L</div>
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Zero Tracking" />
    </SectionCard>
  );
}

function ZeroTrackingStep({ zeroTrack, setZeroTrack, resultFn, eZero, maxN, unit, obs, setObs, onBack, onNext }) {
  const updateReading = (idx, value) => setZeroTrack((s) => ({ ...s, settingReadings: s.settingReadings.map((r, i) => (i === idx ? value : r)) }));
  const res = resultFn();

  return (
    <SectionCard title="Zero Setting & Tracking">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Part A: Zero-Setting Accuracy</h3>
        <p className="text-sm text-slate-500 mb-4">Unload and trigger zero 3 times. Deviation limit: <b>0.25e ({fmt(round(0.25 * eZero, 4))} {unit})</b>.</p>
        <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          {zeroTrack.settingReadings.map((r, idx) => (
            <Field key={idx} label={`Trial ${idx + 1}`}><TextInput type="number" value={r} onChange={(e) => updateReading(idx, e.target.value)} /></Field>
          ))}
          <div className="col-span-3 flex justify-between items-center mt-2 border-t pt-4">
             <span className="font-semibold text-slate-600">Setting Result:</span>
             <Badge status={!res.complete ? "pending" : res.settingPass ? "pass" : "fail"} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Part B: Tracking Range</h3>
        <p className="text-sm text-slate-500 mb-4">Max cumulative load auto-corrected to zero. Limit: <b>4% of Max ({fmt(round(0.04 * maxN, 4))} {unit})</b>.</p>
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
          <Field label={`Range Observed (${unit})`} className="max-w-xs">
            <TextInput type="number" value={zeroTrack.trackingRangeObserved} onChange={(e) => setZeroTrack((s) => ({ ...s, trackingRangeObserved: e.target.value }))} />
          </Field>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
             <span className="font-semibold text-slate-600">Tracking Result:</span>
             <div className="flex items-center gap-3">
               {res.complete && <span className="text-xs font-mono text-slate-500">{fmt(res.percent)}% of Max</span>}
               <Badge status={!res.complete ? "pending" : res.trackPass ? "pass" : "fail"} />
             </div>
          </div>
        </div>
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Accuracy Test" />
    </SectionCard>
  );
}

function AccuracyStep({ rows, setRows, resultFn, E0, unit, obs, setObs, onBack, onNext }) {
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () => setRows(rs => [...rs, { id: Date.now(), load: "", direction: "Increasing", I: "", deltaL: "" }]);
  const removeRow = (idx) => setRows(rs => rs.filter((_, i) => i !== idx));

  const allComplete = rows.every((r) => resultFn(r).complete);
  const allPass = allComplete && rows.every((r) => resultFn(r).pass);

  return (
    <SectionCard title="Accuracy Test (Weighing Test)" action={
      <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200">
        <Plus size={16} /> Add Row
      </button>
    }>
      <Instructions title="Procedure & Error Calculations">
        Test loads progressively up to Max, then back down. The table explicitly calculates Errors based on the standard formulas: <br/>
        <b>Error (E) =</b> I + ½e − ΔL − L <br/>
        <b>Corrected Error (Ec) =</b> E − E₀ 
      </Instructions>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 text-xs whitespace-nowrap">Load ({unit})</th>
              <th className="py-3 px-4 text-xs">Dir</th>
              <th className="py-3 px-4 text-xs text-indigo-700 bg-indigo-50/50">e</th>
              <th className="py-3 px-4 text-xs">Ind (I)</th>
              <th className="py-3 px-4 text-xs">ΔL</th>
              <th className="py-2 px-4 border-l border-slate-300 bg-slate-50">
                <div className="text-xs">Error (E)</div>
                <div className="text-[9px] font-mono font-medium text-slate-500 normal-case tracking-normal">I + ½e − ΔL − L</div>
              </th>
              <th className="py-2 px-4 border-l border-slate-300 bg-slate-50">
                <div className="text-xs">Zero (E₀)</div>
              </th>
              <th className="py-2 px-4 border-l border-slate-300 bg-slate-50 text-indigo-900">
                <div className="text-xs">Corr. (Ec)</div>
                <div className="text-[9px] font-mono font-medium text-slate-500 normal-case tracking-normal">E − E₀</div>
              </th>
              <th className="py-3 px-4 text-xs border-l border-slate-300">MPE</th>
              <th className="py-3 px-4 text-xs">Result</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const res = resultFn(row);
              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-4"><TextInput type="number" value={row.load} onChange={(e) => update(idx, { load: e.target.value })} className="w-20" /></td>
                  <td className="py-2 px-4">
                     <select value={row.direction} onChange={(e) => update(idx, { direction: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>Increasing</option><option>Decreasing</option>
                     </select>
                  </td>
                  <td className="py-2 px-4 font-mono text-xs text-indigo-700 bg-indigo-50/20">{res.complete ? fmt(res.e) : "—"}</td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.I} onChange={(e) => update(idx, { I: e.target.value })} className="w-20" /></td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.deltaL} onChange={(e) => update(idx, { deltaL: e.target.value })} className="w-20" /></td>
                  <td className="py-2 px-4 font-mono text-slate-600 border-l border-slate-100 bg-slate-50/50">{res.complete ? fmt(res.E) : "—"}</td>
                  <td className="py-2 px-4 font-mono text-slate-400 border-l border-slate-100 bg-slate-50/50">{E0 !== null ? fmt(E0) : "—"}</td>
                  <td className="py-2 px-4 font-mono font-bold text-slate-900 border-l border-slate-100 bg-slate-50/50">{res.complete ? fmt(res.Ec) : "—"}</td>
                  <td className="py-2 px-4 font-mono text-slate-500 border-l border-slate-100">{res.complete ? `±${fmt(res.mpe)}` : "—"}</td>
                  <td className="py-2 px-4"><Badge status={res.complete ? (res.pass ? "pass" : "fail") : "pending"} /></td>
                  <td className="py-2 px-2 text-right">
                    <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 rounded"><Minus size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200">
        <span className="font-bold text-slate-700">Overall Accuracy Result:</span>
        <Badge status={!allComplete ? "pending" : allPass ? "pass" : "fail"} />
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Discrimination Test" />
    </SectionCard>
  );
}

function DiscriminationStep({ rows, setRows, resultFn, unit, dFor, obs, setObs, onBack, onNext }) {
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const allComplete = rows.every((r) => resultFn(r).complete);
  const allPass = allComplete && rows.every((r) => resultFn(r).pass);

  return (
    <SectionCard title="Discrimination Test">
      <Instructions title="Procedure (1.4d)">
        Place extra load equal to <b>1.4 × d</b>. Indication must change by at least one actual scale division (I₂ − I₁ ≥ d).
      </Instructions>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="py-3 px-4">Load ({unit})</th>
              <th className="py-3 px-4">I₁</th>
              <th className="py-3 px-4 text-indigo-500">+1.4d</th>
              <th className="py-3 px-4">I₂</th>
              <th className="py-3 px-4">Change</th>
              <th className="py-3 px-4">Req (d)</th>
              <th className="py-3 px-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const res = resultFn(row);
              const d = dFor(row.load);
              const extra = round(1.4 * d, 4);
              return (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4"><TextInput type="number" value={row.load} onChange={(e) => update(idx, { load: e.target.value })} className="w-24" /></td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.I1} onChange={(e) => update(idx, { I1: e.target.value })} className="w-24" /></td>
                  <td className="py-2 px-4 font-mono text-indigo-500 font-bold text-xs">+{fmt(extra)}</td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.I2} onChange={(e) => update(idx, { I2: e.target.value })} className="w-24" /></td>
                  <td className="py-2 px-4 font-mono font-bold text-slate-800">{res.complete ? fmt(res.diff) : "—"}</td>
                  <td className="py-2 px-4 font-mono text-slate-500">≥ {fmt(d)}</td>
                  <td className="py-2 px-4"><Badge status={res.complete ? (res.pass ? "pass" : "fail") : "pending"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Eccentricity" />
    </SectionCard>
  );
}

function EccentricityStep({ rows, setRows, resultFn, eccLoad, unit, positions, setPositions, obs, setObs, onBack, onNext }) {
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch, load: eccLoad } : r)));
  const withLoad = rows.map((r) => ({ ...r, load: eccLoad }));
  const allComplete = withLoad.every((r) => resultFn(r).complete);
  const allPass = allComplete && withLoad.every((r) => resultFn(r).pass);

  return (
    <SectionCard title="Eccentricity Test">
      <Instructions title="Procedure (1/3 Max)">
        Apply test load of <b>⅓ Max ({fmt(eccLoad)} {unit})</b> to each quadrant/support. Corrected Error (Ec) must not exceed MPE.
      </Instructions>

      <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-sm font-bold text-slate-700">Positions:</span>
        <div className="flex gap-2">
          {[4, 5, 6].map((p) => (
            <button key={p} onClick={() => setPositions(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                positions === p ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="py-3 px-4">Position</th>
              <th className="py-3 px-4">I</th>
              <th className="py-3 px-4">ΔL</th>
              <th className="py-3 px-4">Ec</th>
              <th className="py-3 px-4">MPE</th>
              <th className="py-3 px-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const res = resultFn({ ...row, load: eccLoad });
              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-4 font-semibold text-slate-600">{row.label}</td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.I} onChange={(e) => update(idx, { I: e.target.value })} className="w-24" /></td>
                  <td className="py-2 px-4"><TextInput type="number" value={row.deltaL} onChange={(e) => update(idx, { deltaL: e.target.value })} className="w-24" /></td>
                  <td className="py-2 px-4 font-mono font-bold text-slate-800">{res.complete ? fmt(res.Ec) : "—"}</td>
                  <td className="py-2 px-4 font-mono text-slate-500">{res.complete ? `±${fmt(res.mpe)}` : "—"}</td>
                  <td className="py-2 px-4"><Badge status={res.complete ? (res.pass ? "pass" : "fail") : "pending"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Repeatability" />
    </SectionCard>
  );
}

function RepeatabilityStep({ blocks, setBlocks, resultFn, unit, cls, obs, setObs, onBack, onNext }) {
  const reps = repsForClass(cls);
  const update = (bIdx, rIdx, patch) => setBlocks((bs) => bs.map((b, i) => i !== bIdx ? b : { ...b, rows: b.rows.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) }));

  return (
    <SectionCard title="Repeatability Test">
      <Instructions title="Procedure">
        Load and unload {reps} times. Range (Emax − Emin) must not exceed MPE.
      </Instructions>

      <div className="space-y-8">
        {blocks.map((block, bIdx) => {
          const results = block.rows.map((r) => resultFn(r, block.load));
          const complete = results.every((r) => r.complete);
          const errs = results.map((r) => r.E);
          const range = complete ? Math.max(...errs) - Math.min(...errs) : null;
          const mpeVal = results[0] && results[0].complete ? results[0].mpe : null;
          const pass = complete && results.every((r) => r.pass) && mpeVal !== null && range <= mpeVal + 1e-9;

          return (
            <div key={bIdx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-5 py-3 font-black text-slate-800 border-b border-slate-200 uppercase tracking-wider text-sm flex justify-between">
                <span>{block.label}</span> <span>{fmt(block.load)} {unit}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-500 font-bold border-b border-slate-100 text-xs">
                    <tr><th className="py-2 px-4 w-12">#</th><th className="py-2 px-4">I</th><th className="py-2 px-4">ΔL</th><th className="py-2 px-4">E</th><th className="py-2 px-4">Result</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {block.rows.map((row, rIdx) => {
                      const res = results[rIdx];
                      return (
                        <tr key={rIdx}>
                          <td className="py-2 px-4 text-slate-400 font-bold">{rIdx + 1}</td>
                          <td className="py-2 px-4"><TextInput type="number" value={row.I} onChange={(e) => update(bIdx, rIdx, { I: e.target.value })} className="w-24" /></td>
                          <td className="py-2 px-4"><TextInput type="number" value={row.deltaL} onChange={(e) => update(bIdx, rIdx, { deltaL: e.target.value })} className="w-24" /></td>
                          <td className="py-2 px-4 font-mono font-bold text-slate-700">{res.complete ? fmt(res.E) : "—"}</td>
                          <td className="py-2 px-4"><Badge status={res.complete ? (res.pass ? "pass" : "fail") : "pending"} textOverride={res.complete ? "ok" : ""} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-700">
                  Range = {complete ? <span className="text-indigo-600">{fmt(range)}</span> : "—"} 
                  {mpeVal !== null ? ` (Limit: ${fmt(mpeVal)})` : ""}
                </span>
                <Badge status={!complete ? "pending" : pass ? "pass" : "fail"} />
              </div>
            </div>
          );
        })}
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Creep Test" />
    </SectionCard>
  );
}

function CreepStep({ creepTest, setCreepTest, resultFn, unit, obs, setObs, onBack, onNext }) {
  const set = (k) => (e) => setCreepTest((s) => ({ ...s, [k]: e.target.value }));
  const res = resultFn();

  return (
    <SectionCard title="Creep & Zero Return Test">
       <Instructions title="Time & Loading Procedure (Para 9)">
        <b>Creep:</b> Load instrument close to Max. Note initial indication, 15m, and 30m. <br/>
        Limit: Δ30m ≤ 0.5e, and Δ(15-30m) ≤ 0.2e. If failed, observe for 4h (limit MPE).<br/>
        <b>Zero Return:</b> Deviation in zero before/after 30m load must be ≤ 0.5e.
      </Instructions>

      <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h3 className="font-bold text-slate-800 border-b pb-2 mb-4 text-lg">Time/Creep Variation</h3>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
           <Field label={`Load applied (${unit})`}><TextInput type="number" value={creepTest.load} onChange={set("load")} /></Field>
           <Field label="Initial I (0 min)"><TextInput type="number" value={creepTest.I0} onChange={set("I0")} /></Field>
           <Field label="I (15 min)"><TextInput type="number" value={creepTest.I15} onChange={set("I15")} /></Field>
           <Field label="I (30 min)"><TextInput type="number" value={creepTest.I30} onChange={set("I30")} /></Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
           <Field label="I (4 hr) - Optional if 30m fails"><TextInput type="number" value={creepTest.I240} onChange={set("I240")} /></Field>
        </div>
        
        <div className="max-w-5xl">
           <div className="text-sm font-mono text-slate-600 font-bold">
             {res.complete ? (
                 <>
                  Δ30m = <span className="text-indigo-600">{fmt(res.diff30)}</span> (Limit: ≤{fmt(0.5*res.e)}) | 
                  Δ15-30 = <span className="text-indigo-600">{fmt(res.diff15_30)}</span> (Limit: ≤{fmt(0.2*res.e)})
                 </>
             ) : (
                "Fill readings to calculate Creep"
             )}
           </div>
           <Badge status={!res.complete ? "pending" : res.creepPass ? "pass" : "fail"} />
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
         <h3 className="font-bold text-slate-800 border-b pb-2 mb-4 text-lg">Zero Return</h3>
         <div className="grid md:grid-cols-2 gap-4">
            <Field label="Zero Before Load"><TextInput type="number" value={creepTest.zeroBefore} onChange={set("zeroBefore")} /></Field>
            <Field label="Zero After Load (30m)"><TextInput type="number" value={creepTest.zeroAfter} onChange={set("zeroAfter")} /></Field>
         </div>
         <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm font-mono text-slate-600 font-bold">
             {res.complete ? <>Deviation = <span className="text-indigo-600">{fmt(res.zrDiff)}</span> (Limit ≤{fmt(0.5*res.e)})</> : "Fill readings to calculate deviation"}
            </div>
            <Badge status={!res.complete ? "pending" : res.zrPass ? "pass" : "fail"} />
         </div>
      </div>
      
      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Tare Test" />
    </SectionCard>
  );
}

function TareDeviceStep({ tareTest, setTareTest, resultFn, unit, maxN, obs, setObs, onBack, onNext }) {
  const set = (k) => (e) => setTareTest((s) => ({ ...s, [k]: e.target.value }));
  const res = resultFn();
  const suggestedTare = round(maxN / 2, 2);
  const suggestedTest = round(maxN / 4, 2);

  return (
    <SectionCard title="Tare Device Test">
      <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Step 1: Tare Zero-Setting</h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
          <Field label={`Tare load applied (${unit})`}><TextInput type="number" value={tareTest.tareLoad} onChange={set("tareLoad")} placeholder={fmt(suggestedTare)} /></Field>
          <Field label="Indication after taring (≈0)"><TextInput type="number" value={tareTest.zeroAfterTare} onChange={set("zeroAfterTare")} /></Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Setting Result:</span> <Badge status={!res.complete ? "pending" : res.zeroPass ? "pass" : "fail"} />
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Step 2: Net Weighing Accuracy</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Field label={`Net test load (${unit})`}><TextInput type="number" value={tareTest.testLoad} onChange={set("testLoad")} placeholder={fmt(suggestedTest)} /></Field>
          <Field label="Net indication (I)"><TextInput type="number" value={tareTest.I} onChange={set("I")} /></Field>
          <Field label="ΔL to next division"><TextInput type="number" value={tareTest.deltaL} onChange={set("deltaL")} /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">Accuracy Result:</span> 
              <Badge status={!res.complete ? "pending" : res.net?.pass ? "pass" : "fail"} />
           </div>
           {res.complete && res.net?.complete && (
              <span className="font-mono text-sm font-bold text-slate-600">
                Ec = {fmt(res.net.Ec)} (Limit: ±{fmt(res.net.mpe)})
              </span>
           )}
        </div>
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Generate Final Certificate" />
    </SectionCard>
  );
}

/* ---------------------------------------------------------------- */
/* Report / Print Layout                                             */
/* ---------------------------------------------------------------- */

function CertCell({ children, center }) {
  return <td className={`border border-black px-2 py-1.5 align-middle text-black ${center ? 'text-center' : ''}`}>{children}</td>;
}
function CertHead({ children }) {
  return <th className="border border-black px-2 py-2 align-middle text-center font-bold bg-slate-100 text-black leading-tight">{children}</th>;
}

function ReportStep({ instrument, maxN, unit, nIntervals, mpeAtMax, observations,
  accuracyOverall, discOverall, eccOverall, repOverall, visualOverall, zeroTrackOverall, tareOverall, creepOverall, overallVerdict, onBack
}) {
  const stamped = overallVerdict === "pass" ? "Yes" : overallVerdict === "fail" ? "No" : "Pending";
  const nextDue = instrument.date ? new Date(new Date(instrument.date).setFullYear(new Date(instrument.date).getFullYear() + 1)).toISOString().slice(0,10) : "—";
  
  const hasObservations = Object.values(observations).some(val => val.trim() !== "");

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-6 print:hidden border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800" style={{ color: '#000000' }}>Certificate Preview</h2>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
          <Printer size={18} /> Print Official PDF
        </button>
      </div>

      {overallVerdict === "pending" && (
        <div className="rounded-xl p-4 text-sm font-bold mb-6 flex items-center gap-3 bg-amber-50 text-amber-800 border border-amber-200 print:hidden">
          <AlertTriangle size={20} /> Tests incomplete. The certificate reflects current progress.
        </div>
      )}

      {/* Printable Area - Forced black and white, strict borders */}
      <div className="print:block bg-white text-black print:p-0 p-8 border border-slate-300 rounded-xl max-w-4xl mx-auto shadow-sm">
        
        <div className="text-center mb-6">
          <h1 className="font-black text-2xl tracking-widest uppercase" style={{ color: '#000000' }}>Government Approved Test Centre</h1>
          <div className="text-sm font-bold mt-1">({instrument.gatcNo || "—"})</div>
          <h2 className="font-bold text-xl mt-4 uppercase border-b-2 border-black inline-block pb-1" style={{ color: '#000000' }}>Certificate of Verification</h2>
        </div>

        <div className="text-center text-sm mb-6 font-semibold">
          {instrument.labName || "—"}, {instrument.labAddress || "—"}, Ph: {instrument.labPhone || "—"}
        </div>

        <div className="flex justify-between text-sm mb-6 font-bold">
          <div>Certificate No: <span className="font-normal underline decoration-black underline-offset-4">{instrument.certNo || "—"}</span></div>
          <div>Date: <span className="font-normal underline decoration-black underline-offset-4">{instrument.date || "—"}</span></div>
        </div>

        <p className="text-sm mb-6 leading-relaxed text-justify">
          I hereby certify that I have this day verified and stamped/rejected the under mentioned Non-automatic weighing instrument(s) of Accuracy Class <b>{instrument.accuracyClass}</b> (upto <b>{fmt(maxN)} {unit}</b>), etc. belonging to M/s- <b>{instrument.ownerName || "—"}</b>, Address- <b>{instrument.ownerAddress || "—"}</b>, Ph:- <b>{instrument.ownerPhone || "N/A"}</b>.
        </p>

        <div className="mb-6">
          <table className="w-full border-collapse text-xs border border-black">
            <thead>
              <tr>
                <CertHead>Type</CertHead><CertHead>Make/Model</CertHead><CertHead>Sr. No.</CertHead>
                <CertHead>Year Mfg</CertHead><CertHead>Class</CertHead><CertHead>Max</CertHead>
                <CertHead>Min</CertHead><CertHead>e / d</CertHead><CertHead>n (Max/e)</CertHead><CertHead>MPE</CertHead>
              </tr>
            </thead>
            <tbody>
              <tr>
                <CertCell center>{instrument.instrumentType || "—"}</CertCell>
                <CertCell center>{instrument.make || "—"}</CertCell>
                <CertCell center>{instrument.srNo || "—"}</CertCell>
                <CertCell center>{instrument.yearOfMfg || "—"}</CertCell>
                <CertCell center>{instrument.accuracyClass}</CertCell>
                <CertCell center>{instrument.max} {unit}</CertCell>
                <CertCell center>{instrument.min} {unit}</CertCell>
                <CertCell center>{instrument.e} / {instrument.d || instrument.e}</CertCell>
                <CertCell center>{nIntervals}</CertCell>
                <CertCell center>±{fmt(mpeAtMax)}</CertCell>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <table className="w-full border-collapse text-[11px] border border-black">
            <thead>
              <tr>
                <CertHead>Visual</CertHead><CertHead>Zero</CertHead>
                <CertHead>Eccentric</CertHead><CertHead>Repeat</CertHead>
                <CertHead>Accuracy</CertHead><CertHead>Creep</CertHead>
                <CertHead>Tare</CertHead><CertHead>Temp/RH</CertHead>
                <CertHead>Seal Affixed (ID)</CertHead>
                <CertHead>RESULT</CertHead>
              </tr>
            </thead>
            <tbody>
              <tr>
                <CertCell center><b className="uppercase">{visualOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{zeroTrackOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{eccOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{repOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{accuracyOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{creepOverall.status}</b></CertCell>
                <CertCell center><b className="uppercase">{tareOverall.status}</b></CertCell>
                <CertCell center>{instrument.ambientTemp}°C / {instrument.relHumidity}%</CertCell>
                <CertCell center>{overallVerdict === "pass" ? "Yes" : "No"} <br/>({instrument.sealNo || "—"})</CertCell>
                <CertCell center><span className="text-sm font-black uppercase">{overallVerdict}</span></CertCell>
              </tr>
            </tbody>
          </table>
        </div>

        {hasObservations && (
          <div className="mb-6 p-4 border border-black text-xs">
            <div className="font-bold uppercase mb-2">Engineer Remarks & Observations:</div>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(observations).map(([key, val]) => {
                if(val.trim() === "") return null;
                const label = STEPS.find(s => s.id === key)?.label || key;
                return <li key={key}><b>{label}:</b> {val}</li>;
              })}
            </ul>
          </div>
        )}

        <div className="text-xs space-y-3 mb-8 px-2">
          <div className="grid grid-cols-12"><div className="col-span-4 font-bold">Discrimination Test:</div><div className="col-span-8 uppercase font-bold">{discOverall.status}</div></div>
          <div className="grid grid-cols-12"><div className="col-span-4 font-bold">Model Approval No(s):</div><div className="col-span-8">{instrument.modelApprovalNo || "—"}</div></div>
          <div className="grid grid-cols-12"><div className="col-span-4 font-bold">Verification Fee:</div><div className="col-span-8">Rs. {instrument.verificationFee || "—"} (MR No. {instrument.receiptNo || "—"}, Dt: {instrument.receiptDate || "—"})</div></div>
          <div className="grid grid-cols-12 font-bold"><div className="col-span-4">Next Verification Due:</div><div className="col-span-8 underline">{nextDue}</div></div>
        </div>

        <div className="text-xs mb-16 border border-black p-4">
          <div className="font-bold uppercase mb-2">Declaration & Notes:</div>
          <div className="space-y-1">
            <div>1. Instrument conforms to OIML Recommendation / LM (Gen) Rules, 2011.</div>
            <div>2. Verified and stamped for use in commercial transactions: <b>{stamped}</b>.</div>
            <div className="flex gap-4 mt-2">
              <span>{instrument.verifiedWhere === "premises" ? "☑" : "☐"} i. In premises of GATC</span>
              <span>{instrument.verifiedWhere === "insitu" ? "☑" : "☐"} ii. In-situ at place of user</span>
            </div>
            <div className="mt-2 text-[10px]">3. In case of rejected instruments, a separate certificate of rejection stating reasons against each item shall be issued.</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-10 text-center">
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
            <div className="font-bold text-sm">Calibration Engineer</div>
            <div className="text-xs">{instrument.calibrationEngineer || "—"}</div>
          </div>
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
            <div className="font-bold text-sm">Principal Officer</div>
            <div className="text-xs">{instrument.principalOfficer || "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 print:hidden">
        <NavButtons onBack={onBack} onNext={() => window.print()} nextLabel="Print Certificate" backLabel="Back" />
      </div>
    </SectionCard>
  );
}
