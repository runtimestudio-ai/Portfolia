# Testing Instructions for Public Portfolio Endpoint

## Issue Diagnosis

The public portfolio endpoint `GET /api/portfolio/{username}` was returning 404 because it requires the **exact username** from the `User.username` field.

### Key Findings:
- Route: `GET /api/portfolio/{username}` (in `portfolio.py`)
- Field used: `User.username` (stored in lowercase)
- Lookup: **Case-insensitive** (both `/portfolio/JohnDoe` and `/portfolio/johndoe` work)
- Auth: **Not required** for public portfolios
- Privacy check: Returns 403 if `user.is_public = false`

---

## Testing with Postman

### Step 1: Login to Get Token

**Request:**
```
POST http://localhost:8000/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Action:** Copy the `access_token` value.

---

### Step 2: Get Your Username

**Request:**
```
GET http://localhost:8000/api/v1/me/username
Authorization: Bearer <paste_your_token_here>
```

**Expected Response (200 OK):**
```json
{
  "username": "johndoe"
}
```

**Action:** Copy the `username` value (e.g., "johndoe").

---

### Step 3: Get Public Portfolio (No Auth)

**Request:**
```
GET http://localhost:8000/api/portfolio/johndoe
```
*Note: Replace "johndoe" with the username from Step 2*
*No Authorization header needed*

**Expected Response (200 OK):**
```json
{
  "username": "johndoe",
  "name": "John Doe",
  "title": "Developer",
  "tagline": "Building the future...",
  "projects": [...],
  "skills": [...],
  ...
}
```

---

## Possible Errors

### 404 Not Found
**Cause:** Username doesn't match any user in database
**Fix:** Double-check you're using the exact username from Step 2

### 403 Forbidden
**Response:**
```json
{
  "detail": "Portfolio is private"
}
```
**Cause:** User's `is_public` field is set to `false`
**Fix:** Update user settings to make portfolio public:
```sql
UPDATE "user" SET is_public = true WHERE username = 'johndoe';
```

### 400 Invalid Username
**Response:**
```json
{
  "detail": "Invalid username"
}
```
**Cause:** Username is in reserved list (e.g., "dashboard", "auth", "portfolio", "api")
**Fix:** Use a different, non-reserved username

---

## Quick Test Script (Python)

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Login
response = requests.post(f"{BASE_URL}/login", json={
    "email": "your@email.com",
    "password": "yourpassword"
})
token = response.json()["access_token"]
print(f"✓ Got token: {token[:20]}...")

# 2. Get username
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/v1/me/username", headers=headers)
username = response.json()["username"]
print(f"✓ Username: {username}")

# 3. Get public portfolio (no auth)
response = requests.get(f"{BASE_URL}/api/portfolio/{username}")
if response.status_code == 200:
    data = response.json()
    print(f"✓ Portfolio found!")
    print(f"  Name: {data['name']}")
    print(f"  Projects: {len(data['projects'])}")
elif response.status_code == 403:
    print(f"✗ Portfolio is private")
else:
    print(f"✗ Error {response.status_code}: {response.text}")
```

---

## Summary

✅ **Helper endpoint added:** `GET /api/v1/me/username`
- Returns authenticated user's username
- Requires JWT Bearer token
- Use this value for public portfolio endpoint

✅ **Public portfolio endpoint:** `GET /api/portfolio/{username}`
- Case-insensitive username lookup
- No authentication required (if portfolio is public)
- Returns 403 if portfolio is private
- Returns 404 if user not found
