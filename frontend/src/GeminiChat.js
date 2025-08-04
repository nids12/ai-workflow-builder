import React, { useState } from "react";
import axios from "axios";

const GeminiChat = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask-gemini", {
        prompt: prompt,
        context: "",
      });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse("Error occurred while fetching from Gemini.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Ask Gemini</h2>
      <textarea
        className="w-full border p-2 mb-2"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Loading..." : "Ask Gemini"}
      </button>
      {response && (
        <div className="mt-4 p-2 border rounded">
          <h4 className="font-semibold">Response:</h4>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
