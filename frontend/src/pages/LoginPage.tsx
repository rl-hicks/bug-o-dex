import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoggingIn(true);
    setStatusMessage("Logging in...");

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      localStorage.setItem("access_token", result.access_token);

      setStatusMessage("Login successful.");
      navigate("/upload");
    } catch {
      setStatusMessage("Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "480px" }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login"}
        </button>
      </form>

      {statusMessage && <p>{statusMessage}</p>}

      <p>
        Having trouble or want access?{" "}
        <Link to="/contact">Contact developer</Link>.
      </p>
    </main>
  );
}
