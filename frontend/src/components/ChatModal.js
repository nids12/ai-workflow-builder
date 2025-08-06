import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import axios from "axios";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function ChatModal({ open, onClose, workflow }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to get selected PDF filename from workflow
  const getSelectedPdfFilename = () => {
    if (!workflow || !workflow.nodes) return null;
    const kbNode = workflow.nodes.find(
      (n) => n.data && n.data.label === "KnowledgeBase" && n.data.filename
    );
    return kbNode ? kbNode.data.filename : null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    let contextText = "";
    const pdfFilename = getSelectedPdfFilename();
    if (pdfFilename) {
      try {
        const res = await axios.get(
          `http://localhost:8000/document-text/${encodeURIComponent(
            pdfFilename
          )}`
        );
        contextText = res.data.text || "";
      } catch (err) {
        contextText = "";
      }
    }
    try {
      const res = await axios.post("http://localhost:8000/ask-gemini", {
        prompt: input,
        context: contextText,
      });
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: res.data.response },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error: Could not get response." },
      ]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <h3>Chat with Stack</h3>
        <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ textAlign: msg.sender === "user" ? "right" : "left" }}
            >
              <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
            </div>
          ))}
        </div>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          sx={{ mt: 2 }}
        >
          {loading ? "Sending..." : "Send"}
        </Button>
      </Box>
    </Modal>
  );
}

export default ChatModal;
