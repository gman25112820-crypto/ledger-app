import React, { useEffect, useState } from "react";

const STORAGE_KEY = "ledgerSafetySeen";

export function useLedgerSafetyGate() {
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== "true") setShowSafetyModal(true);
  }, []);

  const acceptSafetyNotice = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowSafetyModal(false);
  };

  return { showSafetyModal, acceptSafetyNotice };
}

export function LocalDemoModeBadge() {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(255, 193, 7, 0.14)",
      border: "1px solid rgba(255, 193, 7, 0.45)",
      color: "#ffd36a",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.4,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#ffc107",
      }} />
      Local Demo Mode · data stays on this device
    </div>
  );
}

export function SafetyWarningBar() {
  return (
    <div style={{
      marginTop: 16,
      padding: 14,
      borderRadius: 18,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#d9d6ff",
      fontSize: 13,
      lineHeight: 1.5,
    }}>
      <strong style={{ color: "#fff" }}>Safety note:</strong>{" "}
      Do not enter bank logins, card numbers, security codes, online banking passwords,
      or sensitive financial credentials.
    </div>
  );
}

export function FirstTimeSafetyPopup({ open, onContinue }) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "rgba(2, 0, 18, 0.78)",
      backdropFilter: "blur(10px)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 620,
        borderRadius: 28,
        padding: 26,
        background: "linear-gradient(145deg, #171229, #241b38)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
        color: "#fff",
      }}>
        <p style={{
          margin: 0,
          color: "#ffd36a",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}>
          Safety first
        </p>

        <h1 style={{
          margin: "10px 0 8px",
          fontSize: 32,
          lineHeight: 1.1,
        }}>
          Welcome to Ledger
        </h1>

        <p style={{
          margin: "0 0 18px",
          color: "#d9d6ff",
          lineHeight: 1.6,
        }}>
          Ledger is currently in early access. It helps you plan money,
          budgets and goals — but it is not connected to your bank.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}>
          <div style={{
            padding: 14,
            borderRadius: 18,
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.28)",
          }}>
            <strong>What this is</strong>
            <p style={{ margin: "8px 0 0", color: "#d8ffe7", fontSize: 13 }}>
              Budget planner, goal tracker, family money helper, and daily finance guide.
            </p>
          </div>

          <div style={{
            padding: 14,
            borderRadius: 18,
            background: "rgba(244,63,94,0.12)",
            border: "1px solid rgba(244,63,94,0.28)",
          }}>
            <strong>What this is not</strong>
            <p style={{ margin: "8px 0 0", color: "#ffd6de", fontSize: 13 }}>
              Not a bank, not secure storage, and not a place for card or login details.
            </p>
          </div>
        </div>

        <div style={{
          padding: 14,
          borderRadius: 18,
          background: "rgba(255,193,7,0.12)",
          border: "1px solid rgba(255,193,7,0.32)",
          color: "#ffe8a3",
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          Your data is stored only on this device using your browser.
          Clearing browser data may remove it.
        </div>

        <div style={{
          marginTop: 14,
          padding: 14,
          borderRadius: 18,
          background: "rgba(255,255,255,0.06)",
          color: "#e8e4ff",
          fontSize: 14,
        }}>
          <strong>Ledge says:</strong> “Keep it smart. No sensitive info in here.”
          <br />
          <strong>Penny says:</strong> “Let’s make it fabulous… and safe ✨”
        </div>

        <button
          onClick={onContinue}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "15px 18px",
            borderRadius: 18,
            border: "none",
            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Continue safely
        </button>
      </div>
    </div>
  );
}
