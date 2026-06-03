import { useEffect, useState } from "react";
import { getHealth } from "./api/client";

function App() {
  const [backendStatus, setBackendStatus] = useState("loading...");

  useEffect(() => {
    getHealth()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <main>
      <h1>Bug-O-Dex</h1>
      <p>Backend status: {backendStatus}</p>
    </main>
  );
}

export default App;