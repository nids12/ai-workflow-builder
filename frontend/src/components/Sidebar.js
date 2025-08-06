import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaDatabase, FaRobot, FaFileAlt } from "react-icons/fa";

const Sidebar = ({
  onBuildStack,
  onChatWithStack,
  onRunWorkflow,
  onExportWorkflow,
  onImportWorkflow,
  onResetWorkflow,
  onDeleteNode,
  onHelpInstructions,
}) => {
  const components = [
    {
      name: "User Query",
      icon: FaUser,
    },
    {
      name: "Knowledge Base",
      icon: FaDatabase,
    },
    {
      name: "LLM Engine",
      icon: FaRobot,
    },
    {
      name: "Output",
      icon: FaFileAlt,
    },
  ];
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/documents")
      .then((res) => {
        setPdfs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not fetch uploaded PDFs");
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        width: 260,
        padding: 20,
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        minHeight: "100vh",
        boxShadow: "2px 0 8px 0 rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Components
        </div>
        <div>
          {components.map((comp) => (
            <div
              key={comp.name}
              draggable
              onDragStart={(e) => {
                // Use the correct type string for drag-and-drop
                // Use camelCase type strings to match WorkflowBuilder.js
                let type = "";
                if (comp.name === "User Query") type = "userQuery";
                else if (comp.name === "Knowledge Base") type = "knowledgeBase";
                else if (comp.name === "LLM Engine") type = "llmEngine";
                else if (comp.name === "Output") type = "output";
                e.dataTransfer.setData(
                  "application/reactflow",
                  JSON.stringify({ type })
                );
              }}
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 12,
                background: "#f9fafb",
                cursor: "grab",
                fontWeight: 500,
                fontSize: 15,
                boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
                transition: "box-shadow 0.2s",
              }}
            >
              {/* Only render icon if it's a valid function/component */}
              {typeof comp.icon === "function"
                ? React.createElement(comp.icon, {
                    size: 18,
                    style: { marginRight: 8 },
                  })
                : null}
              {typeof comp.name === "string" ? comp.name : null}
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Action Buttons */}
      <div style={{ marginBottom: 24 }}>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onBuildStack}
        >
          Build Stack
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onChatWithStack}
        >
          Chat with Stack
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onRunWorkflow}
        >
          Run Workflow
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onExportWorkflow}
        >
          Export Workflow
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onImportWorkflow}
        >
          Import Workflow
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onResetWorkflow}
        >
          Reset Workflow
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onDeleteNode}
        >
          Delete Selected Node
        </button>
        <button
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onHelpInstructions}
        >
          Help / Instructions
        </button>
      </div>
      <div style={{ marginTop: 30 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
          Uploaded PDFs
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!loading && !error && pdfs.length === 0 && (
          <div style={{ color: "#888" }}>No PDFs uploaded.</div>
        )}
        <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
          {pdfs.map((pdf) => (
            <li
              key={pdf.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/reactflow",
                  JSON.stringify({
                    type: "PDF",
                    id: pdf.id,
                    filename: pdf.filename,
                  })
                );
              }}
              style={{
                background: "#f3f4f6",
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 8,
                fontSize: 14,
                boxShadow: "0 1px 2px 0 rgba(0,0,0,0.01)",
                cursor: "grab",
              }}
            >
              <strong>{pdf.filename}</strong>
              <br />
              <small style={{ color: "#666" }}>
                {pdf.upload_time
                  ? new Date(pdf.upload_time).toLocaleString()
                  : ""}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
