import React, { useCallback, useState } from "react";
import axios from "axios";
import ReactFlow, { addEdge, MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import FileUploadPanel from "./FileUploadPanel";

const initialNodes = [];
const initialEdges = [];

// Utility to ensure all nodes have a valid position
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

const componentLibrary = [
  { type: "userQuery", label: "User Query" },
  { type: "knowledgeBase", label: "KnowledgeBase" },
  { type: "llmEngine", label: "LLM Engine" },
  { type: "output", label: "Output" },
];

// Assignment-ready: Visual AI Workflow Builder with import/export, run, and extensible config
function WorkflowBuilder({ onBuildStack, onChatWithStack }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [resultModal, setResultModal] = useState({ open: false, content: "" });
  const [labelEdit, setLabelEdit] = useState({
    open: false,
    id: null,
    type: null,
    value: "",
  });
  const [helpOpen, setHelpOpen] = useState(false);
  // Node/edge label editing
  const handleNodeDoubleClick = (_, node) => {
    setLabelEdit({
      open: true,
      id: node.id,
      type: "node",
      value: node.data.label || "",
    });
  };
  const handleEdgeDoubleClick = (_, edge) => {
    setLabelEdit({
      open: true,
      id: edge.id,
      type: "edge",
      value: edge.label || "",
    });
  };
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
  // Assignment: Validate workflow before run/export
  function validateWorkflow(nodes, edges) {
    const requiredTypes = [
      "User Query",
      "KnowledgeBase",
      "LLM Engine",
      "Output",
    ];
    const nodeLabels = nodes.map((n) => (n.data && n.data.label) || "");
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
      const label = (node && node.data && node.data.label) || id;
      if (!connected.has(id)) {
        return `Node not connected: ${label}`;
      }
    }
    // Check configs
    for (let n of nodes) {
      const label = (n.data && n.data.label) || "";
      if (label === "User Query" && !(n.data && n.data.prompt))
        return "User Query node missing prompt.";
      if (label === "LLM Engine" && !(n.data && n.data.model))
        return "LLM Engine node missing model.";
      if (label === "Output" && !(n.data && n.data.format))
        return "Output node missing format.";
    }
    return null;
  }

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
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("componentType");
      const position = { x: event.clientX - 250, y: event.clientY - 50 };
      const id = `${type}_${+new Date()}`;
      setNodes((nds) =>
        sanitizeNodes([
          ...nds,
          {
            id,
            type: "default",
            data: {
              label: componentLibrary.find((c) => c.type === type).label,
            },
            position,
          },
        ])
      );
    },
    [setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
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
      {/* Component Library & Workflow Actions */}
      <div style={{ width: 200, borderRight: "1px solid #ddd", padding: 10 }}>
        <h4>Component Library</h4>
        {componentLibrary.map((comp) => (
          <div
            key={comp.type}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("componentType", comp.type)
            }
            style={{
              border: "1px solid #aaa",
              borderRadius: 4,
              padding: 8,
              marginBottom: 8,
              background: "#f9f9f9",
              cursor: "grab",
            }}
          >
            {comp.label}
          </div>
        ))}
        <button
          style={{ marginTop: 20, width: "100%" }}
          onClick={handleBuildStack}
        >
          Build Stack
        </button>
        <button
          style={{ marginTop: 10, width: "100%" }}
          onClick={handleChatWithStack}
        >
          Chat with Stack
        </button>
        <button
          style={{ marginTop: 10, width: "100%" }}
          onClick={handleRunWorkflow}
        >
          Run Workflow
        </button>
        <button style={{ marginTop: 10, width: "100%" }} onClick={handleExport}>
          Export Workflow
        </button>
        <button style={{ marginTop: 10, width: "100%" }} onClick={handleReset}>
          Reset Workflow
        </button>
        <button
          style={{ marginTop: 10, width: "100%" }}
          onClick={handleDeleteNode}
          disabled={!selectedNode}
        >
          Delete Selected Node
        </button>
        <button
          style={{ marginTop: 10, width: "100%" }}
          onClick={() => setHelpOpen(true)}
        >
          Help / Instructions
        </button>
        {/* Help/Instructions Modal */}
        {helpOpen && (
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
              zIndex: 1002,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 8,
                minWidth: 340,
                maxWidth: 600,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <h3>Workflow Builder Instructions</h3>
              <ul>
                <li>
                  Drag components from the library onto the canvas to build your
                  workflow.
                </li>
                <li>
                  Connect nodes by dragging from one node's handle to another.
                </li>
                <li>Double-click a node or edge to edit its label.</li>
                <li>
                  Select a node to configure its properties in the right panel.
                </li>
                <li>Upload PDFs for KnowledgeBase nodes.</li>
                <li>
                  Use <b>Run Workflow</b> to execute your workflow and see
                  results.
                </li>
                <li>
                  Use <b>Export</b> and <b>Import</b> to save/load workflows.
                </li>
                <li>
                  Use <b>Delete Selected Node</b> to remove a node and its
                  connections.
                </li>
                <li>
                  Use <b>Reset Workflow</b> to clear the canvas.
                </li>
                <li>
                  Edge creation is constrained: e.g., Output cannot have
                  outgoing edges, User Query cannot have incoming edges, etc.
                </li>
              </ul>
              <button
                onClick={() => setHelpOpen(false)}
                style={{ float: "right" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <label style={{ marginTop: 10, width: "100%", display: "block" }}>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <span
            style={{
              display: "inline-block",
              width: "100%",
              padding: "6px 0",
              background: "#eee",
              borderRadius: 4,
              textAlign: "center",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Import Workflow
          </span>
        </label>
      </div>

      {/* Workflow Canvas */}
      <div
        style={{ flex: 1, position: "relative", minHeight: 600, minWidth: 400 }}
      >
        <ReactFlow
          nodes={sanitizeNodes(nodes)}
          edges={edges}
          onNodesChange={setNodes}
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
