import React from "react";

const Sidebar = () => {
  const components = ["UserQuery", "KnowledgeBase", "LLMEngine", "Output"];

  return (
    <div style={{ width: 200, padding: 10, background: "#f0f0f0" }}>
      <h3>Components</h3>
      {components.map((comp) => (
        <div
          key={comp}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/reactflow", comp)
          }
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            background: "white",
            cursor: "grab",
          }}
        >
          {comp}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
