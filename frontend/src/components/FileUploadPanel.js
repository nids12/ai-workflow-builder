import React, { useState, useEffect } from "react";
import axios from "axios";

function FileUploadPanel({ nodeId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [fetchError, setFetchError] = useState("");

  const fetchPdfs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/documents");
      setPdfs(res.data || []);
      setFetchError("");
    } catch (err) {
      setFetchError("Could not fetch uploaded PDFs");
      setPdfs([]);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, [status]); // refetch after upload

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
      setFile(null);
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
      <div style={{ marginTop: 16 }}>
        <b>Uploaded PDFs:</b>
        {fetchError ? (
          <div style={{ color: "red", fontSize: 13 }}>{fetchError}</div>
        ) : (
          <ul>
            {pdfs.map((pdf) => (
              <li key={pdf.id || pdf.filename}>{pdf.filename}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FileUploadPanel;
