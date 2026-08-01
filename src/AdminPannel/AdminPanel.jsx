import React, { useState } from "react";
import { 
  Users, Scale, Phone, Building, ShieldAlert, ShieldCheck, 
  Calendar, FileText, X, ArrowLeft, Printer, Search, Info 
} from "lucide-react";
import PDFExport from "../Components/PDFExport/PDFExport.jsx";

// Dynamic clients data is loaded as a prop from App.jsx

export default function AdminPanel({ onBackToSuite, onEditCert, clients = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);

  // Search Filter
  const filteredClients = clients.filter(client => 
    (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.ownerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.firm || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintCert = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative">
      {/* Dynamic glow decoration */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        
        {/* Header Navigation */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300 flex items-center gap-3">
              <Users size={32} className="text-indigo-400" /> Admin Console
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Weighing Instrument Registries & Certificate Audit Trails
            </p>
          </div>
          <button 
            onClick={onBackToSuite}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-all cursor-pointer self-start"
          >
            <ArrowLeft size={16} /> Back to Testing Suite
          </button>
        </header>

        {!selectedClient ? (
          /* ================= CLIENT LIST GRID ================= */
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 max-w-md">
              <Search size={18} className="text-slate-500" />
              <input 
                type="text"
                placeholder="Search by client, firm, or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/5 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={client.avatar} 
                      alt={client.ownerName} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 group-hover:border-indigo-500/30 transition-all"
                    />
                    <div>
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-lg">
                        {client.name}
                      </h3>
                      <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                        <Building size={12} className="text-slate-500" /> {client.firm}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/60 pt-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">Owner:</span>
                      <span className="text-slate-300 font-semibold">{client.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">Contact:</span>
                      <span className="text-slate-300 font-mono text-xs flex items-center gap-1">
                        <Phone size={11} className="text-slate-500" /> {client.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">Instrument:</span>
                      <span className="text-indigo-400 font-medium text-xs">{client.instrument.instrumentType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= DETAILED PROFILE & CERTIFICATE VIEW ================= */
          <div className="space-y-8">
            <button 
              onClick={() => setSelectedClient(null)}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Owner & Scale Metadata */}
              <div className="space-y-6 lg:col-span-1">
                {/* Profile Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col items-center text-center">
                    <img 
                      src={selectedClient.avatar} 
                      alt={selectedClient.ownerName} 
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-800 shadow-md mb-4"
                    />
                    <h2 className="text-xl font-bold text-white">{selectedClient.ownerName}</h2>
                    <p className="text-indigo-400 text-sm mt-1">{selectedClient.firm}</p>
                    
                    <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-800/80 text-left text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Contact Number:</span>
                        <span className="text-slate-300 font-mono">{selectedClient.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Client ID:</span>
                        <span className="text-slate-300 font-mono text-xs">{selectedClient.id.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scale Specification Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <Scale size={16} className="text-indigo-400" /> Device Specifications
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="text-slate-300 font-medium">{selectedClient.instrument.instrumentType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Make/Model:</span><span className="text-slate-300">{selectedClient.instrument.make} / {selectedClient.instrument.model}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Serial No:</span><span className="text-slate-300 font-mono text-xs">{selectedClient.instrument.srNo}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Max Capacity:</span><span className="text-slate-300 font-bold">{selectedClient.instrument.max} {selectedClient.instrument.unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Min Capacity:</span><span className="text-slate-300">{selectedClient.instrument.min} {selectedClient.instrument.unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Verification (e):</span><span className="text-slate-300">{selectedClient.instrument.e} {selectedClient.instrument.unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Class:</span><span className="text-indigo-400 font-semibold">Class {selectedClient.instrument.accuracyClass}</span></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Certificates Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-400" /> Audit Log & Certificates
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Cert No</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Overall Result</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedClient.certificates.map((cert) => (
                          <tr key={cert.certNo} className="hover:bg-slate-900/20">
                            <td className="py-3.5 px-4 font-mono text-slate-300">{cert.certNo}</td>
                            <td className="py-3.5 px-4 text-slate-400 text-xs flex items-center gap-1.5">
                              <Calendar size={13} /> {cert.date}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                cert.verdict === "pass" 
                                  ? "bg-green-950/40 border border-green-800/40 text-green-400" 
                                  : "bg-red-950/40 border border-red-800/40 text-red-400"
                              }`}>
                                {cert.verdict === "pass" ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                {cert.verdict.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button 
                                onClick={() => setSelectedCert(cert)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-950 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 transition-colors cursor-pointer"
                              >
                                View / Audit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= DETAILED CERTIFICATE AUDIT MODAL ================= */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90svh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/50 border border-slate-800/50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 pr-10">
              <div>
                <h3 className="text-xl font-bold text-white">Certificate Audit View</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">NO: {selectedCert.certNo} | Verified: {selectedCert.date}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onEditCert(selectedClient, selectedCert)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Edit / Override Test
                </button>
                <PDFExport 
                  reportId={selectedCert.certNo}
                  reportNumber={selectedCert.certNo}
                  reportData={{
                    ...selectedCert,
                    client_name: selectedClient.ownerName,
                    client_address: selectedClient.firm,
                    inspector_name: "Shivhari Mundhe",
                    instrument_make: selectedClient.instrument.make,
                    instrument_model: selectedClient.instrument.model,
                    serial_number: selectedClient.instrument.srNo,
                    capacity_max: selectedClient.instrument.max,
                    capacity_min: selectedClient.instrument.min,
                    accuracy_class: selectedClient.instrument.accuracyClass,
                    verification_interval: selectedClient.instrument.e,
                    overall_verdict: selectedCert.verdict.toUpperCase(),
                    certificate_number: selectedCert.certNo,
                    certificate_date: selectedCert.date,
                    step_visual_exam: { 
                      markingPlateOk: selectedCert.tests.visual === "pass", 
                      approvalIndicatorOk: true, 
                      housingOk: true, 
                      notes: selectedCert.tests.visual === "pass" ? "Passed visual checks" : "Visual checks failed" 
                    },
                    step_zero_baseline: { initialReading: "0.00", toleranceOk: selectedCert.tests.zero === "pass" },
                    step_accuracy_test: {
                      rows: [
                        { load: "0", indication: "0.00", correction: "0.00", error: "0.00", mpe: "±0.5", verdict: "PASS" },
                        { load: "100", indication: "100.00", correction: "0.00", error: "0.00", mpe: "±0.5", verdict: "PASS" },
                        { load: "200", indication: "200.00", correction: "0.00", error: "0.00", mpe: "±1.0", verdict: "PASS" },
                        { load: "250", indication: "250.00", correction: "0.00", error: "0.00", mpe: "±1.0", verdict: "PASS" },
                        { load: "300", indication: "300.00", correction: "0.00", error: "0.00", mpe: "±1.5", verdict: "PASS" }
                      ]
                    }
                  }}
                />
              </div>
            </div>

            {/* Certificate Print Preview Mock */}
            <div className="bg-white text-slate-900 p-6 md:p-10 border border-slate-300 rounded-2xl max-w-3xl mx-auto shadow-inner text-sm space-y-6">
              
              {/* Header */}
              <div className="text-center">
                <h2 className="font-extrabold text-lg uppercase tracking-widest text-slate-950">Government Approved Test Centre</h2>
                <div className="text-xs text-slate-500 font-bold mt-0.5">(IND/GATC/MH/26/09)</div>
                <h3 className="font-bold text-md mt-4 uppercase border-b border-slate-950 inline-block pb-0.5">Certificate of Verification</h3>
              </div>

              {/* Declaration Statement */}
              <p className="text-xs leading-relaxed text-justify text-slate-800">
                I hereby certify that I have this day verified and stamped/rejected the under mentioned Non-automatic weighing instrument(s) of Accuracy Class <b>{selectedClient.instrument.accuracyClass}</b> (upto <b>{selectedClient.instrument.max} {selectedClient.instrument.unit}</b>), etc. belonging to M/s- <b>{selectedClient.firm}</b>, Address- <b>MIDC CIDCO Area, Aurangabad</b>.
              </p>

              {/* Instrument Table */}
              <div>
                <table className="w-full border-collapse text-[10px] border border-slate-950">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Type</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Make/Model</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Sr. No.</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Class</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Max</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">e / d</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.instrumentType}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.make} / {selectedClient.instrument.model}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.srNo}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.accuracyClass}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.max} {selectedClient.instrument.unit}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedClient.instrument.e} / {selectedClient.instrument.d}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Modules Verdicts Table */}
              <div>
                <h4 className="text-xs font-bold uppercase mb-2">Module-wise Verification Matrix:</h4>
                <table className="w-full border-collapse text-[10px] border border-slate-950">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Visual Exam</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Zero Baseline</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Eccentricity</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Repeatability</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Accuracy</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Creep</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Tare Device</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">Ambient Temp</th>
                      <th className="border border-slate-950 p-1.5 text-center font-bold">RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.visual}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.zero}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.eccentricity}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.repeatability}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.accuracy}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.creep}</td>
                      <td className="border border-slate-950 p-1.5 text-center font-bold uppercase">{selectedCert.tests.tare}</td>
                      <td className="border border-slate-950 p-1.5 text-center">{selectedCert.ambientTemp}°C / {selectedCert.relHumidity}%</td>
                      <td className="border border-slate-950 p-1.5 text-center font-black uppercase text-indigo-700">{selectedCert.verdict}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-12 text-center text-xs">
                <div>
                  <div className="border-b border-slate-950 w-2/3 mx-auto mb-2"></div>
                  <div className="font-bold">Verification Engineer</div>
                </div>
                <div>
                  <div className="border-b border-slate-950 w-2/3 mx-auto mb-2"></div>
                  <div className="font-bold">Principal Officer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
