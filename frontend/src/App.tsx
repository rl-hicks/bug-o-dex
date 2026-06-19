import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";

import { CollectionPage } from "./pages/CollectionPage";
import { BugDetailPage } from "./pages/BugDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicBugDetailPage } from "./pages/PublicBugDetailPage";
import { HomePage } from "./pages/HomePage";
import { ContactPage } from "./pages/ContactPage";
import { AdminPage } from "./pages/AdminPage";

const showDiagnosticRoutes = import.meta.env.DEV;

function AppContent() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  return (
    <main>
      <h1>Bug-O-Dex</h1>

      <nav>
        <Link to="/">Home</Link>
        {" | "}
        <Link to="/login">Login</Link>
        {" | "}
        <Link to="/upload">Upload Bug</Link>
        {" | "}
        <Link to="/collection">Collection</Link>
        {" | "}
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <hr />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/public/bug-entries/:id" element={<PublicBugDetailPage />} />
        <Route path="/bug-entries/:id" element={<BugDetailPage />} />
        {showDiagnosticRoutes && (
          <>
          </>
        )}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
