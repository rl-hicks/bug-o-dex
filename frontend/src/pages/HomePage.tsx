import { Link } from "react-router-dom";
import "./HomePage.css";

import "./HomePage.css";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-eyebrow">E1 deployed build</p>

        <h2>A field guide for bug discoveries.</h2>

        <p className="home-lede">
          Bug-O-Dex is a small web app for collecting bug discoveries. Upload a
          photo, get an AI-assisted identification, review the result, and save
          the entry into a collection.
        </p>

        <div className="home-actions">
          <Link className="home-button primary" to="/collection">
            View public collection
          </Link>

          <Link className="home-button secondary" to="/login">
            Log in
          </Link>
        </div>
      </section>

      <section className="home-grid">
        <article className="home-card">
          <h3>What it does</h3>

          <p>
            The project is built around a simple loop: find a bug, upload a
            photo, identify it, save it, and build a collection over time.
          </p>
        </article>

        <article className="home-card">
          <h3>Current state</h3>

          <p>
            The E1 version is complete and deployed. The core product loop is
            working: login, photo upload, AI-assisted identification, review,
            save, collection browsing, detail pages, editing, and deletion.
          </p>
        </article>

        <article className="home-card">
          <h3>Public collection</h3>

          <p>
            Logged-out visitors can browse a read-only public example
            collection from the developer&apos;s Bug-O-Dex.
          </p>

          <Link to="/collection">Browse public bugs</Link>
        </article>

        <article className="home-card">
          <h3>Private collection</h3>

          <p>
            Logged-in users can upload bug photos, review AI suggestions, save
            entries, edit saved bugs, and manage their own private collection.
          </p>

          <Link to="/upload">Upload a bug</Link>
        </article>
      </section>

      <section className="home-status">
        <h3>Development status</h3>

        <p>
          Development is currently paused while the app is hardened, documented,
          and prepared as a finished project checkpoint. Possible future work
          includes stronger location-aware identification, richer creature-card
          style entries, better collection mechanics, improved public sharing,
          and a more polished kid-and-parent discovery experience.
        </p>
      </section>
    </div>
  );
}