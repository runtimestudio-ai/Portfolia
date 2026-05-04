# test_publish_and_public.py
"""Test script to debug publish and public portfolio 404 issue"""

import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("Test: Debug Publish → Public Portfolio 404")
print("=" * 60)

# Step 1: Login
print("\n1. Login...")
response = requests.post(f"{BASE_URL}/login", json={
    "email": "test@example.com",  # Update with real credentials
    "password": "test123"
})

if response.status_code != 200:
    print(f"✗ Login failed: {response.status_code}")
    print(f"Response: {response.text}")
    exit(1)

token = response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print(f"✓ Login successful")

# Step 2: Get username
print("\n2. Get username...")
response = requests.get(f"{BASE_URL}/api/v1/me/username", headers=headers)
if response.status_code != 200:
    print(f"✗ Failed: {response.status_code} - {response.text}")
    exit(1)

username = response.json().get("username")
print(f"✓ Username: {username}")

# Step 3: Create/save a draft with is_public = True
print("\n3. Saving draft with is_public=True...")
draft_data = {
    "data": {
        "profile": {
            "name": "Test User",
            "email": "test@example.com",
            "title": "Developer (DRAFT TEST)",
            "location": "Test City",
            "bio": "Test bio from draft",
            "github": "",
            "linkedin": "",
            "website": "",
            "avatar": ""
        },
        "projects": [
            {
                "title": "Draft Test Project",
                "description": "This project was published from draft",
                "type": "others",
                "stack": ["Python", "FastAPI"],
                "features": ["Testing"],
                "link": "https://example.com",
                "stars": 0,
                "forks": 0,
                "imported": False,
                "ai_summary": False,
                "saved": True
            }
        ],
        "skills": [{"name": "Python", "level": 90, "category": "Backend", "experience": None}],
        "work_experiences": [],
        "certificates": [],
        "awards": [],
        "settings": {
            "is_public": True,  # IMPORTANT: Set to True
            "theme_preference": "classic",
            "analytics_enabled": False
        }
    }
}

response = requests.post(f"{BASE_URL}/api/v1/portfolio/editor", json=draft_data, headers=headers)
if response.status_code != 200:
    print(f"✗ Failed to save draft: {response.status_code}")
    print(response.text)
    exit(1)

saved_draft = response.json()
print(f"✓ Draft saved")
print(f"  is_public in draft: {saved_draft['data']['settings']['is_public']}")

# Step 4: Publish the draft
print("\n4. Publishing draft...")
response = requests.post(f"{BASE_URL}/api/v1/portfolio/publish", headers=headers)
if response.status_code != 200:
    print(f"✗ Publish failed: {response.status_code}")
    print(response.text)
    exit(1)

print(f"✓ {response.json()['message']}")

# Step 5: Try to get public portfolio
print(f"\n5. Getting public portfolio at /api/portfolio/{username}...")
print(f"   URL: {BASE_URL}/api/portfolio/{username}")
print("   (Check backend logs for [DEBUG] messages)")

response = requests.get(f"{BASE_URL}/api/portfolio/{username}")
print(f"\n   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"   ✓ SUCCESS! Portfolio retrieved")
    print(f"   Title: {data.get('title')}")
    print(f"   Projects: {len(data.get('projects', []))}")
    print(f"   Theme: {data.get('theme_preference')}")
elif response.status_code == 404:
    print(f"   ✗ 404 NOT FOUND")
    print(f"   Response: {response.text}")
    print(f"\n   CHECK BACKEND LOGS ABOVE FOR:")
    print(f"   - Is user found?")
    print(f"   - What is user.is_public value?")
elif response.status_code == 403:
    print(f"   ✗ 403 FORBIDDEN (Portfolio is private)")
    print(f"   Response: {response.text}")
    print(f"\n   → is_public is False! Check why publish didn't set it correctly")
elif response.status_code == 400:
    print(f"   ✗ 400 BAD REQUEST (Reserved username?)")
    print(f"   Response: {response.text}")
else:
    print(f"   ✗ Unexpected status: {response.text}")

print("\n" + "=" * 60)
print("Check the backend terminal for [DEBUG] log messages!")
print("=" * 60)
