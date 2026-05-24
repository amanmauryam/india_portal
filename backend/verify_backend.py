import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_request(url, data=None, headers=None, method="GET"):
    if headers is None:
        headers = {}
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_content)
            return e.code, err_json
        except Exception:
            return e.code, err_content
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("Starting backend integration tests...")
    
    # 1. Health check
    status, res = make_request(f"{BASE_URL}/api/health")
    assert status == 200, f"Health check failed: {status}"
    print("[PASS] Health check endpoint works.")
    
    # 2. Authenticate
    login_data = {
        "email": "admin@portal.gov.in",
        "password": "adminpassword123"
    }
    status, res = make_request(f"{BASE_URL}/api/auth/login", data=login_data, method="POST")
    assert status == 200, f"Login failed: {status} - {res}"
    token = res["access_token"]
    user_role = res["user"]["role"]
    assert user_role == "SUPER_ADMIN", f"Expected SUPER_ADMIN role, got: {user_role}"
    print(f"[PASS] Auth login works. Obtained token for {res['user']['full_name']} ({user_role}).")
    
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Read states
    status, res = make_request(f"{BASE_URL}/api/states")
    assert status == 200, f"Get states failed: {status}"
    assert len(res) > 0, "No states returned"
    state_slug = res[0]["slug"]
    print(f"[PASS] Read states works. Found state: {res[0]['name']} (slug: {state_slug}).")
    
    # 4. Read districts for state
    status, res = make_request(f"{BASE_URL}/api/states/{state_slug}")
    assert status == 200, f"Get state detail failed: {status}"
    assert len(res["districts"]) > 0, f"No districts found for state {state_slug}"
    district_slug = res["districts"][0]["slug"]
    print(f"[PASS] Read state detail works. Found district: {res['districts'][0]['name']} (slug: {district_slug}).")
    
    # 5. Read services for district
    status, res = make_request(f"{BASE_URL}/api/districts/by-slug/{state_slug}/{district_slug}")
    assert status == 200, f"Get district by slug failed: {status}"
    assert len(res["services"]) > 0, f"No services found for district {district_slug}"
    service_slug = res["services"][0]["slug"]
    print(f"[PASS] Read district page works. Found service: {res['services'][0]['name']} (slug: {service_slug}).")
    
    # 6. Read service detail page
    status, res = make_request(f"{BASE_URL}/api/services/by-slug/{state_slug}/{district_slug}/{service_slug}")
    assert status == 200, f"Get service detail failed: {status}"
    assert res["name"] is not None
    print(f"[PASS] Read service detail page works. Official link is: {res['official_link']}.")
    
    # 7. Try creating a state with token
    new_state_data = {
        "name": "Tamil Nadu",
        "slug": "tamil-nadu",
        "description": "Southern state known for its temples and classical arts."
    }
    status, res = make_request(f"{BASE_URL}/api/states", data=new_state_data, headers=auth_headers, method="POST")
    assert status == 201, f"Create state failed: {status} - {res}"
    print("[PASS] Created state 'Tamil Nadu' successfully.")
    
    # 8. Try creating a duplicate state (should fail)
    status, res = make_request(f"{BASE_URL}/api/states", data=new_state_data, headers=auth_headers, method="POST")
    assert status == 400, f"Expected duplicate state error, got: {status} - {res}"
    print("[PASS] Duplicate state check works (correctly returned 400).")
    
    # 9. Try creating a blog post with token
    new_blog_data = {
        "title": "Varanasi Wooden Toys and Handicrafts",
        "slug": "varanasi-wooden-toys-guide",
        "content_blocks": [
            {"id": "b1", "type": "heading", "data": {"level": 2, "text": "Crafting Lacquered Toys"}},
            {"id": "b2", "type": "paragraph", "data": {"text": "Varanasi wooden toys are handcrafted by the local community..."}}
        ],
        "status": "PUBLISHED",
        "meta_title": "Guide to Varanasi Wooden Toys | India Hyperlocal Utility",
        "meta_description": "Explore the famous lacquered wooden toys of Varanasi, UP under the One District One Product scheme."
    }
    status, res = make_request(f"{BASE_URL}/api/blogs", data=new_blog_data, headers=auth_headers, method="POST")
    assert status == 201, f"Create blog post failed: {status} - {res}"
    print("[PASS] Created blog post successfully.")
    
    # 10. Fetch blog posts and verify
    status, res = make_request(f"{BASE_URL}/api/blogs")
    assert status == 200, f"Get blogs failed: {status}"
    assert len(res) > 0, "No blogs returned"
    print("[PASS] Read blog posts list works.")
    
    print("\nAll integration tests passed successfully!")

if __name__ == "__main__":
    # Wait for server to start if run immediately
    time.sleep(2)
    run_tests()

