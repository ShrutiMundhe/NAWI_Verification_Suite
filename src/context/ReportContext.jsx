import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { reportsService } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const ReportContext = createContext(null);

export const BLANK_REPORT = {
  client_name: "",
  client_address: "",
  instrument_make: "",
  instrument_model: "",
  serial_number: "",
  capacity_max: 0,
  capacity_min: 0,
  verification_interval: "e",
  accuracy_class: "III",
  step_setup: {},
  step_visual_exam: {},
  step_zero_baseline: {},
  step_zero_tracking: {},
  step_accuracy_test: {},
  step_discrimination: {},
  step_eccentricity: {},
  step_repeatability: {},
  step_creep_zero_return: {},
  step_tare_device: {},
  step_final_report: {},
  overall_verdict: "PASS",
  status: "draft",
  current_step: 1,
};

const STEP_MAP = {
  1: "step_setup",
  2: "step_visual_exam",
  3: "step_zero_baseline",
  4: "step_zero_tracking",
  5: "step_accuracy_test",
  6: "step_discrimination",
  7: "step_eccentricity",
  8: "step_repeatability",
  9: "step_creep_zero_return",
  10: "step_tare_device",
  11: "step_final_report",
};

export function ReportProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const autoSaveTimerRef = useRef(null);

  // Clear drafts on login/logout
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentReport(null);
      setReports([]);
      sessionStorage.removeItem("nawi_current_step");
    }
  }, [isAuthenticated]);

  // Debounced auto-save effect
  useEffect(() => {
    if (unsavedChanges && currentReport) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveReport();
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentReport, unsavedChanges]);

  const createNewReport = () => {
    setCurrentReport({ ...BLANK_REPORT });
    setUnsavedChanges(false);
    sessionStorage.setItem("nawi_current_step", "1");
  };

  const updateStep = (stepNumber, stepData) => {
    const stepKey = STEP_MAP[stepNumber];
    if (!stepKey) return;

    setCurrentReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [stepKey]: stepData,
        current_step: stepNumber,
      };
    });
    setUnsavedChanges(true);
  };

  const goToStep = (stepNumber) => {
    sessionStorage.setItem("nawi_current_step", String(stepNumber));
    setCurrentReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        current_step: stepNumber,
      };
    });
  };

  const saveReport = async () => {
    if (!currentReport) return;
    setIsLoading(true);
    setError(null);
    try {
      let savedData;
      if (currentReport._id) {
        // Existing Report (PUT)
        const response = await reportsService.updateReport(currentReport._id, currentReport);
        savedData = response.report;
      } else {
        // New Report (POST)
        const response = await reportsService.createReport(currentReport);
        savedData = response.report;
      }
      setCurrentReport(savedData);
      setUnsavedChanges(false);
      setIsLoading(false);
      return savedData;
    } catch (err) {
      setError(err.message || "Failed to save report");
      setIsLoading(false);
      throw err;
    }
  };

  const fetchUserReports = async (status) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsService.getUserReports({ status });
      setReports(data.reports);
      setIsLoading(false);
      return data.reports;
    } catch (err) {
      setError(err.message || "Failed to fetch reports");
      setIsLoading(false);
      throw err;
    }
  };

  const loadReport = async (reportId) => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await reportsService.getReport(reportId);
      setCurrentReport(report);
      sessionStorage.setItem("nawi_current_step", String(report.current_step || 1));
      setUnsavedChanges(false);
      setIsLoading(false);
      return report;
    } catch (err) {
      setError(err.message || "Failed to load report");
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <ReportContext.Provider
      value={{
        currentReport,
        reports,
        isLoading,
        error,
        unsavedChanges,
        createNewReport,
        updateStep,
        goToStep,
        saveReport,
        fetchUserReports,
        loadReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReport must be used within a ReportProvider");
  }
  return context;
}
