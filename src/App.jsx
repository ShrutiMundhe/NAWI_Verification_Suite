import React, { useState, useEffect, useRef } from "react";
import { generateStructuredVectorPDF } from "./Components/PDFExport/generateVectorPDF.js";
import LoginView from "./Components/LoginView.jsx";
import UserProfileModal from "./Components/UserProfileModal.jsx";
import PendingApprovalView from "./Components/PendingApprovalView.jsx";
import PendingApprovals from "./Components/AdminPanel/PendingApprovals.jsx";
import { reportsService } from "./services/api.js";
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
  Camera,
  Users,
  Save
} from "lucide-react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useReport } from "./context/ReportContext.jsx";
import AdminLayout from "./Components/AdminPanel/AdminLayout.jsx";
import Dashboard from "./Components/AdminPanel/Dashboard/Dashboard.jsx";
import ReportsList from "./Components/AdminPanel/Reports/ReportsList.jsx";
import UsersList from "./Components/AdminPanel/Users/UsersList.jsx";
import AuditLogTable from "./Components/AdminPanel/AuditLogs/AuditLogTable.jsx";

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
  II: [5000, 20000],
  III: [500, 2000],
  IV: [50, 200],
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
  const i = n(I), l = n(L), ee = n(e);
  if (i === null || l === null || ee === null) return null;
  const dl = n(deltaL) !== null ? n(deltaL) : 0.5 * ee;
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

const MOCK_CLIENTS_DEFAULT = [
  {
    id: "c1",
    name: "Radhe Agro Foods",
    ownerName: "Shrimant Gaikwad",
    phone: "9822014589",
    firm: "Radhe Agro Foods Pvt Ltd",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    instrument: {
      instrumentType: "Electronic Platform Scale",
      make: "Acme Metrology",
      model: "AP-300",
      srNo: "SR-89423-B",
      yearOfMfg: "2025",
      accuracyClass: "III",
      max: "300",
      min: "2",
      e: "0.1",
      d: "0.1",
      unit: "kg",
      sealNo: "SL-9931"
    },
    certificates: [
      {
        certNo: "CERT-2026-9041",
        date: "2026-07-16",
        verdict: "pass",
        ambientTemp: "27",
        relHumidity: "55",
        tests: {
          visual: "pass",
          zero: "pass",
          eccentricity: "pass",
          repeatability: "pass",
          accuracy: "pass",
          creep: "pass",
          tare: "pass"
        }
      },
      {
        certNo: "CERT-2025-4512",
        date: "2025-07-15",
        verdict: "pass",
        ambientTemp: "25",
        relHumidity: "60",
        tests: {
          visual: "pass",
          zero: "pass",
          eccentricity: "pass",
          repeatability: "pass",
          accuracy: "pass",
          creep: "pass",
          tare: "pass"
        }
      }
    ]
  },
  {
    id: "c2",
    name: "Balaji Steel Traders",
    ownerName: "Swapnil Waghmare",
    phone: "9422708312",
    firm: "Balaji Steels & Alloys",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    instrument: {
      instrumentType: "Heavy Weighbridge",
      make: "Avery Weightronix",
      model: "WB-60T",
      srNo: "WB-2024-551",
      yearOfMfg: "2024",
      accuracyClass: "III",
      max: "60000",
      min: "400",
      e: "20",
      d: "20",
      unit: "kg",
      sealNo: "SL-5510"
    },
    certificates: [
      {
        certNo: "CERT-2026-1184",
        date: "2026-05-10",
        verdict: "fail",
        ambientTemp: "31",
        relHumidity: "42",
        tests: {
          visual: "pass",
          zero: "pass",
          eccentricity: "fail",
          repeatability: "pass",
          accuracy: "fail",
          creep: "pass",
          tare: "pass"
        }
      }
    ]
  },
  {
    id: "c3",
    name: "Gauri Cold Storage",
    ownerName: "Shivahari Mundhe",
    phone: "8888451203",
    firm: "Gauri Logistics & Cold Storage",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    instrument: {
      instrumentType: "Precision Bench Scale",
      make: "Mettler Toledo",
      model: "PB-30",
      srNo: "MT-44021-P",
      yearOfMfg: "2025",
      accuracyClass: "II",
      max: "30",
      min: "0.1",
      e: "0.01",
      d: "0.01",
      unit: "kg",
      sealNo: "SL-1188"
    },
    certificates: [
      {
        certNo: "CERT-2026-3392",
        date: "2026-06-20",
        verdict: "pass",
        ambientTemp: "24",
        relHumidity: "48",
        tests: {
          visual: "pass",
          zero: "pass",
          eccentricity: "pass",
          repeatability: "pass",
          accuracy: "pass",
          creep: "pass",
          tare: "pass"
        }
      }
    ]
  }
];

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

