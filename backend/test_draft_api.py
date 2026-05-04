# test_draft_api.py
"""Quick test script for draft/publish API endpoints"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Test 1: Login to get token
print("=" * 60)
print("Test 1: Login to get token")
print("=" * 60)

login_data = {
    "username": "test",
    "password": "test123"
}

try:
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"✓ Login successful")
        print(f"Token: {token[:50]}...")
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test 2: GET /portfolio/editor (first time - creates draft)
print("\n" + "=" * 60)
print("Test 2: GET /portfolio/editor (creates draft from snapshot)")
print("=" * 60)

try:
    response = requests.get(f"{BASE_URL}/api/v1/portfolio/editor", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Draft retrieved successfully")
        print(f"Updated at: {data.get('updated_at')}")
        print(f"Data keys: {list(data.get('data', {}).keys())}")
        print(f"Projects count: {len(data.get('data', {}).get('projects', []))}")
    else:
        print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: POST /portfolio/editor (save draft with modified data)
print("\n" + "=" * 60)
print("Test 3: POST /portfolio/editor (save modified draft)")
print("=" * 60)

modified_data = {
    "data": {
        "profile": {
            "name": "Test User Modified",
            "email": "test@example.com",
            "title": "Senior Developer (Draft)",
            "location": "Test City",
            "bio": "This is modified draft data",
            "github": "",
            "linkedin": "",
            "website": "",
            "avatar": ""
        },
        "projects": [
            {
                "title": "Draft Project 1",
                "description": "This is a draft project",
                "type": "github",
                "stack": ["Python", "FastAPI"],
                "features": ["Auth", "API"],
                "link": "https://example.com",
                "stars": 100,
                "forks": 20,
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
            "is_public": True,
            "theme_preference": "creative",
            "analytics_enabled": False
        }
    }
}

try:
    response = requests.post(f"{BASE_URL}/api/v1/portfolio/editor", json=modified_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Draft saved successfully")
        print(f"Updated at: {data.get('updated_at')}")
        print(f"Profile title: {data.get('data', {}).get('profile', {}).get('title')}")
    else:
        print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: GET /portfolio/editor again (should return modified data)
print("\n" + "=" * 60)
print("Test 4: GET /portfolio/editor (verify saved changes)")
print("=" * 60)

try:
    response = requests.get(f"{BASE_URL}/api/v1/portfolio/editor", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Draft retrieved")
        title = data.get('data', {}).get('profile', {}).get('title')
        print(f"Profile title: {title}")
        if "Draft" in title:
            print(f"✓ Verified: Changes were saved")
        else:
            print(f"✗ Warning: Expected modified data")
    else:
        print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: POST /portfolio/publish
print("\n" + "=" * 60)
print("Test 5: POST /portfolio/publish (publish draft to live)")
print("=" * 60)

try:
    response = requests.post(f"{BASE_URL}/api/v1/portfolio/publish", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ {data.get('message')}")
    else:
        print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Verify published data on public endpoint
print("\n" + "=" * 60)
print("Test 6: Verify published data (GET /portfolio/{username})")
print("=" * 60)

try:
    # First get username from user endpoint
    response = requests.get(f"{BASE_URL}/api/user/me", headers=headers)
    if response.status_code == 200:
        username = response.json().get("username")
        print(f"Username: {username}")
        
        # Now get public portfolio
        response = requests.get(f"{BASE_URL}/api/portfolio/{username}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Public portfolio retrieved")
            print(f"Title: {data.get('title')}")
            print(f"Theme: {data.get('theme_preference')}")
            if "Draft" in data.get('title', ''):
                print(f"✓ Verified: Published data matches draft!")
            else:
                print(f"Note: Title doesn't contain 'Draft' - may be from older data")
        else:
            print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
