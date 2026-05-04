import requests
import sys

# Get auth token from user
token = input("Enter your auth token (Bearer token from browser localStorage): ").strip()

if not token:
    print("No token provided, trying without auth...")
    headers = {}
else:
    headers = {"Authorization": f"Bearer {token}"}

url = "http://localhost:8000/api/v1/portfolio/publish"

print(f"\nCalling POST {url}")
print(f"Headers: {headers}\n")

try:
    response = requests.post(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print(f"\nResponse Body:")
    print(response.text)
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