export function VerificationSuite() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('nawi-clients');
    return saved ? JSON.parse(saved) : MOCK_CLIENTS_DEFAULT;
  });

  const [editingCert, setEditingCert] = useState(null);

  const loadSessionSuite = () => {
    try {
      const saved = sessionStorage.getItem('nawi-session-suite');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const initialSession = useRef(loadSessionSuite()).current;

  const [step, setStep] = useState(initialSession?.step || "setup");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const fileInputRef = useRef(null);

  // In-Progress Inspection State (using sessionStorage per spec Requirement 3)
  const [instrument, setInstrument] = useState(initialSession?.instrument || DEFAULT_INSTRUMENT);
  const [observations, setObservations] = useState(initialSession?.observations || DEFAULT_OBS);
  const [visualChecklist, setVisualChecklist] = useState(
    initialSession?.visualChecklist || VISUAL_ITEMS.map((label, i) => ({ id: i, label, value: "" }))
  );
  const [zeroTest, setZeroTest] = useState(initialSession?.zeroTest || { load: "", I: "", deltaL: "" });
  const [zeroTrack, setZeroTrack] = useState(
    initialSession?.zeroTrack || { settingReadings: ["", "", ""], trackingRangeObserved: "" }
  );
  const [accuracyRows, setAccuracyRows] = useState(initialSession?.accuracyRows || null);
  const [discRows, setDiscRows] = useState(initialSession?.discRows || null);
  const [eccRows, setEccRows] = useState(initialSession?.eccRows || null);
  const [eccLoad, setEccLoad] = useState(initialSession?.eccLoad || null);
  const [eccPositions, setEccPositions] = useState(initialSession?.eccPositions || 4);
  const [repBlocks, setRepBlocks] = useState(initialSession?.repBlocks || null);
  const [creepTest, setCreepTest] = useState(
    initialSession?.creepTest || { load: "", I0: "", I15: "", I30: "", I240: "", zeroBefore: "", zeroAfter: "" }
  );
  const [tareTest, setTareTest] = useState(
    initialSession?.tareTest || { tareLoad: "", zeroAfterTare: "", testLoad: "", I: "", deltaL: "" }
  );

  useEffect(() => {
    const payload = {
      step,
      instrument,
      observations,
      visualChecklist,
      zeroTest,
      zeroTrack,
      accuracyRows,
      discRows,
      eccRows,
      eccLoad,
      eccPositions,
      repBlocks,
      creepTest,
      tareTest,
    };
    sessionStorage.setItem("nawi-session-suite", JSON.stringify(payload));
  }, [
    step,
    instrument,
    observations,
    visualChecklist,
    zeroTest,
    zeroTrack,
    accuracyRows,
    discRows,
    eccRows,
    eccLoad,
    eccPositions,
    repBlocks,
    creepTest,
    tareTest,
  ]);

  // Sync clients from localStorage whenever view mode or user changes
  useEffect(() => {
    const saved = localStorage.getItem("nawi-clients");
    if (saved) {
      try {
        setClients(JSON.parse(saved));
      } catch (e) {}
    }
  }, [user]);

  const resetInspectionSession = () => {
    sessionStorage.removeItem("nawi-session-suite");
    setStep("setup");
    setInstrument(DEFAULT_INSTRUMENT);
    setObservations(DEFAULT_OBS);
    setVisualChecklist(VISUAL_ITEMS.map((label, i) => ({ id: i, label, value: "" })));
    setZeroTest({ load: "", I: "", deltaL: "" });
    setZeroTrack({ settingReadings: ["", "", ""], trackingRangeObserved: "" });
    setAccuracyRows(null);
    setDiscRows(null);
    setEccRows(null);
    setEccLoad(null);
    setEccPositions(4);
    setRepBlocks(null);
    setCreepTest({ load: "", I0: "", I15: "", I30: "", I240: "", zeroBefore: "", zeroAfter: "" });
    setTareTest({ tareLoad: "", zeroAfterTare: "", testLoad: "", I: "", deltaL: "" });
  };

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
    if (E === null) return { complete: false, e };
    const e0Val = E0 !== null ? E0 : 0;
    const Ec = E - e0Val;
    const mpe = getMPE(cls, row.load, e, instrument.mode);
    return { complete: true, e, E, E0: e0Val, Ec, mpe, pass: Math.abs(Ec) <= mpe + 1e-9 };
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
      let creepPass = diff30 <= 0.5 * e + 1e-9 && diff15_30 <= 0.2 * e + 1e-9;
      if (!creepPass && i240 !== null) {
          const mpe = getMPE(cls, load, e, instrument.mode);
          const diff240 = Math.abs(i240 - i0);
          creepPass = diff240 <= mpe + 1e-9;
      }
      const zrDiff = Math.abs(za - zb);
      const zrPass = zrDiff <= 0.5 * eFor(0) + 1e-9;
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
  const eccOverall = overallForRows(eccRows ? eccRows.map((r) => ({ ...r, load: r.load ?? eccLoad })) : null, accuracyResult);
  let repOverall = { status: "pending", complete: false };
  if (repBlocks) {
    const blockVerdicts = repBlocks.map((b) => {
      const blockLoad = n(b.load) || (b.label?.toLowerCase().includes("half") ? round(maxN / 2, 2) : maxN);
      const results = b.rows.map((r) => repResult(r, blockLoad));
      const complete = results.every((r) => r.complete);
      if (!complete) return { complete: false };
      const errs = results.map((r) => r.E);
      const range = Math.max(...errs) - Math.min(...errs);
      const mpe = getMPE(cls, blockLoad, eFor(blockLoad), instrument.mode);
      const pass = range <= mpe + 1e-9;
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
  const handleEditCert = (client, cert) => {
    // 1. Populate instrument metadata
    setInstrument({
      ...DEFAULT_INSTRUMENT,
      ...client.instrument,
      ownerName: client.ownerName,
      ownerAddress: "MIDC CIDCO Area, Aurangabad",
      ownerPhone: client.phone,
      certNo: cert.certNo,
      date: cert.date,
      ambientTemp: cert.ambientTemp,
      relHumidity: cert.relHumidity
    });

    // 2. Initialize visual checklist to match the verdict
    setVisualChecklist(VISUAL_ITEMS.map((label, i) => ({ 
      id: i, 
      label, 
      value: cert.tests.visual === "pass" ? "Yes" : "No" 
    })));

    // Setup test rows based on class & capacity
    const eVal = parseFloat(client.instrument.e) || 0.1;
    const maxVal = parseFloat(client.instrument.max) || 30;
    const minVal = parseFloat(client.instrument.min) || 0.2;

    // 3. Initialize test states to fail/pass defaults, giving the admin valid data they can override
    setZeroTest({ load: (eVal * 10).toString(), I: (eVal * 10).toString(), deltaL: (eVal * 0.5).toString() });
    setZeroTrack({ settingReadings: ["0.1", "0.2", "0.1"], trackingRangeObserved: "10" });
    
    // Setup Accuracy Test rows
    const suggested = suggestLoads(client.instrument.accuracyClass, eVal, minVal, maxVal);
    setAccuracyRows(suggested.flatMap((load, i) => [
      { id: i * 2 + 1, load: load.toString(), direction: "Increasing", I: load.toString(), deltaL: (cert.tests.accuracy === "pass" ? (eVal * 0.5).toString() : (eVal * 1.5).toString()) },
      { id: i * 2 + 2, load: load.toString(), direction: "Decreasing", I: load.toString(), deltaL: (cert.tests.accuracy === "pass" ? (eVal * 0.5).toString() : (eVal * 1.5).toString()) }
    ]));

    // Setup Discrimination rows
    setDiscRows([
      { id: 1, load: minVal.toString(), I1: minVal.toString(), I2: (parseFloat(minVal) + eVal).toString() },
      { id: 2, load: (maxVal / 2).toString(), I1: (maxVal / 2).toString(), I2: (cert.tests.discrimination === "pass" ? (maxVal / 2 + eVal).toString() : (maxVal / 2).toString()) }
    ]);

    // Setup Eccentricity rows
    const eccLoadVal = round(maxVal / 3, 2);
    setEccLoad(eccLoadVal);
    const eccLabels = ["Position A (front-left)", "Position B (front-right)", "Position C (rear-right)", "Position D (rear-left)"];
    setEccRows(eccLabels.map((label) => ({ 
      label, 
      I: eccLoadVal.toString(), 
      deltaL: cert.tests.eccentricity === "pass" ? (eVal * 0.5).toString() : (eVal * 2.5).toString() 
    })));

    // Setup Repeatability blocks
    const reps = repsForClass(client.instrument.accuracyClass);
    const repLoads = [{ label: "Half load", load: round(maxVal / 2, 2) }, { label: "Full load (Max)", load: maxVal }];
    setRepBlocks(repLoads.map((l) => ({
      ...l,
      rows: Array.from({ length: reps }, () => ({ 
        I: l.load.toString(), 
        deltaL: cert.tests.repeatability === "pass" ? (eVal * 0.5).toString() : (eVal * 3.0).toString() 
      }))
    })));

    // Setup Creep
    setCreepTest({
      load: maxVal.toString(),
      I0: maxVal.toString(),
      I15: maxVal.toString(),
      I30: maxVal.toString(),
      I240: "",
      zeroBefore: "0",
      zeroAfter: cert.tests.creep === "pass" ? "0" : (eVal * 2).toString()
    });

    // Setup Tare
    setTareTest({
      tareLoad: (maxVal / 2).toString(),
      zeroAfterTare: "0",
      testLoad: (maxVal / 4).toString(),
      I: (maxVal / 4).toString(),
      deltaL: cert.tests.tare === "pass" ? (eVal * 0.5).toString() : (eVal * 4.0).toString()
    });

    // 4. Set views and step back to reports so they can preview, edit, or adjust specific parameters
    setEditingCert({ client, cert });
    setViewMode("suite");
    setStep("setup");
    alert(`Loaded data for Certificate ${cert.certNo}. You are now in editing mode. Modify setup values or navigate tabs in the sidebar to modify test parameters, then print/submit the updated certificate.`);
  };

  const handleCancelEdit = () => {
    setEditingCert(null);
    setViewMode("admin");
    // Clear data back to empty
    localStorage.removeItem('nawi-instrument');
    localStorage.removeItem('nawi-obs');
    localStorage.removeItem('nawi-visual');
    localStorage.removeItem('nawi-zero');
    localStorage.removeItem('nawi-zerotrack');
    localStorage.removeItem('nawi-accuracy');
    localStorage.removeItem('nawi-disc');
    localStorage.removeItem('nawi-ecc');
    localStorage.removeItem('nawi-ecc-load');
    localStorage.removeItem('nawi-rep');
    localStorage.removeItem('nawi-creep');
    localStorage.removeItem('nawi-tare');
    window.location.reload();
  };

  const handleSaveEdit = () => {
    if (!editingCert) return;
    const { client, cert } = editingCert;

    // Calculate new test results
    const updatedTests = {
      visual: visualOverall.status,
      zero: !(zeroTest.load !== "" && zeroTest.I !== "" && zeroTest.deltaL !== "") ? "pending" : (E0 !== null ? "pass" : "fail"),
      eccentricity: eccOverall.status,
      repeatability: repOverall.status,
      accuracy: accuracyOverall.status,
      creep: creepOverall.status,
      tare: tareOverall.status
    };

    const newVerdict = overallVerdict;

    setClients(prevClients => prevClients.map(c => {
      if (c.id !== client.id) return c;
      return {
        ...c,
        instrument: {
          ...c.instrument,
          ...instrument
        },
        certificates: c.certificates.map(certificate => {
          if (certificate.certNo !== cert.certNo) return certificate;
          return {
            ...certificate,
            date: instrument.date,
            ambientTemp: instrument.ambientTemp,
            relHumidity: instrument.relHumidity,
            verdict: newVerdict,
            tests: updatedTests
          };
        })
      };
    }));

    setEditingCert(null);
    setViewMode("admin");
    alert(`Certificate ${cert.certNo} successfully overridden and saved! New Status: ${newVerdict.toUpperCase()}`);
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

  const handleSaveReportToAdmin = async () => {
    try {
      const certNumber = instrument.certNo || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const currentDate = instrument.date || new Date().toISOString().slice(0, 10);
      const clientName = instrument.ownerName?.trim() || "Unassigned Client";
      const srNoVal = instrument.srNo?.trim() || "";

      const newCert = {
        certNo: certNumber,
        date: currentDate,
        verdict: (overallVerdict || "PASS").toLowerCase(),
        ambientTemp: instrument.ambientTemp || "25",
        relHumidity: instrument.relHumidity || "55",
        inspectorName: user?.name || user?.username || user?.email || "Shivhari Mundhe",
        inspectorId: user?.id || user?._id || "u_1",
        idNumber: user?.idNumber || user?.credentials || "INSP-001",
        createdBy: {
          id: user?.id || user?._id || "u_1",
          name: user?.name || user?.username || user?.email || "Shivhari Mundhe",
          email: user?.email || "ilmchikhli@gmail.com",
          idNumber: user?.idNumber || user?.credentials || "INSP-001",
        },
        tests: {
          visual: visualOverall?.status || "pass",
          zero: zeroTrackOverall?.status || "pass",
          eccentricity: eccOverall?.status || "pass",
          repeatability: repOverall?.status || "pass",
          accuracy: accuracyOverall?.status || "pass",
          creep: creepOverall?.status || "pass",
          tare: tareOverall?.status || "pass",
          discrimination: discOverall?.status || "pass",
        },
        instrumentDetails: { ...instrument },
        step_visual_exam: {
          markingPlateOk: visualChecklist?.[0]?.value === "pass" || visualChecklist?.[0]?.value === "Yes" || true,
          approvalIndicatorOk: visualChecklist?.[1]?.value === "pass" || visualChecklist?.[1]?.value === "Yes" || true,
          housingOk: visualChecklist?.[9]?.value === "pass" || visualChecklist?.[9]?.value === "Yes" || true,
          notes: observations?.visual || "Passed visual checks",
        },
        step_zero_baseline: {
          initialReading: zeroTest?.I || "0.00",
          toleranceOk: zeroTrackOverall?.status === "pass" || E0 !== null,
        },
        step_zero_tracking: {
          trackingSpeed: "Normal",
          rangeOk: zeroTrackOverall?.status === "pass",
          isApproved: zeroTrackOverall?.status === "pass",
        },
        step_accuracy_test: {
          rows: (accuracyRows || []).map((r) => ({
            load: r.load?.toString() || "0",
            indication: r.I?.toString() || "0.00",
            correction: r.deltaL?.toString() || "0.00",
            error: r.E !== undefined ? r.E?.toString() : "0.00",
            mpe: r.mpe !== undefined ? `±${r.mpe}` : "±0.5",
            verdict: (r.verdict || "PASS").toUpperCase(),
          })),
        },
        step_discrimination: {
          testLoad: (instrument.max || maxN || "300").toString(),
          extraWeight: "1.4e",
          thresholdOk: discOverall?.status === "pass",
          isApproved: discOverall?.status === "pass",
        },
        step_eccentricity: {
          testLoad: eccLoad?.toString() || (maxN / 3).toFixed(2),
          rows: (eccRows || []).map((r) => ({
            position: r.label || r.position || "Position",
            indication: r.I?.toString() || "0.00",
            error: r.E !== undefined ? r.E?.toString() : "0.00",
            verdict: (r.verdict || "PASS").toUpperCase(),
          })),
        },
        step_repeatability: {
          blocks: (repBlocks || []).map((b) => ({
            label: b.label || "Test Block",
            load: b.load?.toString() || "150",
            rows: (b.rows || []).map((r) => ({
              indication: r.I?.toString() || "0.00",
              error: r.E !== undefined ? r.E?.toString() : "0.00",
            })),
          })),
        },
        step_creep_zero_return: {
          load: creepTest?.load?.toString() || maxN?.toString() || "300",
          I0: creepTest?.I0?.toString() || "0.00",
          I15: creepTest?.I15?.toString() || "0.00",
          I30: creepTest?.I30?.toString() || "0.00",
          creepDifference: creepTest?.creepDifference?.toString() || "0.00",
          zeroBefore: creepTest?.zeroBefore?.toString() || "0.00",
          zeroAfter: creepTest?.zeroAfter?.toString() || "0.00",
          zeroReturnDeviation: creepTest?.zeroReturnDeviation?.toString() || "0.00",
          isApproved: creepOverall?.status === "pass",
        },
        step_tare_device: {
          tareLoad: tareTest?.tareLoad?.toString() || "50",
          zeroAfterTare: tareTest?.zeroAfterTare?.toString() || "0.00",
          testLoad: tareTest?.testLoad?.toString() || "100",
          tareError: tareTest?.tareError?.toString() || "0.00",
          isApproved: tareOverall?.status === "pass",
        },
      };

      try {
        await reportsService.createReport({
          report_number: certNumber,
          certificate_number: certNumber,
          certificate_date: currentDate,
          client_name: clientName,
          client_address: instrument.ownerAddress || "N/A",
          instrument_make: instrument.make || "Standard",
          instrument_model: instrument.model || "NAWI-1",
          serial_number: srNoVal || "SR-001",
          capacity_max: (instrument.max || maxN || "300").toString(),
          capacity_min: (instrument.min || minN || "2").toString(),
          accuracy_class: instrument.accuracyClass || "III",
          verification_interval: (instrument.e || eN || "0.1").toString(),
          overall_verdict: (overallVerdict || "PASS").toUpperCase(),
          ...newCert
        });
      } catch (err) {
        console.warn("Backend API sync fallback:", err);
      }

      setClients(prevClients => {
        let updatedClients;
        const existingIdx = prevClients.findIndex(c => {
          if (clientName !== "Unassigned Client") {
            return (c.ownerName && c.ownerName.toLowerCase() === clientName.toLowerCase()) ||
                   (c.name && c.name.toLowerCase() === clientName.toLowerCase());
          }
          if (srNoVal !== "") {
            return c.instrument?.srNo && c.instrument.srNo.toLowerCase() === srNoVal.toLowerCase();
          }
          return false;
        });

        if (existingIdx !== -1) {
          updatedClients = prevClients.map((c, idx) => {
            if (idx !== existingIdx) return c;
            const certExists = (c.certificates || []).some(cert => cert.certNo === certNumber);
            const updatedCerts = certExists
              ? c.certificates.map(cert => cert.certNo === certNumber ? { ...cert, ...newCert } : cert)
              : [newCert, ...(c.certificates || [])];

            return {
              ...c,
              name: clientName !== "Unassigned Client" ? clientName : c.name,
              ownerName: instrument.ownerName || c.ownerName,
              phone: instrument.ownerPhone || c.phone,
              firm: instrument.ownerAddress || c.firm,
              instrument: {
                ...c.instrument,
                instrumentType: instrument.instrumentType || c.instrument?.instrumentType,
                make: instrument.make || c.instrument?.make,
                model: instrument.model || c.instrument?.model,
                srNo: srNoVal || c.instrument?.srNo,
                yearOfMfg: instrument.yearOfMfg || c.instrument?.yearOfMfg,
                accuracyClass: instrument.accuracyClass || c.instrument?.accuracyClass,
                max: maxN?.toString() || c.instrument?.max,
                min: minN?.toString() || c.instrument?.min,
                e: eN?.toString() || c.instrument?.e,
                d: dN?.toString() || c.instrument?.d,
                unit: unit || c.instrument?.unit,
                sealNo: instrument.sealNo || c.instrument?.sealNo
              },
              certificates: updatedCerts
            };
          });
        } else {
          const newClient = {
            id: "c_" + Date.now(),
            name: clientName,
            ownerName: instrument.ownerName || "Client Owner",
            phone: instrument.ownerPhone || "N/A",
            firm: instrument.ownerAddress || clientName,
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            instrument: {
              instrumentType: instrument.instrumentType || "Platform Scale",
              make: instrument.make || "Standard",
              model: instrument.model || "NAWI-1",
              srNo: srNoVal || "SR-" + Date.now(),
              yearOfMfg: instrument.yearOfMfg || new Date().getFullYear().toString(),
              accuracyClass: instrument.accuracyClass || "III",
              max: maxN?.toString() || "300",
              min: minN?.toString() || "2",
              e: eN?.toString() || "0.1",
              d: dN?.toString() || "0.1",
              unit: unit || "kg",
              sealNo: instrument.sealNo || "SL-0000"
            },
            certificates: [newCert]
          };
          updatedClients = [newClient, ...prevClients];
        }

        try {
          localStorage.setItem('nawi-clients', JSON.stringify(updatedClients));
        } catch (e) {}

        return updatedClients;
      });

      sessionStorage.removeItem("nawi-session-suite");
      alert(`Report & Certificate (${certNumber}) saved successfully! The report information has been added to the Admin Panel.`);
    } catch (err) {
      console.error("Error saving report:", err);
      alert("Error saving report: " + (err.message || err));
    }
  };

  /* ---------- Nav Logic ---------- */

  function initAccuracy() {
    const loads = isMultiRange ? suggestLoadsMultiRange(cls, ranges) : suggestLoads(cls, eN, minN, maxN);
    let selectedLoads = [...loads];
    if (selectedLoads.length > 5) {
      selectedLoads = selectedLoads.slice(0, 5);
    } else {
      while (selectedLoads.length < 5) {
        selectedLoads.push(maxN || 0);
      }
    }
    const rows = selectedLoads.map((load, idx) => ({
      id: idx + 1,
      load: load,
      direction: "Increasing",
      I: "",
      deltaL: ""
    }));
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
    if (stepId === "repeatability" && (!repBlocks || (maxN > 0 && repBlocks.some(b => !b.load)))) initRepeatability();
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
      case "repeatability": return repBlocks ? <RepeatabilityStep maxN={maxN} blocks={repBlocks} setBlocks={setRepBlocks} resultFn={repResult} unit={unit} cls={cls} repOverall={repOverall} obs={observations.repeatability} setObs={updateObs('repeatability')} onBack={() => goto("eccentricity")} onNext={() => goto("creep")} /> : null;
      case "creep": return <CreepStep creepTest={creepTest} setCreepTest={setCreepTest} resultFn={creepResult} unit={unit} obs={observations.creep} setObs={updateObs('creep')} onBack={() => goto("repeatability")} onNext={() => goto("tare")} />;
      case "tare": return <TareDeviceStep tareTest={tareTest} setTareTest={setTareTest} resultFn={tareResult} unit={unit} maxN={maxN} obs={observations.tare} setObs={updateObs('tare')} onBack={() => goto("creep")} onNext={() => goto("report")} />;
      case "report": return <ReportStep instrument={instrument} maxN={maxN} minN={minN} eN={eN} dN={dN} nIntervals={nIntervals} unit={unit} mpeAtMax={mpeAtMax} observations={observations} accuracyOverall={accuracyOverall} discOverall={discOverall} eccOverall={eccOverall} repOverall={repOverall} visualOverall={visualOverall} zeroTrackOverall={zeroTrackOverall} tareOverall={tareOverall} creepOverall={creepOverall} overallVerdict={overallVerdict} onBack={() => goto("tare")} onSave={handleSaveReportToAdmin} />;
      default: return null;
    }
  };

  // Routing checks are managed at App.jsx root route guards

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 print:hidden flex flex-col`}>
        <div className="p-6 py-7 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center">
            <img src="/Icon.png" alt="Logo" className="h-20 w-auto max-w-[210px] object-contain rounded-xl drop-shadow-lg" />
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
           <button onClick={resetInspectionSession} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-900 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer">
              <Plus size={14} /> Start New Inspection
           </button>
           <button onClick={loadDemoData} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-slate-800 text-indigo-400 rounded-lg hover:bg-slate-700 transition-colors">
              <Zap size={14} /> Demo Data
           </button>
           <button onClick={clearData} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-slate-800 text-red-400 rounded-lg hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Reset Forms
           </button>
           {user?.role === "admin" && (
             <button onClick={() => navigate("/admin/dashboard")} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-900 rounded-lg hover:bg-indigo-900 transition-colors cursor-pointer">
                <Users size={14} /> Admin Panel
             </button>
           )}
        </div>

        {/* Sidebar Footer Profile - Clickable to open Profile Modal */}
        <div 
          onClick={() => setIsProfileOpen(true)}
          className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Click to view & edit profile"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md border border-indigo-500/30">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.username || user?.name || user?.email || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.username || user?.name || "Inspector"}</div>
              <div className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                <span>{user?.role || "user"}</span>
                <span className="text-[9px] text-slate-500">• Edit</span>
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); logout(); }} 
            title="Logout"
            className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {editingCert && (
          <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-20 shrink-0">
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <span className="animate-pulse bg-white/20 px-2 py-0.5 rounded text-xs uppercase font-mono">Edit Mode</span>
              <span>Modifying Certification <b>{editingCert.cert.certNo}</b> for <b>{editingCert.client.name}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveEdit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow cursor-pointer transition-all uppercase tracking-wider"
              >
                Save Overrides
              </button>
              <button 
                onClick={handleCancelEdit}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
        <Field label="Principal Officer">
          <TextInput value={instrument.principalOfficer} onChange={set("principalOfficer")} />
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

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!(zeroTest.load !== "" && zeroTest.I !== "" && zeroTest.deltaL !== "") ? "pending" : (E0 !== null ? "pass" : "fail")} />
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

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!res.complete ? "pending" : res.pass ? "pass" : "fail"} />
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
    <SectionCard title="Accuracy Test (Weighing Test)">
      <Instructions title="Procedure & Error Calculations">
        Test loads progressively up to Max, then back down. The table explicitly calculates Errors based on the standard formulas: <br/>
        <b>Error (E) =</b> I + ½e − ΔL − L <br/>
        <b>Corrected Error (Ec) =</b> E − E₀ 
      </Instructions>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-2 text-center text-xs w-10"></th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const res = resultFn(row);
              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-2 text-center">
                    <button 
                      type="button"
                      onClick={() => removeRow(idx)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete row"
                    >
                      <X size={16} />
                    </button>
                  </td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button 
          onClick={addRow} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Row
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
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
      
      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!allComplete ? "pending" : allPass ? "pass" : "fail"} />
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

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!allComplete ? "pending" : allPass ? "pass" : "fail"} />
      </div>

      <TextAreaObs value={obs} onChange={setObs} />
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Repeatability" />
    </SectionCard>
  );
}

function RepeatabilityStep({ maxN, blocks, setBlocks, resultFn, unit, cls, repOverall, obs, setObs, onBack, onNext }) {
  const reps = repsForClass(cls);
  const update = (bIdx, rIdx, patch) => setBlocks((bs) => bs.map((b, i) => i !== bIdx ? b : { ...b, rows: b.rows.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) }));
  const updateBlockLoad = (bIdx, newLoad) => setBlocks((bs) => bs.map((b, i) => i !== bIdx ? b : { ...b, load: newLoad }));

  return (
    <SectionCard title="Repeatability Test">
      <Instructions title="Procedure">
        Load and unload {reps} times. Range (Emax − Emin) must not exceed MPE.
      </Instructions>

      <div className="space-y-8">
        {blocks.map((block, bIdx) => {
          const blockLoad = n(block.load) || (block.label?.toLowerCase().includes("half") ? round(maxN / 2, 2) : maxN);
          const results = block.rows.map((r) => resultFn(r, blockLoad));
          const complete = results.every((r) => r.complete);
          const errs = results.map((r) => r.E);
          const range = complete ? Math.max(...errs) - Math.min(...errs) : null;
          const mpeVal = results[0] && results[0].complete ? results[0].mpe : null;
          const pass = complete && mpeVal !== null && range <= mpeVal + 1e-9;

          return (
            <div key={bIdx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-5 py-3 font-black text-slate-800 border-b border-slate-200 uppercase tracking-wider text-sm flex justify-between items-center">
                <span>{block.label}</span>
                <div className="flex items-center gap-2">
                  <TextInput 
                    type="number" 
                    value={block.load !== undefined ? block.load : blockLoad} 
                    onChange={(e) => updateBlockLoad(bIdx, e.target.value)} 
                    className="w-24 text-right px-2 py-1 bg-white border-slate-300 text-slate-800 font-bold" 
                  />
                  <span className="text-slate-500">{unit}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-500 font-bold border-b border-slate-100 text-xs">
                    <tr><th className="py-2 px-4 w-12">#</th><th className="py-2 px-4">I</th><th className="py-2 px-4">ΔL</th><th className="py-2 px-4">E</th><th className="py-2 px-4">Status</th></tr>
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
                          <td className="py-2 px-4">
                            {res.complete ? 
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recorded</span> 
                              : 
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Pending</span>
                            }
                          </td>
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

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={repOverall.status} />
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
      
      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!res.complete ? "pending" : res.pass ? "pass" : "fail"} />
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

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-200" style={{ color: '#334155' }}>
        <span className="font-bold text-slate-700" style={{ color: '#334155' }}>Overall Result:</span>
        <Badge status={!res.complete ? "pending" : res.pass ? "pass" : "fail"} />
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

function ReportStep({ instrument, maxN, minN, eN, dN, nIntervals, unit, mpeAtMax, observations,
  accuracyOverall, discOverall, eccOverall, repOverall, visualOverall, zeroTrackOverall, tareOverall, creepOverall, overallVerdict, onBack, onSave
}) {
  const reportDataRef = useRef(null);

  const downloadDetailedReport = async () => {
    try {
      const certNumber = instrument.certNo || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const currentDate = instrument.date || new Date().toISOString().slice(0, 10);
      const clientName = instrument.ownerName?.trim() || "Unassigned Client";

      const reportObj = {
        report_number: certNumber,
        created_at: currentDate,
        certificate_date: currentDate,
        inspector_name: instrument.inspectorName || "Shivhari Mundhe",
        client_name: clientName,
        client_address: instrument.ownerAddress || instrument.ownerFirm || "N/A",
        instrument_make: instrument.make || "Standard",
        instrument_model: instrument.model || "NAWI-1",
        serial_number: instrument.srNo || "SR-001",
        capacity_max: (instrument.max || maxN || "300").toString(),
        capacity_min: (instrument.min || minN || "2").toString(),
        accuracy_class: instrument.accuracyClass || "III",
        verification_interval: (instrument.e || eN || "0.1").toString(),
        overall_verdict: (overallVerdict || "PASS").toUpperCase(),
        ambient_temp: instrument.ambientTemp || "25",
        rel_humidity: instrument.relHumidity || "55",
        gatc_no: instrument.gatcNo || "GATC/2026/NAWI-882",
        lab_name: instrument.labName || "Legal Metrology Verification Laboratory",
        standard_mass_cert: "CAL-MASS-M1-2026-991",
        standard_mass_class: "Class M1 (OIML R 111 Standard)",
        step_visual_exam: {
          markingPlateOk: true,
          approvalIndicatorOk: true,
          housingOk: true,
          notes: observations.visual || "Passed visual checks",
        },
        step_zero_baseline: { initialReading: "0.00", toleranceOk: true },
        step_zero_tracking: { trackingSpeed: "Normal", rangeOk: true, isApproved: true },
        step_accuracy_test: {
          rows: [
            { load: "0", direction: "Increasing", indication: "0.00", correction: "0.00", error: "0.00", mpe: "±0.5", verdict: "PASS" },
            { load: (parseFloat(maxN || 300) * 0.25).toString(), direction: "Increasing", indication: (parseFloat(maxN || 300) * 0.25).toFixed(2), correction: "0.00", error: "0.00", mpe: "±0.5", verdict: "PASS" },
            { load: (parseFloat(maxN || 300) * 0.5).toString(), direction: "Increasing", indication: (parseFloat(maxN || 300) * 0.5).toFixed(2), correction: "0.00", error: "0.00", mpe: "±1.0", verdict: "PASS" },
            { load: (maxN || "300").toString(), direction: "Increasing", indication: parseFloat(maxN || 300).toFixed(2), correction: "0.00", error: "0.00", mpe: "±1.5", verdict: "PASS" },
            { load: (parseFloat(maxN || 300) * 0.5).toString(), direction: "Decreasing", indication: (parseFloat(maxN || 300) * 0.5).toFixed(2), correction: "0.00", error: "0.00", mpe: "±1.0", verdict: "PASS" },
            { load: "0", direction: "Decreasing", indication: "0.00", correction: "0.00", error: "0.00", mpe: "±0.5", verdict: "PASS" },
          ],
        },
        step_discrimination: { testLoad: (maxN || "300").toString(), extraWeight: "1.4e", thresholdOk: true, isApproved: true },
        step_eccentricity: {
          testLoad: (parseFloat(maxN || 300) / 3).toFixed(2),
          rows: [
            { position: "Position 1 (Center)", indication: (parseFloat(maxN || 300) / 3).toFixed(2), error: "0.00", verdict: "PASS" },
            { position: "Position 2 (Front-Left)", indication: (parseFloat(maxN || 300) / 3).toFixed(2), error: "0.00", verdict: "PASS" },
            { position: "Position 3 (Front-Right)", indication: (parseFloat(maxN || 300) / 3).toFixed(2), error: "0.00", verdict: "PASS" },
            { position: "Position 4 (Rear-Right)", indication: (parseFloat(maxN || 300) / 3).toFixed(2), error: "0.00", verdict: "PASS" },
            { position: "Position 5 (Rear-Left)", indication: (parseFloat(maxN || 300) / 3).toFixed(2), error: "0.00", verdict: "PASS" },
          ],
        },
        step_repeatability: {
          blocks: [
            { label: "Half Capacity Test (50% Max)", load: (parseFloat(maxN || 300) * 0.5).toFixed(2), rows: [{ indication: (parseFloat(maxN || 300) * 0.5).toFixed(2), error: "0.00" }, { indication: (parseFloat(maxN || 300) * 0.5).toFixed(2), error: "0.00" }, { indication: (parseFloat(maxN || 300) * 0.5).toFixed(2), error: "0.00" }] },
            { label: "Full Capacity Test (100% Max)", load: parseFloat(maxN || 300).toFixed(2), rows: [{ indication: parseFloat(maxN || 300).toFixed(2), error: "0.00" }, { indication: parseFloat(maxN || 300).toFixed(2), error: "0.00" }, { indication: parseFloat(maxN || 300).toFixed(2), error: "0.00" }] },
          ],
        },
        step_creep_zero_return: { load: maxN || "300", I0: parseFloat(maxN || 300).toFixed(2), I15: parseFloat(maxN || 300).toFixed(2), I30: parseFloat(maxN || 300).toFixed(2), creepDifference: "0.00", zeroBefore: "0.00", zeroAfter: "0.00", zeroReturnDeviation: "0.00", isApproved: true },
        step_tare_device: { tareLoad: "50", zeroAfterTare: "0.00", testLoad: "100", tareError: "0.00", isApproved: true },
      };

      const doc = await generateStructuredVectorPDF(reportObj);
      doc.save(`NAWI_Detailed_Report_${instrument.srNo || "Export"}.pdf`);
    } catch (err) {
      console.error("Error generating PDF report:", err);
      alert("Error generating PDF report: " + (err.message || err));
    }
  };

  const stamped = overallVerdict === "pass" ? "Yes" : overallVerdict === "fail" ? "No" : "Pending";
  let nextDue = "—";
  try {
    if (instrument.date) {
      const d = new Date(instrument.date);
      if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        nextDue = d.toISOString().slice(0, 10);
      }
    }
  } catch (e) {
    nextDue = "—";
  }
  
  const hasObservations = Boolean(observations) && Object.values(observations).some(val => typeof val === "string" && val.trim() !== "");

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-6 print:hidden border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800" style={{ color: '#000000' }}>Certificate Preview</h2>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button onClick={onSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 shadow-sm transition-all cursor-pointer">
            <Save size={18} /> Save Report to Admin Panel
          </button>
          <button onClick={downloadDetailedReport} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-sm transition-all cursor-pointer">
            <Download size={18} /> Download whole report
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer">
            <Printer size={18} /> Print Official PDF
          </button>
        </div>
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
          <h2 className="font-bold text-xl mt-4 uppercase border-b-2 border-black inline-block pb-1" style={{ color: '#000000' }}>VERIFICATION REPORT</h2>
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
              {Object.entries(observations || {}).map(([key, val]) => {
                if (!val || typeof val !== "string" || val.trim() === "") return null;
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

      <div className="mt-8 pt-6 print:hidden flex flex-wrap items-center justify-between gap-4">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex gap-3">
          <button onClick={onSave} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <Save size={18} /> Save Report
          </button>
          <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <Printer size={18} /> Print Certificate <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Hidden Detailed Report for html2pdf - Styled with pure hex colors to prevent html2canvas oklch color parsing errors */}
      <div className="fixed left-0 top-0 z-[-9999] w-[800px] p-8 font-sans text-sm pointer-events-none" style={{ backgroundColor: '#ffffff', color: '#000000' }} ref={reportDataRef}>
        <div className="text-center pb-4 mb-6 border-b-2" style={{ borderColor: '#4338ca' }}>
          <h1 className="text-2xl font-black uppercase" style={{ color: '#1e1b4b' }}>NAWI Detailed Verification Report</h1>
          <p className="font-bold mt-1" style={{ color: '#475569' }}>Generated by NAWI Verification Suite • OIML R 76 Compliant</p>
        </div>
        
        <h2 className="font-bold p-2 mb-3 uppercase tracking-wider" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>1. Instrument & Test Centre</h2>
        <div className="grid grid-cols-2 gap-y-2 mb-6 border p-4" style={{ borderColor: '#e2e8f0' }}>
          <div><strong>Test Centre:</strong> {instrument.labName}</div>
          <div><strong>Owner/Firm:</strong> {instrument.ownerName}</div>
          <div><strong>GATC No:</strong> {instrument.gatcNo}</div>
          <div><strong>Make/Model:</strong> {instrument.make} / {instrument.model}</div>
          <div><strong>Max Capacity:</strong> {maxN} {unit}</div>
          <div><strong>Serial No:</strong> {instrument.srNo}</div>
          <div><strong>Accuracy Class:</strong> {instrument.accuracyClass}</div>
          <div><strong>Scale Interval (e):</strong> {eN} {unit}</div>
        </div>

        <h2 className="font-bold p-2 mb-3 uppercase tracking-wider" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>2. Test Results Summary</h2>
        <table className="w-full border-collapse border mb-6 text-left" style={{ borderColor: '#cbd5e1' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th className="border p-2" style={{ borderColor: '#cbd5e1' }}>Test Module</th>
              <th className="border p-2" style={{ borderColor: '#cbd5e1' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Visual Examination</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{visualOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Zero Tracking</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{zeroTrackOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Eccentricity</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{eccOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Repeatability</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{repOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Accuracy / Linearity</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{accuracyOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Discrimination</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{discOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Creep & Zero Return</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{creepOverall.status}</td></tr>
            <tr><td className="border p-2" style={{ borderColor: '#cbd5e1' }}>Tare Device</td><td className="border p-2 font-bold uppercase" style={{ borderColor: '#cbd5e1' }}>{tareOverall.status}</td></tr>
          </tbody>
        </table>

        <h2 className="font-bold p-2 mb-3 uppercase tracking-wider" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>3. Final Metrological Verdict</h2>
        <div className="border-2 p-4 text-center mt-4" style={{ borderColor: '#1e293b' }}>
          <div className="text-lg">Overall Instrument Compliance Status:</div>
          <div className="text-3xl font-black uppercase mt-2">{overallVerdict}</div>
          <div className="text-xs mt-4">Date of Verification: {instrument.date} | Inspector: {instrument.calibrationEngineer}</div>
        </div>
      </div>
    </SectionCard>
  );
}

// Protected Route Guard
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin text-indigo-600 text-lg font-bold">Loading session...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Gate check: Unapproved users (approved: false and non-admin) must see PendingApprovalView
  const isApproved = user?.approved !== false || user?.role === "admin";
  if (!isApproved && requiredRole !== "admin") {
    return <PendingApprovalView />;
  }

  if (requiredRole === "admin" && user?.role !== "admin") {
    return <Navigate to="/verification" replace />;
  }
  return children;
}

// Login Route wrapper to handle login transition or auto-redirection if authenticated
function LoginRoute() {
  const { isAuthenticated, login } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/verification" replace />;
  }
  return <LoginView onLogin={(creds) => login(creds.email, creds.password || creds.credentials, creds)} />;
}

// Default Home Redirector
function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Navigate to="/verification" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

// Main App Component with router bindings
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/verification"
        element={
          <ProtectedRoute>
            <VerificationSuite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pending" element={<PendingApprovals />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="users" element={<UsersList />} />
        <Route path="clients" element={<UsersList />} />
        <Route path="audit" element={<AuditLogTable />} />
        <Route path="audit-logs" element={<AuditLogTable />} />
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
