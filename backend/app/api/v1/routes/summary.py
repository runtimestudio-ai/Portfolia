import os
import requests
import json
from fastapi import APIRouter, Query
from dotenv import load_dotenv
from app.utils.groq_client import generate_variants_from_groq

load_dotenv()

router = APIRouter()

@router.get("/smart-summary")
async def github_summary(repo_url: str = Query(..., description="GitHub repo URL")):
    try:
        if "github.com" not in repo_url:
            return {"error": "Invalid GitHub URL"}

        # Extract GitHub owner/repo
        parts = repo_url.strip('/').split('/')
        if len(parts) < 2:
            return {"error": "Could not parse GitHub repo URL"}
        owner, repo = parts[-2], parts[-1].replace(".git", "")

        # GitHub headers
        github_headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {os.getenv('GITHUB_API_TOKEN')}"
        }


        # Fetch GitHub repo data
        repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_resp = requests.get(repo_api_url, headers=github_headers)
        if repo_resp.status_code != 200:
            return {"error": "Failed to fetch GitHub repo data"}
        repo_data = repo_resp.json()

        # Extract fields from GitHub
        title = repo_data.get("name", "")
        stars = repo_data.get("stargazers_count", 0)
        forks = repo_data.get("forks_count", 0)
        homepage = (repo_data.get("homepage") or "").strip()

        # Fetch README
        readme_url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md"
        readme_resp = requests.get(readme_url)
        if readme_resp.status_code == 200 and readme_resp.text.strip():
            readme = readme_resp.text[:2000].replace("\n", " ").strip()
            readme_available = True
        else:
            readme = ""
            readme_available = False

        # Construct the prompt
        prompt = f"""
You are an assistant that summarizes GitHub projects into a short structured JSON. 
Given the README content and/or project name, extract the following fields with these strict rules:

1. "description" – a clear, catchy summary of the project (max 500 characters).
2. "stack" – a list of at least 3 technologies used (or guessed if not given).
3. "features" – a list of max 3 important features or capabilities (bullet points), EACH with at least 4 words to at most 6 words.

If the README is missing or vague, use the project name: "{title}" to infer everything.

Output format:
{{
  "description": "...",
  "stack": ["...", "...", "..."],
  "features": ["...", "...", "..."]
}}

README:
{readme if readme_available else "Not available. Only use project name."}
"""

        # Use Groq for summary
        try:
            raw_texts = await generate_variants_from_groq(prompt, n_variants=1, system_message="You are an assistant that summarizes GitHub projects into structured JSON.")
            if not raw_texts:
                return {"error": "Groq returned an empty response"}
            content = raw_texts[0].strip()
        except Exception as e:
            return {"error": f"Groq error: {str(e)}"}

        # Remove Markdown code fences if present
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        try:
            llm_data = json.loads(content)
        except json.JSONDecodeError:
            return {
                "title": title,
                "description": f"{title} is a GitHub project with {stars} stars and {forks} forks.",
                "type": "github",
                "stack": ["Unknown", "Unknown", "Unknown"],
                "features": ["LLM output parsing failed"],
                "stars": stars,
                "forks": forks,
                "link": homepage
            }


        # Final response formatting
        description = llm_data.get("description", "").strip()[:500]
        stack = llm_data.get("stack", [])[:3]
        if len(stack) < 3:
            stack += [""] * (3 - len(stack))  # Ensure at least 3 items
        features = llm_data.get("features", [])[:3]

        return {
            "title": title,
            "description": description,
            "type": "github",
            "stack": stack,
            "features": features,
            "stars": stars,
            "forks": forks,
            "link": homepage
        }

    except Exception as e:
        return {"error": str(e)}
