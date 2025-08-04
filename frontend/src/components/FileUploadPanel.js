import React, { useState } from "react";
import axios from "axios";

function FileUploadPanel({ nodeId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        "http://localhost:8000/upload-pdf",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setStatus("Success: " + res.data.message);
    } catch (err) {
      setStatus("Error: " + (err.response?.data?.detail || "Upload failed"));
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginTop: 8 }}>
        Upload PDF
      </button>
      {status && <div style={{ marginTop: 8, fontSize: 13 }}>{status}</div>}
    </div>
  );
}

export default FileUploadPanel;
