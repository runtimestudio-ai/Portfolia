// src/utils/api.ts
import API from '@/api/axios';

export const API_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = API_URL;

export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/api/v1/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return await res.json(); // should return { username, email, id }
}

// ---------------- PORTFOLIO ----------------

export async function getPortfolioPreview() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/portfolio/preview`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch portfolio preview");
  }

  return await res.json();
}

// ---------------- DRAFT / EDITOR ----------------


// Get working copy (draft)
export async function getEditorDraft() {
  const response = await API.get('/api/v1/portfolio/editor');
  return response.data; // { data: {...}, updated_at: "..." }
}

// Save working copy
export async function saveDraft(draftData: any) {
  const response = await API.post('/api/v1/portfolio/editor', {
    data: draftData,
  });
  return response.data;
}

// Publish draft to live
export async function publishPortfolio() {
  const response = await API.post('/api/v1/portfolio/publish');
  return response.data; // { message: "..." }
}

// ---------------- PROFILE ----------------
export async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/profile/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  console.log("Profile API response:", data); // 👈 Check what comes back
  return data;
}

export async function saveProfile(profileData: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/profile/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    throw new Error("Failed to save profile");
  }

  return await res.json();
}

// Projects API endpoints

export async function getUserProjects() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/projects/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function addProject(projectData: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/projects/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });
  if (!res.ok) throw new Error("Failed to add project");
  return res.json();
}

export async function deleteProject(id: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function updateProject(id: number, updatedData: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function fetchGithubSummary(repoUrl: string) {
  const res = await fetch(`${BASE_URL}/smart-summary?repo_url=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch GitHub summary");
  return res.json();
}


// Achievements API endpoints

// GET
export async function getAchievementsAPI(
  type: 'work-experience' | 'certificates' | 'awards'
) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/achievements/${type}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${type}`);
  }

  return res.json();
}

// ADD
export async function addAchievementAPI(
  type: 'work-experience' | 'certificates' | 'awards',
  payload: any
) {
  const token = localStorage.getItem('token'); // adjust to where your token is stored

  const res = await fetch(
    `${BASE_URL}/achievements/${type}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // 👈 attach token if available
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to add ${type}`);
  }

  return res.json();
}

// UPDATE
export async function updateAchievementAPI(
  type: 'work-experience' | 'certificates' | 'awards',
  id: number,
  data: any
) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/achievements/${type}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Failed to update ${type}`);

  return res.json();
}

// DELETE
export async function deleteAchievementAPI(
  type: 'work-experience' | 'certificates' | 'awards',
  id: number
) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/achievements/${type}/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete ${type} with id ${id}`);
  }

  // If your backend returns some json on delete, you can return it here, 
  // otherwise just return true/void
  return true;
}

// Skills API endpoints

export async function getSkills() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/skills/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json(); // returns array of skills
}

export async function addSkill(skillData: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/skills/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(skillData),
  });
  if (!res.ok) throw new Error("Failed to add skill");
  return res.json();
}

export async function updateSkill(id: number, updatedData: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/skills/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error("Failed to update skill");
  return res.json();
}

export async function deleteSkill(id: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/skills/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete skill");
  return true;
}

// ---------------- PUBLIC PORTFOLIO ----------------

export async function getPublicPortfolio(username: string) {
  const res = await fetch(`${BASE_URL}/api/portfolio/${encodeURIComponent(username)}`, {
    method: "GET",
    // No authentication required for public portfolios
  });

  if (!res.ok) {
    const error: any = new Error("Failed to fetch public portfolio");
    error.status = res.status;
    throw error;
  }

  return await res.json();
}

export async function checkPortfolioPublic(username: string) {
  const res = await fetch(`${BASE_URL}/api/portfolio/${encodeURIComponent(username)}/public-check`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to check portfolio status");
  }

  return await res.json();
}

export async function updatePrivacySettings(settings: {
  is_public?: boolean;
  theme_preference?: string;
  analytics_enabled?: boolean;
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/profile/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    throw new Error("Failed to update privacy settings");
  }

  return await res.json();
}

// ---------------- AI ENHANCE ----------------

export type AIEnhanceLength = "short" | "medium" | "long";

export interface AIEnhanceProjectRequest {
  title: string;
  description: string;
  tech_stack: string[];
  length: AIEnhanceLength;
  tones: string[]; // length 1–2
}

export interface AIEnhanceVariant {
  id: number;
  text: string;
}

export interface AIEnhanceProjectResponse {
  variants: AIEnhanceVariant[];
}

export async function enhanceProjectDescription(
  payload: AIEnhanceProjectRequest
): Promise<AIEnhanceVariant[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/enhance/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message =
        errorData?.detail ||
        "AI enhancement failed. Please try again.";
      throw new Error(message);
    }

    const data: AIEnhanceProjectResponse = await res.json();
    return data.variants;
  } catch (error: any) {
    // Re-throw with normalized error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("AI enhancement failed. Please try again.");
  }
}

// ---------------- RESUME UPLOAD ----------------

export async function uploadResume(file: File) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/v1/resumes/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error: any = new Error("Failed to upload resume");
    error.response = { status: res.status, data: await res.json().catch(() => ({})) };
    throw error;
  }

  return await res.json();
}

export async function getDraftResume() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/api/v1/resumes/draft`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch draft resume");
  }

  return await res.json();
}

export async function getExistingPortfolioData() {
  const [projects, skills, workExperiences, certifications, awards] = await Promise.all([
    getUserProjects().catch(() => []),
    getSkills().catch(() => []),
    getAchievementsAPI('work-experience').catch(() => []),
    getAchievementsAPI('certificates').catch(() => []),
    getAchievementsAPI('awards').catch(() => [])
  ]);

  return {
    projects,
    skills,
    work_experience: workExperiences.map((w: any) => ({
      ...w,
      company: w.organization,
    })),
    certifications: certifications.map((c: any) => ({
      ...c,
      name: c.title,
    })),
    achievements: awards.map((a: any) => ({
      ...a,
      issuer: a.organization,
      date: a.year,
      type: a.category || 'award',
    }))
  };
}

export async function confirmResume(resumeId: number, approvedData: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/api/v1/resumes/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resume_id: resumeId,
      approved_data: approvedData,
    }),
  });

  if (!res.ok) {
    const error: any = new Error("Failed to confirm resume");
    error.response = { status: res.status, data: await res.json().catch(() => ({})) };
    throw error;
  }

  return await res.json();
}


export async function updatePortfolioSettings(settings: {
  theme_preference?: string;
  is_public?: boolean;
  analytics_enabled?: boolean;
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(`${BASE_URL}/api/portfolio/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update settings");
  }

  return await res.json();
}
