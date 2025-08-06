import React, { useState } from "react";
import WorkflowBuilder from "./components/WorkflowBuilder";
import ChatModal from "./components/ChatModal";
import FileUploadPanel from "./components/FileUploadPanel";

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [workflow, setWorkflow] = useState(null); // Store workflow definition

  return (
    <div className="App">
      {/* PDF Upload and Q&A Panel removed. Only available in KnowledgeBase node config. */}
      <WorkflowBuilder
        onBuildStack={setWorkflow}
        onChatWithStack={() => setChatOpen(true)}
      />
      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        workflow={workflow}
      />
    </div>
  );
}

export default App;
