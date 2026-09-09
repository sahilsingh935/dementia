const API_URL = "http://localhost:5000/api";

// ==========================================
// GET AUTH TOKEN
// ==========================================

export function getToken() {
  return (
    localStorage.getItem("manasToken") || sessionStorage.getItem("manasToken")
  );
}

// ==========================================
// GET LOGGED-IN USER
// ==========================================

export function getUser() {
  const storage = localStorage.getItem("manasToken")
    ? localStorage
    : sessionStorage;

  return {
    id: storage.getItem("manasUserId"),
    name: storage.getItem("manasUser"),
    username: storage.getItem("manasUsername"),
    role: storage.getItem("manasRole"),
  };
}

// ==========================================
// API REQUEST HELPER
// ==========================================

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ==========================================
// GET CARETAKER PROFILE
// ==========================================

export async function getMe() {
  return apiRequest("/auth/me");
}

// ==========================================
// GET ALL PATIENTS
// ==========================================

export async function getPatients() {
  return apiRequest("/auth/patients");
}

// ==========================================
// ADD NEW PATIENT
// ==========================================

export async function addPatient(patientData) {
  return apiRequest("/auth/patient", {
    method: "POST",

    body: JSON.stringify({
      name: patientData.name,
      username: patientData.username,
      password: patientData.password,
    }),
  });
}

// ==========================================
// GET CARETAKER ANALYTICS
// ==========================================

export async function getAnalytics() {
  return apiRequest("/caretaker/analytics");
}

// ==========================================
// LOGOUT
// ==========================================

export function logout() {
  localStorage.removeItem("manasToken");
  localStorage.removeItem("manasRole");
  localStorage.removeItem("manasUser");
  localStorage.removeItem("manasUserId");
  localStorage.removeItem("manasUsername");

  sessionStorage.removeItem("manasToken");
  sessionStorage.removeItem("manasRole");
  sessionStorage.removeItem("manasUser");
  sessionStorage.removeItem("manasUserId");
  sessionStorage.removeItem("manasUsername");

  // Main MANAS app
  window.location.href = "http://localhost:5173/";
}
