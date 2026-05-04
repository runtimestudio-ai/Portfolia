import requests
import json

# Test publish endpoint
url = "http://localhost:8000/api/v1/portfolio/publish"

# Get token (you'll need a valid token)
# For now, let's just test without auth to see what happens
headers = {
    "Content-Type": "application/json"
}

print("Testing publish endpoint...")
print(f"URL: {url}")

try:
    response = requests.post(url, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
