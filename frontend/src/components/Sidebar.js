import React, { useEffect, useState } from "react";
import axios from "axios";

const Sidebar = () => {
  const components = ["UserQuery", "KnowledgeBase", "LLMEngine", "Output"];
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
    <div style={{ width: 220, padding: 10, background: "#f0f0f0" }}>
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
      <div style={{ marginTop: 30 }}>
        <h4>Uploaded PDFs</h4>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!loading && !error && pdfs.length === 0 && (
          <div>No PDFs uploaded.</div>
        )}
        <ul style={{ paddingLeft: 16 }}>
          {pdfs.map((pdf) => (
            <li key={pdf.id}>
              <strong>{pdf.filename}</strong>
              <br />
              <small>
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
