import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { sendContactMessage } from "../api/contact";

import "./ContactPage.css";

const MESSAGE_MAX_LENGTH = 300;

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedMessage = message.trim();
  const remainingCharacters = MESSAGE_MAX_LENGTH - message.length;
  const isMessageValid =
    trimmedMessage.length >= 20 && message.length <= MESSAGE_MAX_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    if (!isMessageValid) {
      setErrorMessage("Message must be between 20 and 300 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendContactMessage({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: trimmedMessage,
      });

      setName("");
      setEmail("");
      setMessage("");
      setSuccessMessage("Message received.");
    } catch {
      setErrorMessage("Could not send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-header">
        <p className="contact-eyebrow">Contact</p>

        <h2>Contact developer</h2>

        <p className="contact-description">
          Send a short message about Bug-O-Dex. This form is for feedback,
          access questions, or project-related notes.
        </p>
      </section>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Name <span>optional</span>
          <input
            maxLength={80}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label>
          Email <span>optional</span>
          <input
            maxLength={120}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Message
          <textarea
            maxLength={MESSAGE_MAX_LENGTH}
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a short message..."
          />
        </label>

        <p className="contact-counter">
          {remainingCharacters} characters remaining. Minimum 20 characters.
        </p>

        {errorMessage && <p className="contact-error">{errorMessage}</p>}
        {successMessage && <p className="contact-success">{successMessage}</p>}

        <button type="submit" disabled={isSubmitting || !isMessageValid}>
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
      </form>

      <p className="contact-footer-link">
        <Link to="/">Return home</Link>
      </p>
    </main>
  );
}
