"""Masterpiece Tools - Phase 2 backend API tests (iteration 4).

Covers:
  - /api/health
  - Public RFQ submit /api/quotes (success + validation 422)
  - Admin auth /api/admin/auth/login (success + bad password 401)
  - Admin OTP verify /api/admin/auth/verify (success + wrong code 401)
  - /api/admin/me
  - Protected enforcement on /api/admin/quotes (no token = 401)
  - Settings PUT/GET roundtrip
  - Admin reply (appends replies array)
  - Customers aggregate
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pro-tools-hub-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

OWNER_EMAIL = "yaniv@masterpiece-innovations.com"
OWNER_PASSWORD = "Master2025!"
LEGACY_EMAIL = "admin@masterpiece-tools.com"


# ---------- Shared session & login fixtures ----------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    code = data.get("demoCode")
    assert code, "demoCode missing - SMTP must be unconfigured for tests"
    rv = http.post(f"{API}/admin/auth/verify", json={"email": OWNER_EMAIL, "code": code})
    assert rv.status_code == 200, f"verify failed: {rv.status_code} {rv.text}"
    tok = rv.json().get("token")
    assert tok and isinstance(tok, str) and len(tok) > 20
    return tok


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_health(self, http):
        r = http.get(f"{API}/health")
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert d["service"] == "masterpiece-tools-api"
        assert d["version"] == "2.1.0"
        assert "email_configured" in d
        assert d["owner_email"] == OWNER_EMAIL


# ---------- Public RFQ submission ----------
class TestQuotesPublic:
    def test_submit_quote_success(self, http):
        payload = {
            "firstName": "Alice",
            "email": "alice@test.com",
            "company": "TestCo",
            "country": "Germany",
            "message": "5x M10 plug",
            "productTypes": {"gauge": True},
        }
        r = http.post(f"{API}/quotes", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert re.match(r"^Q-[A-F0-9]{8}$", d["qid"]), d["qid"]
        assert d["email_mode"] in ("mock", "smtp")
        # store qid for downstream tests
        pytest.created_qid = d["qid"]

    def test_submit_quote_invalid_email_422(self, http):
        r = http.post(f"{API}/quotes", json={
            "firstName": "Bob",
            "email": "not-an-email",
            "company": "TestCo",
        })
        assert r.status_code == 422

    def test_submit_quote_missing_required_422(self, http):
        r = http.post(f"{API}/quotes", json={"firstName": "Bob"})
        assert r.status_code == 422


# ---------- Admin auth ----------
class TestAdminAuth:
    def test_login_success_returns_democode(self, http):
        r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["ttlSeconds"] == 600
        # SMTP not configured in preview -> demoCode surfaced
        assert "demoCode" in d
        assert re.match(r"^\d{6}$", d["demoCode"])

    def test_login_wrong_password_401(self, http):
        r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": "WRONG"})
        assert r.status_code == 401
        assert "Invalid credentials" in r.text

    def test_legacy_admin_email_rejected(self, http):
        r = http.post(f"{API}/admin/auth/login", json={"email": LEGACY_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 401

    def test_verify_wrong_code_401(self, http):
        # trigger an OTP first
        http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        r = http.post(f"{API}/admin/auth/verify", json={"email": OWNER_EMAIL, "code": "000000"})
        assert r.status_code == 401

    def test_verify_full_flow_returns_jwt(self, admin_token):
        # admin_token fixture already does login + verify
        assert admin_token.count(".") == 2  # JWT has 3 segments

    def test_me_returns_owner(self, http, auth_headers):
        r = http.get(f"{API}/admin/me", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == OWNER_EMAIL
        assert d["role"] == "owner"


# ---------- Protected endpoint enforcement ----------
class TestProtectedEnforcement:
    def test_admin_quotes_without_token_401(self, http):
        r = http.get(f"{API}/admin/quotes")
        assert r.status_code == 401

    def test_admin_quotes_with_bad_token_401(self, http):
        r = http.get(f"{API}/admin/quotes", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code == 401

    def test_admin_quotes_with_token_lists(self, http, auth_headers):
        r = http.get(f"{API}/admin/quotes", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "quotes" in d
        assert "count" in d
        assert isinstance(d["quotes"], list)
        # The Alice quote we just submitted should be present
        qid = getattr(pytest, "created_qid", None)
        if qid:
            assert any(q.get("qid") == qid for q in d["quotes"]), "submitted quote not visible in admin list"
            # confirm _id is not leaked
            sample = d["quotes"][0]
            assert "_id" not in sample


# ---------- Settings persistence ----------
class TestSettings:
    def test_settings_roundtrip(self, http, auth_headers):
        # capture original
        original = http.get(f"{API}/settings").json().get("data", {})
        # PUT new value
        new_data = dict(original)
        new_data["companyName"] = "Acme Co"
        r = http.put(f"{API}/admin/settings", json={"data": new_data}, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # GET public confirms persistence
        r2 = http.get(f"{API}/settings")
        assert r2.status_code == 200
        assert r2.json()["data"]["companyName"] == "Acme Co"
        # restore (remove companyName or set back to original)
        if "companyName" in original:
            restored = original
        else:
            restored = {k: v for k, v in new_data.items() if k != "companyName"}
        rr = http.put(f"{API}/admin/settings", json={"data": restored}, headers=auth_headers)
        assert rr.status_code == 200

    def test_settings_put_without_auth_401(self, http):
        r = http.put(f"{API}/admin/settings", json={"data": {"x": 1}})
        assert r.status_code == 401


# ---------- Admin reply ----------
class TestAdminReply:
    def test_reply_appends(self, http, auth_headers):
        qid = getattr(pytest, "created_qid", None)
        if not qid:
            pytest.skip("no qid created earlier")
        r = http.post(
            f"{API}/admin/quotes/{qid}/reply",
            json={"message": "Thanks!", "subject": "Re: hello"},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["mode"] in ("mock", "smtp")
        # verify by listing and finding replies entry
        r2 = http.get(f"{API}/admin/quotes", headers=auth_headers)
        match = next((q for q in r2.json()["quotes"] if q.get("qid") == qid), None)
        assert match, "quote disappeared after reply"
        assert match.get("replies"), "replies array not appended"
        assert match["replies"][-1]["message"] == "Thanks!"
        assert match["replies"][-1]["subject"] == "Re: hello"

    def test_reply_missing_message_400(self, http, auth_headers):
        qid = getattr(pytest, "created_qid", None)
        if not qid:
            pytest.skip("no qid created")
        r = http.post(f"{API}/admin/quotes/{qid}/reply", json={"message": ""}, headers=auth_headers)
        assert r.status_code in (400, 422)

    def test_reply_unknown_qid_404(self, http, auth_headers):
        r = http.post(f"{API}/admin/quotes/Q-DOESNOT/reply", json={"message": "x"}, headers=auth_headers)
        assert r.status_code == 404


# ---------- Customers aggregate ----------
class TestCustomers:
    def test_customers_aggregate(self, http, auth_headers):
        r = http.get(f"{API}/admin/customers", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "customers" in d and "count" in d
        emails = {c["email"] for c in d["customers"]}
        assert "alice@test.com" in emails, "submitted alice customer missing"
        alice = next(c for c in d["customers"] if c["email"] == "alice@test.com")
        assert alice["quoteCount"] >= 1
        assert "_id" not in alice

    def test_customers_without_auth_401(self, http):
        r = http.get(f"{API}/admin/customers")
        assert r.status_code == 401



# ---------- v2.1.0: Owner account change-password (with revert) ----------
class TestChangePassword:
    """POST /api/admin/account/change-password: validate rotation, then revert."""

    def test_change_password_flow_with_revert(self, http, auth_headers):
        NEW_PW = "TempRotate#2026"
        # 1) Wrong current password rejected
        r = http.post(
            f"{API}/admin/account/change-password",
            json={"currentPassword": "definitely-wrong", "newPassword": NEW_PW},
            headers=auth_headers,
        )
        assert r.status_code == 400

        # 2) Correct current rotates
        r = http.post(
            f"{API}/admin/account/change-password",
            json={"currentPassword": OWNER_PASSWORD, "newPassword": NEW_PW},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True

        # 3) Old password fails on /admin/auth/login
        r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 401, "old password must fail after rotation"

        # 4) New password works
        r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": NEW_PW})
        assert r.status_code == 200
        code = r.json().get("demoCode")
        assert code
        rv = http.post(f"{API}/admin/auth/verify", json={"email": OWNER_EMAIL, "code": code})
        assert rv.status_code == 200
        new_token = rv.json()["token"]
        new_headers = {"Authorization": f"Bearer {new_token}", "Content-Type": "application/json"}

        # 5) REVERT to original (CRITICAL)
        rr = http.post(
            f"{API}/admin/account/change-password",
            json={"currentPassword": NEW_PW, "newPassword": OWNER_PASSWORD},
            headers=new_headers,
        )
        assert rr.status_code == 200, f"REVERT FAILED — password may still be {NEW_PW}! body={rr.text}"

        # 6) Confirm original works again
        rc = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        assert rc.status_code == 200, "original password not restored"


# ---------- v2.1.0: Owner account change-email (with revert) ----------
class TestChangeEmail:
    def test_change_email_flow_with_revert(self, http, auth_headers):
        TEMP_EMAIL = "temp-rotation@example.com"

        # Wrong password rejected
        r = http.post(
            f"{API}/admin/account/change-email",
            json={"newEmail": TEMP_EMAIL, "currentPassword": "nope"},
            headers=auth_headers,
        )
        assert r.status_code == 400

        # Rotate forward
        r = http.post(
            f"{API}/admin/account/change-email",
            json={"newEmail": TEMP_EMAIL, "currentPassword": OWNER_PASSWORD},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["newEmail"] == TEMP_EMAIL

        # Confirm via health
        h = http.get(f"{API}/health").json()
        assert h["owner_email"] == TEMP_EMAIL

        # Log in under temp email
        r = http.post(f"{API}/admin/auth/login", json={"email": TEMP_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 200
        code = r.json().get("demoCode")
        rv = http.post(f"{API}/admin/auth/verify", json={"email": TEMP_EMAIL, "code": code})
        assert rv.status_code == 200
        tmp_headers = {"Authorization": f"Bearer {rv.json()['token']}", "Content-Type": "application/json"}

        # REVERT to original (CRITICAL)
        rr = http.post(
            f"{API}/admin/account/change-email",
            json={"newEmail": OWNER_EMAIL, "currentPassword": OWNER_PASSWORD},
            headers=tmp_headers,
        )
        assert rr.status_code == 200, f"REVERT FAILED — owner email still {TEMP_EMAIL}! body={rr.text}"
        h2 = http.get(f"{API}/health").json()
        assert h2["owner_email"] == OWNER_EMAIL


# ---------- v2.1.0: /api/admin/email/test ----------
class TestEmailTestEndpoint:
    def test_email_test_when_smtp_unset(self, http, auth_headers):
        r = http.post(
            f"{API}/admin/email/test",
            json={"to": "someone@example.com"},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert d["mode"] == "mock"
        assert "SMTP not configured" in d.get("error", "")
        # message must guide the user to set host/user/password
        assert "host" in d["error"].lower()
        assert "password" in d["error"].lower()

    def test_email_test_requires_auth(self, http):
        r = http.post(f"{API}/admin/email/test", json={"to": "x@y.com"})
        assert r.status_code == 401


# ---------- v2.1.0: SMTP password preservation on empty PUT ----------
class TestSmtpPasswordPreservation:
    def test_smtp_password_preserved_on_empty_put(self, http, auth_headers):
        # Snapshot original public data so we can restore at the end
        original_pub = http.get(f"{API}/settings").json().get("data", {})

        # 1) PUT a full SMTP config
        full = {
            "smtpHost": "smtp.test.com",
            "smtpUser": "foo",
            "smtpPassword": "secret",
            "smtpPort": "587",
            "fromEmail": "x@y.com",
        }
        merged = {**original_pub, **full}
        r = http.put(f"{API}/admin/settings", json={"data": merged}, headers=auth_headers)
        assert r.status_code == 200

        # 2) public GET must strip smtpPassword
        pub = http.get(f"{API}/settings").json()["data"]
        assert "smtpPassword" not in pub, "smtpPassword leaked through public /api/settings"
        assert pub.get("smtpHost") == "smtp.test.com"
        assert pub.get("smtpUser") == "foo"

        # 3) health.email_configured should flip true
        h = http.get(f"{API}/health").json()
        assert h["email_configured"] is True, "email_configured should be true once SMTP fully set"

        # 4) PUT again with smtpPassword="" — must preserve prior password
        merged2 = {**original_pub, **full, "smtpPassword": ""}
        r2 = http.put(f"{API}/admin/settings", json={"data": merged2}, headers=auth_headers)
        assert r2.status_code == 200
        h2 = http.get(f"{API}/health").json()
        assert h2["email_configured"] is True, "empty smtpPassword PUT wiped the password (regression!)"

        # 5) Restore original public data (clear smtp* fields so subsequent runs see demoCode)
        # Build a wipe payload from original + explicit empties for SMTP
        wipe = dict(original_pub)
        for k in ("smtpHost", "smtpUser", "smtpPort", "fromEmail"):
            wipe[k] = original_pub.get(k, "")
        # Explicitly remove smtpPassword by writing a sentinel non-empty then null... simpler:
        # Use a tiny direct DB-style update via admin endpoint by sending all fields including
        # smtpPassword as a non-empty placeholder then setting all smtp fields blank.
        # First: overwrite with a placeholder password so the "empty preserves prior" rule
        # doesn't keep our test 'secret' alive.
        placeholder = {**wipe, "smtpHost": "", "smtpUser": "", "smtpPassword": "WIPE", "smtpPort": "", "fromEmail": original_pub.get("fromEmail", "")}
        http.put(f"{API}/admin/settings", json={"data": placeholder}, headers=auth_headers)
        # Then overwrite again with all smtp* blank and a non-empty password placeholder
        # cleared by setting smtpPassword to a single space (still truthy server-side)
        # Final clean: rewrite without smtp keys at all — but server merges by replace, so
        # absence of key === absence. Write wipe (smtpHost/user blank, no smtpPassword key)
        final = dict(original_pub)
        for k in ("smtpHost", "smtpUser", "smtpPort", "fromEmail"):
            final[k] = ""
        # Don't include smtpPassword at all — the preserve rule only kicks in for "" not missing
        final.pop("smtpPassword", None)
        http.put(f"{API}/admin/settings", json={"data": final}, headers=auth_headers)
        h3 = http.get(f"{API}/health").json()
        assert h3["email_configured"] is False, "cleanup failed — SMTP still appears configured"


# ---------- v2.1.0: Public RFQ end-to-end → visible in admin/quotes ----------
class TestPublicRfqVisibleInAdmin:
    def test_public_quote_appears_in_admin(self, http, auth_headers):
        payload = {
            "firstName": "Iter5",
            "email": "iter5@test.com",
            "company": "Iter5Co",
            "country": "Netherlands",
            "message": "iter5 e2e",
        }
        r = http.post(f"{API}/quotes", json=payload)
        assert r.status_code == 200
        qid = r.json()["qid"]
        assert re.match(r"^Q-[A-F0-9]{8}$", qid)
        # admin list
        rl = http.get(f"{API}/admin/quotes", headers=auth_headers)
        assert rl.status_code == 200
        assert any(q.get("qid") == qid for q in rl.json()["quotes"])
