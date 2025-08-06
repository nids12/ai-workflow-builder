import React, { useCallback, useState } from "react";
import Sidebar from "./Sidebar";
import axios from "axios";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  Handle,
} from "reactflow";
import { FaUser, FaDatabase, FaRobot, FaFileAlt } from "react-icons/fa";
import "reactflow/dist/style.css";
import FileUploadPanel from "./FileUploadPanel";

const componentLibrary = [
  { type: "userQuery", label: "User Query", icon: FaUser },
  { type: "knowledgeBase", label: "KnowledgeBase", icon: FaDatabase },
  { type: "llmEngine", label: "LLM Engine", icon: FaRobot },
  { type: "output", label: "Output", icon: FaFileAlt },
];

function sanitizeNodes(nodes) {
  return nodes.map((node) => ({
    ...node,
    position:
      node.position &&
      typeof node.position.x === "number" &&
      typeof node.position.y === "number"
        ? node.position
        : { x: 0, y: 0 },
  }));
}

function CustomNode({ data }) {
  const Icon = data && data.icon ? data.icon : null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        border: "2px solid #e5e7eb",
        borderRadius: 8,
        background: "#f9fafb",
        fontWeight: 500,
        fontSize: 15,
        boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
        minWidth: 120,
        minHeight: 40,
        position: "relative",
      }}
    >
      <Handle type="target" position="left" style={{ background: "#555" }} />
      {Icon ? <Icon size={20} style={{ marginRight: 8 }} /> : null}
      {data && data.label ? data.label : "Node"}
      <Handle type="source" position="right" style={{ background: "#555" }} />
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

const initialNodes = [];
const initialEdges = [];

// ...existing code...

