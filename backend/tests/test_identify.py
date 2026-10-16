"""Offline endpoint regressions: python -m unittest discover -s tests -v."""

import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import UUID

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
)

# Supply every required setting before importing the router. No real credentials,
# database, storage, or provider are needed, even if a developer has a local .env.
with patch.dict(os.environ, {
    "DATABASE_URL": "sqlite://",
    "SECRET_KEY": "test-only-secret",
    "SUPABASE_URL": "https://storage.example.invalid",
    "SUPABASE_SECRET_KEY": "test-only-storage-key",
    "OPENAI_API_KEY": "test-only-provider-key",
}):
    from app.routers import identify


PAYLOAD = {
    "image_url": "https://example.invalid/private.jpg?token=private-image-token",
    "location_context": "private-location-context",
    "date_found": "2026-10-16",
    "notes": "private-discovery-notes",
}
RESULT = {
    "common_name": "Ladybug",
    "category": "Beetle",
    "short_description": "A small spotted beetle.",
    "confidence_note": "This is a best guess.",
    "safety_note": "Look without touching.",
    "best_guess_disclaimer": "Not a scientific identification.",
}
PRIVATE_ERROR = "sk-test-sensitive-key private-provider-body private-provider-request-id"


class IdentifyTests(unittest.TestCase):
    def setUp(self):
        # Block real HTTP transport as a second guard against paid provider calls.
        self.transport = self.enterContext(patch(
            "httpx.HTTPTransport.handle_request",
            side_effect=AssertionError("Network access is forbidden in this test"),
        ))
        self.provider = self.enterContext(patch.object(identify, "OpenAI"))
        self.create = self.provider.return_value.responses.create
        self.create.return_value = SimpleNamespace(output_text=json.dumps(RESULT))
        self.db = Mock()
        self.app = FastAPI()
        self.app.include_router(identify.router)
        self.app.dependency_overrides[identify.get_current_user] = lambda: SimpleNamespace(
            id=UUID("00000000-0000-0000-0000-000000000001")
        )
        self.app.dependency_overrides[identify.get_db] = lambda: self.db
        self.client = self.enterContext(TestClient(self.app))

    def tearDown(self):
        self.transport.assert_not_called()
        self.assertEqual(self.db.mock_calls, [])

    def assert_safe_failure(self, stage, error_type):
        with self.assertLogs(identify.logger, level="ERROR") as captured:
            response = self.client.post("/identify", json=PAYLOAD)

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {
            "detail": "Bug identification failed. Please try again.",
        })
        error_id = response.headers["X-Error-ID"]
        self.assertEqual(UUID(error_id).version, 4)
        self.assertEqual(len(captured.records), 1)
        record = captured.records[0]
        self.assertEqual(record.getMessage(), (
            f"Bug identification failed error_id={error_id} "
            f"stage={stage} error_type={error_type}"
        ))
        self.assertIsNone(record.exc_info)
        self.assertIsNone(record.stack_info)
        exposed = response.text + str(response.headers) + repr(record.__dict__)
        for sensitive in [*PAYLOAD.values(), *PRIVATE_ERROR.split(),
                          "test-only-provider-key", "private-invalid-model-output"]:
            self.assertNotIn(sensitive, exposed)
        return error_id

    def test_success_preserves_response_and_provider_request(self):
        with self.assertNoLogs(identify.logger, level="ERROR"):
            response = self.client.post("/identify", json=PAYLOAD)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), RESULT)
        self.assertNotIn("X-Error-ID", response.headers)
        self.create.assert_called_once()
        request = self.create.call_args.kwargs
        self.assertEqual(request["model"], "gpt-4.1-mini")
        self.assertTrue(request["text"]["format"]["strict"])
        content = request["input"][0]["content"]
        self.assertEqual(content[1]["image_url"], PAYLOAD["image_url"])
        self.assertIn(PAYLOAD["notes"], content[0]["text"])

    def test_client_initialization_failure_is_safe(self):
        self.provider.side_effect = RuntimeError(PRIVATE_ERROR)
        self.assert_safe_failure("client_initialization", "RuntimeError")
        self.create.assert_not_called()

    def test_provider_failures_are_safe(self):
        request = httpx.Request("POST", "https://api.example.invalid/responses",
                                headers={"Authorization": PRIVATE_ERROR})
        errors = [
            APITimeoutError(request=request),
            APIConnectionError(message=PRIVATE_ERROR, request=request),
            RuntimeError(PRIVATE_ERROR),
        ]
        for error_class, status in [
            (AuthenticationError, 401),
            (BadRequestError, 400),
            (RateLimitError, 429),
            (InternalServerError, 500),
        ]:
            errors.append(error_class(
                PRIVATE_ERROR,
                response=httpx.Response(status, request=request,
                                        headers={"x-request-id": PRIVATE_ERROR}),
                body={"error": PRIVATE_ERROR, "input": PAYLOAD},
            ))
        for error in errors:
            with self.subTest(error=type(error).__name__):
                self.create.side_effect = error
                self.assert_safe_failure("provider_request", type(error).__name__)

    def test_unusable_provider_text_is_safe(self):
        # Refusals/empty output and malformed JSON must not become successful 200s.
        for output, error_type in [
            ("", "JSONDecodeError"),
            ("private-invalid-model-output", "JSONDecodeError"),
            (None, "TypeError"),
        ]:
            with self.subTest(output=output):
                self.create.return_value = SimpleNamespace(output_text=output)
                self.assert_safe_failure("response_decoding", error_type)

    def test_missing_provider_output_is_safe(self):
        self.create.return_value = SimpleNamespace()
        self.assert_safe_failure("response_decoding", "AttributeError")

    def test_invalid_response_schema_is_safe(self):
        for output, error_type in [
            ({"common_name": "private-invalid-model-output"}, "ValidationError"),
            ({**RESULT, "common_name": {"private-invalid-model-output": True}},
             "ValidationError"),
            (["private-invalid-model-output"], "TypeError"),
            (None, "TypeError"),
        ]:
            with self.subTest(output=output):
                self.create.return_value = SimpleNamespace(output_text=json.dumps(output))
                self.assert_safe_failure("response_validation", error_type)

    def test_error_ids_are_unique(self):
        self.create.side_effect = RuntimeError(PRIVATE_ERROR)
        first = self.assert_safe_failure("provider_request", "RuntimeError")
        second = self.assert_safe_failure("provider_request", "RuntimeError")
        self.assertNotEqual(first, second)

    def test_unauthenticated_request_does_not_call_provider(self):
        del self.app.dependency_overrides[identify.get_current_user]
        response = self.client.post("/identify", json=PAYLOAD)
        self.assertEqual(response.status_code, 401)
        self.provider.assert_not_called()

    def test_invalid_request_does_not_call_provider(self):
        response = self.client.post("/identify", json={})
        self.assertEqual(response.status_code, 422)
        self.provider.assert_not_called()


if __name__ == "__main__":
    unittest.main()
