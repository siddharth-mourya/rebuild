"use client";

import { useState } from "react";
import ExportModal from "./ExportModal";
import { ExportIcon } from "@/components/icons";

export default function ExportButton() {
  const [showExport, setShowExport] = useState(false);
  return (
    <>
      <button onClick={() => setShowExport(true)} className="btn btn-primary" style={{ fontSize: 13, gap: 8 }}>
        <ExportIcon size={14} />
        Export
      </button>
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}
