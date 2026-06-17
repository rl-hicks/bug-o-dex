import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div>
      <section>
        <h2>What Bug-O-Dex is</h2>

        <p>
          Bug-O-Dex is a small web app for collecting bug discoveries. A user can
          upload a bug photo, get an AI-assisted identification, review the
          result, and save the entry into a collection.
        </p>

        <p>
          The project is built around a simple loop: find a bug, upload a photo,
          identify it, save it, and build a collection over time.
        </p>
      </section>

      <section>
        <h2>Current development state</h2>

        <p>
          The E1 version is complete and deployed. The core product loop is
          working: login, photo upload, AI-assisted identification, review,
          save, collection browsing, detail pages, editing, and deletion.
        </p>

        <p>
          Development is currently paused while the app is hardened, documented,
          and prepared as a finished project checkpoint.
        </p>
      </section>

      <section>
        <h2>Public collection</h2>

        <p>
          Logged-out visitors can browse a read-only public example collection
          from the developer&apos;s Bug-O-Dex.
        </p>

        <p>
          <Link to="/collection">View the public collection</Link>
        </p>
      </section>

      <section>
        <h2>Private collection</h2>

        <p>
          Logged-in users can upload bug photos, review AI suggestions, save
          entries, edit saved bugs, and manage their own private collection.
        </p>

        <p>
          <Link to="/login">Log in</Link> or <Link to="/upload">upload a bug</Link>.
        </p>
      </section>

      <section>
        <h2>Future direction</h2>

        <p>
          Possible future work includes stronger location-aware identification,
          richer creature-card style entries, better collection mechanics,
          improved public sharing, and a more polished kid-and-parent discovery
          experience.
        </p>
      </section>
    </div>
  );
}