// Assignment-ready: Visual AI Workflow Builder with import/export, run, and extensible config
function WorkflowBuilder({ onBuildStack, onChatWithStack }) {
  // Validate workflow before export/run
  function validateWorkflow(nodes, edges) {
    const requiredTypes = [
      "User Query",
      "KnowledgeBase",
      "LLM Engine",
      "Output",
    ];
    const nodeLabels = nodes.map((n) =>
      n && n.data && typeof n.data.label === "string" ? n.data.label : ""
    );
    for (let type of requiredTypes) {
      if (!nodeLabels.includes(type)) {
        return `Missing required node: ${type}`;
      }
    }
    // Check all nodes are connected (except isolated output)
    const nodeIds = nodes.map((n) => n.id);
    const connected = new Set();
    edges.forEach((e) => {
      connected.add(e.source);
      connected.add(e.target);
    });
    for (let id of nodeIds) {
      const node = nodes.find((n) => n.id === id);
      const label =
        node && node.data && typeof node.data.label === "string"
          ? node.data.label
          : id;
      if (!connected.has(id)) {
        return `Node not connected: ${label}`;
      }
    }
    // Check configs
    for (let n of nodes) {
      const label =
        n && n.data && typeof n.data.label === "string" ? n.data.label : "";
      if (label === "User Query" && !(n.data && n.data.prompt))
        return "User Query node missing prompt.";
      if (label === "LLM Engine" && !(n.data && n.data.model))
        return "LLM Engine node missing model.";
      if (label === "Output" && !(n.data && n.data.format))
        return "Output node missing format.";
    }
    return null;
  }
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [labelEdit, setLabelEdit] = useState({
    open: false,
    id: null,
    type: null,
    value: "",
  });
  const [resultModal, setResultModal] = useState({ open: false, content: "" });

  // Double click node to edit label
  const handleNodeDoubleClick = (_, node) => {
    setLabelEdit({
      open: true,
      id: node.id,
      type: "node",
      value: node.data.label || "",
    });
  };

  // Double click edge to edit label
  // (already declared above)

  // Save label edit
  const handleLabelSave = () => {
    if (labelEdit.type === "node") {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === labelEdit.id
            ? { ...n, data: { ...n.data, label: labelEdit.value } }
            : n
        )
      );
      if (selectedNode && selectedNode.id === labelEdit.id)
        setSelectedNode((prev) => ({
          ...prev,
          data: { ...prev.data, label: labelEdit.value },
        }));
    } else if (labelEdit.type === "edge") {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === labelEdit.id ? { ...e, label: labelEdit.value } : e
        )
      );
    }
    setLabelEdit({ open: false, id: null, type: null, value: "" });
  };

  // Drag from library to canvas
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      console.log("onDrop event fired", event);
      const raw = event.dataTransfer.getData("application/reactflow");
      console.log("Drop raw payload:", raw);
      if (!raw) {
        console.warn("No payload found in drop event");
        return;
      }
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { type: raw };
      }
      console.log("Parsed drop data:", data);
      let node = null;
      // Generate a robust unique id for each node
      const uniqueId = `${Math.floor(Math.random() * 1e6)}_${Date.now()}`;
      if (data.type === "PDF") {
        node = {
          id: `pdf_${data.id}_${uniqueId}`,
          type: "default",
          data: {
            label: data.filename || "PDF",
            pdfId: data.id,
            filename: data.filename,
            icon: FaFileAlt,
          },
          position: { x: 100, y: 100 },
        };
      } else {
        let comp = componentLibrary.find(
          (c) =>
            c.label.toLowerCase() === data.type.toLowerCase() ||
            c.type.toLowerCase() === data.type.toLowerCase()
        );
        if (!comp) {
          console.warn("Component not found for drop:", data.type);
          comp = componentLibrary[0];
        }
        node = {
          id: `${comp.type}_${uniqueId}`,
          type: "customNode",
          data: {
            label: comp.label,
            icon: comp.icon,
            ...(comp.label === "LLM Engine" ? { model: "gemini" } : {}),
            ...(comp.label === "Output" ? { format: "text" } : {}),
          },
          position: { x: 100, y: 100 },
        };
      }
      console.log("Node to add:", node);
      setNodes((nds) =>
        sanitizeNodes([
          ...nds,
          node.type === "dimensions" ? { ...node, type: "customNode" } : node,
        ])
      );
    },
    [setNodes]
  );

  // ...existing code...
  // Double click node to edit label
  // (already declared above)

  // Double click edge to edit label
  const handleEdgeDoubleClick = (_, edge) => {
    setLabelEdit({
      open: true,
      id: edge.id,
      type: "edge",
      value: edge.label || "",
    });
  };

  // Save label edit
  // (already declared above)

  // Helper to update node data by id (for config panel)
  // Export workflow as JSON (with validation)
  const handleExport = () => {
    const error = validateWorkflow(nodes, edges);
    if (error) {
      setResultModal({ open: true, content: `Export failed: ${error}` });
      return;
    }
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import workflow from JSON
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const obj = JSON.parse(evt.target.result);
        setNodes(sanitizeNodes(obj.nodes || []));
        setEdges(obj.edges || []);
        setSelectedNode(null);
      } catch {
        alert("Invalid workflow file");
      }
    };
    reader.readAsText(file);
  };

  // Run workflow: validate, then send to backend, show result in modal
  const handleRunWorkflow = async () => {
    const error = validateWorkflow(nodes, edges);
    if (error) {
      setResultModal({ open: true, content: `Run failed: ${error}` });
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/run-workflow", {
        nodes,
        edges,
      });
      setResultModal({
        open: true,
        content: res.data.result || res.data.message || "Workflow executed.",
      });
    } catch (err) {
      setResultModal({
        open: true,
        content:
          "Failed to run workflow: " +
          (err.response?.data?.detail || err.message),
      });
    }
  };

  // Reset workflow
  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };
  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    // Also update selectedNode if it's the same
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prev) => ({
        ...prev,
        data: { ...prev.data, ...newData },
      }));
    }
  };

  // Drag from library to canvas
  // (already declared above)

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    console.log("onDragOver event fired", event);
  }, []);

  // Edge creation constraints
  const isValidConnection = (connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;
    // Prevent self-loop
    if (connection.source === connection.target) return false;
    // Output node cannot have outgoing edges
    if (sourceNode.data.label === "Output") return false;
    // User Query cannot have incoming edges
    if (targetNode.data.label === "User Query") return false;
    // Output cannot have incoming edges from Output
    if (
      targetNode.data.label === "Output" &&
      sourceNode.data.label === "Output"
    )
      return false;
    // Only allow one incoming edge to Output
    if (targetNode.data.label === "Output") {
      const incoming = edges.filter((e) => e.target === targetNode.id);
      if (incoming.length > 0) return false;
    }
    return true;
  };

  const onConnect = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge(params, eds));
      } else {
        setResultModal({ open: true, content: "Invalid connection!" });
      }
    },
    [setEdges, nodes, edges]
  );

  // Build Stack: send workflow definition to parent
  const handleBuildStack = () => {
    if (onBuildStack) {
      onBuildStack({ nodes, edges });
    }
    alert("Workflow validated and ready!");
  };

  // Chat with Stack: open chat modal
  const handleChatWithStack = () => {
    if (onChatWithStack) onChatWithStack();
  };

  // Delete selected node and its edges
  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  return (
    <div style={{ display: "flex", height: "90vh", minHeight: 600 }}>
      {/* Sidebar for drag-and-drop components and PDFs */}
      <Sidebar
        onBuildStack={handleBuildStack}
        onChatWithStack={handleChatWithStack}
        onRunWorkflow={handleRunWorkflow}
        onExportWorkflow={handleExport}
        onImportWorkflow={(e) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = handleImport;
          input.click();
        }}
        onResetWorkflow={handleReset}
        onDeleteNode={handleDeleteNode}
        onHelpInstructions={() => alert("Help instructions coming soon!")}
      />

      {/* Workflow Canvas */}
      <div
        style={{ flex: 1, position: "relative", minHeight: 600, minWidth: 400 }}
      >
        <ReactFlow
          nodes={sanitizeNodes(
            nodes.map((n) =>
              n.type === "dimensions" ? { ...n, type: "customNode" } : n
            )
          )}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) =>
            setNodes((nds) => applyNodeChanges(changes, nds))
          }
          onEdgesChange={setEdges}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      {/* Configuration Panel (extensible for assignment) */}
      <div style={{ width: 250, borderLeft: "1px solid #ddd", padding: 10 }}>
        <h4>Config Panel</h4>
        {selectedNode ? (
          <div>
            <div>
              <b>Type:</b> {selectedNode.data.label}
            </div>
            {/* File upload for KnowledgeBase node */}
            {selectedNode.data.label === "KnowledgeBase" && (
              <FileUploadPanel nodeId={selectedNode.id} />
            )}
            {/* User Query node config */}
            {selectedNode.data.label === "User Query" && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13 }}>Prompt Template:</label>
                <textarea
                  style={{ width: "100%", minHeight: 40, marginTop: 4 }}
                  value={selectedNode.data.prompt || ""}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { prompt: e.target.value })
                  }
                  placeholder="Enter prompt template..."
                />
              </div>
            )}
            {/* LLM Engine node config */}
            {selectedNode.data.label === "LLM Engine" && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13 }}>Model:</label>
                <select
                  style={{ width: "100%", marginTop: 4 }}
                  value={selectedNode.data.model || "gemini"}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { model: e.target.value })
                  }
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
            )}
            {/* Output node config */}
            {selectedNode.data.label === "Output" && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13 }}>Output Format:</label>
                <select
                  style={{ width: "100%", marginTop: 4 }}
                  value={selectedNode.data.format || "text"}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { format: e.target.value })
                  }
                >
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div>Select a node to configure</div>
        )}
      </div>
      {/* Result Modal */}
      {resultModal.open && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 500,
            }}
          >
            <div style={{ marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {resultModal.content}
            </div>
            <button
              onClick={() => setResultModal({ open: false, content: "" })}
              style={{ float: "right" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Label Edit Modal */}
      {labelEdit.open && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 500,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <b>Edit {labelEdit.type === "node" ? "Node" : "Edge"} Label</b>
            </div>
            <input
              style={{ width: "100%", fontSize: 16, marginBottom: 16 }}
              value={labelEdit.value}
              onChange={(e) =>
                setLabelEdit((prev) => ({ ...prev, value: e.target.value }))
              }
              autoFocus
            />
            <button onClick={handleLabelSave} style={{ marginRight: 8 }}>
              Save
            </button>
            <button
              onClick={() =>
                setLabelEdit({ open: false, id: null, type: null, value: "" })
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;
