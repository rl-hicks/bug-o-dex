import { useEffect, useState } from "react";
import { getHealth } from "./api/client";
import { CollectionPage } from "./pages/CollectionPage";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { BugDetailPage } from "./pages/BugDetailPage";

function App() {
  const [backendStatus, setBackendStatus] = useState("loading...");

  useEffect(() => {
    getHealth()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <BrowserRouter>
      <main>
        <h1>Bug-O-Dex</h1>
        <p>Backend status: {backendStatus}</p>

        <nav>
          <Link to="/collection">Collection</Link>
        </nav>

        <hr />

        <Routes>
          <Route path="/" element={<p>Welcome to Bug-O-Dex.</p>} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/bug-entries/:id" element={<BugDetailPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;