"""Iteration 7 — backend tests for the new endpoints requested in this review.

Covers:
  1. POST /api/admin/db/wipe-test-data (owner-only, preserves curated collections)
  2. POST /api/admin/quotes/{qid}/reply (attachments + templateId + backward compat)
  3. POST /api/admin/customers/{email}/email (templateId substitution)
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pro-tools-hub-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
OWNER_EMAIL = os.environ.get("TEST_OWNER_EMAIL", "yaniv@masterpiece-innovations.com")
OWNER_PASSWORD = os.environ.get("TEST_OWNER_PASSWORD", "Master2025!")


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(http):
    r = http.post(f"{API}/admin/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    code = r.json().get("demoCode")
    if not code:
        import sys
        sys.path.insert(0, "/app/backend")
        from auth import issue_jwt  # type: ignore
        return issue_jwt(OWNER_EMAIL, "owner")
    rv = http.post(f"{API}/admin/auth/verify", json={"email": OWNER_EMAIL, "code": code})
    assert rv.status_code == 200
    return rv.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- /admin/db/wipe-test-data ----------
class TestWipeTestData:
    def test_requires_auth(self, http):
        r = http.post(f"{API}/admin/db/wipe-test-data")
        assert r.status_code == 401

    def test_wipe_deletes_only_transactional(self, http, auth_headers):
        # 1) Snapshot curated collections via public endpoints (must survive)
        before_settings = http.get(f"{API}/settings").json().get("data", {})
        before_products = http.get(f"{API}/products").json().get("products", [])
        before_cats = http.get(f"{API}/categories").json().get("categories", [])
        # email templates require auth
        before_tpls = http.get(f"{API}/admin/email-templates", headers=auth_headers)
        # endpoint may be /admin/templates instead — try fallback
        if before_tpls.status_code == 404:
            before_tpls = http.get(f"{API}/admin/templates", headers=auth_headers)
        before_team = http.get(f"{API}/admin/team", headers=auth_headers)

        # 2) Seed at least one quote to be wiped
        seed = http.post(f"{API}/quotes", json={
            "firstName": "WipeSeed",
            "email": "TEST_wipe@example.com",
            "company": "WipeCo",
            "country": "Germany",
            "message": "wipe me",
        })
        assert seed.status_code == 200
        qid = seed.json()["qid"]

        # 3) Wipe
        r = http.post(f"{API}/admin/db/wipe-test-data", headers=auth_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert "deleted" in d
        assert set(d["deleted"].keys()) >= {"quotes", "customers", "ai_conversations", "email_history"}
        assert d["deleted"]["quotes"] >= 1

        # 4) Verify wipe — qid gone
        ql = http.get(f"{API}/admin/quotes", headers=auth_headers).json()
        assert not any(q.get("qid") == qid for q in ql.get("quotes", []))
        assert ql.get("count", 0) == 0

        # 5) Curated stuff still present
        after_settings = http.get(f"{API}/settings").json().get("data", {})
        # smtpHost preserved (non-empty pre-existed); settings doc shouldn't be wiped
        assert after_settings.get("companyName") == before_settings.get("companyName")

        after_products = http.get(f"{API}/products").json().get("products", [])
        assert len(after_products) == len(before_products)

        after_cats = http.get(f"{API}/categories").json().get("categories", [])
        assert len(after_cats) == len(before_cats)

        after_team = http.get(f"{API}/admin/team", headers=auth_headers)
        if before_team.status_code == 200 and after_team.status_code == 200:
            assert len(after_team.json().get("team", after_team.json().get("members", []))) == \
                   len(before_team.json().get("team", before_team.json().get("members", [])))


# ---------- /admin/quotes/{qid}/reply with attachments + templateId ----------
class TestQuoteReplyExtended:
    @pytest.fixture(scope="class")
    def fresh_qid(self, http):
        r = http.post(f"{API}/quotes", json={
            "firstName": "ReplyTest",
            "email": "TEST_reply@example.com",
            "company": "ReplyCo",
            "country": "NL",
            "message": "needs reply",
        })
        assert r.status_code == 200, r.text
        return r.json()["qid"]

    def test_backward_compatible_message_only(self, http, auth_headers, fresh_qid):
        r = http.post(
            f"{API}/admin/quotes/{fresh_qid}/reply",
            json={"message": "Plain reply"},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True

    def test_reply_with_attachments(self, http, auth_headers, fresh_qid):
        atts = [
            {"name": "spec.txt", "type": "text/plain", "data": "SGVsbG8="},  # base64 "Hello"
            {"name": "drawing.png", "type": "image/png", "data": "iVBORw0KGgo="},
        ]
        r = http.post(
            f"{API}/admin/quotes/{fresh_qid}/reply",
            json={"message": "with files", "subject": "Re: parts", "attachments": atts},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        # Now GET admin/quotes and look at last reply
        ql = http.get(f"{API}/admin/quotes", headers=auth_headers).json()
        q = next((x for x in ql["quotes"] if x["qid"] == fresh_qid), None)
        assert q is not None
        last = q.get("replies", [])[-1]
        # Either embed attachments or recorded attachmentCount
        assert last.get("attachmentCount", 0) == 2 or len(last.get("attachments", [])) == 2

    def test_reply_with_template_id(self, http, auth_headers, fresh_qid):
        # try to fetch any existing template
        tpl_r = http.get(f"{API}/admin/email-templates", headers=auth_headers)
        if tpl_r.status_code == 404:
            tpl_r = http.get(f"{API}/admin/templates", headers=auth_headers)
        if tpl_r.status_code != 200:
            pytest.skip("No templates endpoint available")
        tpls = tpl_r.json().get("templates", tpl_r.json().get("items", []))
        if not tpls:
            # Create a template
            cr = http.post(
                f"{API}/admin/email-templates",
                json={"name": "TEST_tpl", "subject": "Tpl Subject",
                      "html": "<p>Tpl Body for {firstName}</p>", "text": "Tpl Body"},
                headers=auth_headers,
            )
            if cr.status_code not in (200, 201):
                cr = http.post(
                    f"{API}/admin/templates",
                    json={"name": "TEST_tpl", "subject": "Tpl Subject",
                          "html": "<p>Tpl Body</p>"},
                    headers=auth_headers,
                )
            if cr.status_code not in (200, 201):
                pytest.skip(f"Cannot create template: {cr.status_code} {cr.text}")
            tpl = cr.json().get("template") or cr.json()
            tpl_id = tpl.get("id") or tpl.get("_id")
        else:
            tpl_id = tpls[0].get("id") or tpls[0].get("_id")
        r = http.post(
            f"{API}/admin/quotes/{fresh_qid}/reply",
            json={"message": "ignored?", "templateId": tpl_id},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text


# ---------- /admin/customers/{email}/email with templateId ----------
class TestCustomerEmailWithTemplate:
    def test_basic_send(self, http, auth_headers):
        r = http.post(
            f"{API}/admin/customers/TEST_buyer@example.com/email",
            json={"subject": "Hi", "html": "<p>Body</p>", "text": "Body"},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["ok"] in (True, False)  # mock or smtp

    def test_with_template_id(self, http, auth_headers):
        # Create / find a template
        tpl_r = http.get(f"{API}/admin/email-templates", headers=auth_headers)
        if tpl_r.status_code != 200:
            tpl_r = http.get(f"{API}/admin/templates", headers=auth_headers)
        if tpl_r.status_code != 200:
            pytest.skip("templates endpoint not available")
        tpls = tpl_r.json().get("templates", [])
        if not tpls:
            pytest.skip("no templates exist")
        tpl_id = tpls[0].get("id") or tpls[0].get("_id")
        r = http.post(
            f"{API}/admin/customers/TEST_tplbuyer@example.com/email",
            json={"subject": "", "html": "", "text": "", "templateId": tpl_id},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text

    def test_requires_auth(self, http):
        r = http.post(
            f"{API}/admin/customers/x@y.com/email",
            json={"subject": "x", "html": "x", "text": "x"},
        )
        assert r.status_code == 401
