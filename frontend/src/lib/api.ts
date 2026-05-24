const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Client-side helper to get token
function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Use provided token, or fall back to localStorage if in browser
  const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    throw new Error(`Network error: Unable to reach the server at ${API_BASE_URL}. Is the backend running?`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let errorDetail = "An error occurred";
    try {
      const errJson = JSON.parse(errorBody);
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = errorBody || errorDetail;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ==========================================
// PUBLIC API METHODS
// ==========================================

export async function getStates(limit?: number, offset = 0) {
  let path = "/api/states";
  if (limit !== undefined) path += `?limit=${limit}&offset=${offset}`;
  return request(path);
}

export async function getState(slugOrId: string) {
  return request(`/api/states/${slugOrId}`);
}

export async function getDistrictBySlug(stateSlug: string, districtSlug: string) {
  return request(`/api/districts/by-slug/${stateSlug}/${districtSlug}`);
}

export async function getDistrict(slugOrId: string) {
  return request(`/api/districts/${slugOrId}`);
}

export async function getServices(districtId?: string) {
  const query = districtId ? `?district_id=${districtId}` : "";
  return request(`/api/services${query}`);
}

export async function getServiceBySlug(stateSlug: string, districtSlug: string, serviceSlug: string) {
  return request(`/api/services/by-slug/${stateSlug}/${districtSlug}/${serviceSlug}`);
}

export async function getService(serviceId: string) {
  return request(`/api/services/${serviceId}`);
}

export async function getBlogs(statusFilter?: string, limit?: number, offset = 0) {
  let path = "/api/blogs";
  const params: string[] = [];
  if (statusFilter !== undefined) params.push(`status_filter=${encodeURIComponent(statusFilter)}`);
  if (limit !== undefined) params.push(`limit=${limit}&offset=${offset}`);
  if (params.length) path += "?" + params.join("&");
  return request(path);
}

export async function getBlog(slugOrId: string) {
  return request(`/api/blogs/${slugOrId}`);
}

export async function getBlogBySlug(slugOrId: string) {
  return request(`/api/blogs/${slugOrId}`);
}

// ==========================================
// AUTH & ADMIN API METHODS
// ==========================================

export async function login(email: string, password: string) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string) {
  return request("/api/auth/me", {
    headers: getAuthHeaders(token),
  });
}

// Admin States CRUD
export async function adminCreateState(data: any, token?: string) {
  return request("/api/states", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateState(id: string, data: any, token?: string) {
  return request(`/api/states/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteState(id: string, token?: string) {
  return request(`/api/states/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

// Admin Districts CRUD
export async function adminCreateDistrict(data: any, token?: string) {
  return request("/api/districts", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateDistrict(id: string, data: any, token?: string) {
  return request(`/api/districts/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteDistrict(id: string, token?: string) {
  return request(`/api/districts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

// Admin Services CRUD
export async function adminCreateService(data: any, token?: string) {
  return request("/api/services", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateService(id: string, data: any, token?: string) {
  return request(`/api/services/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteService(id: string, token?: string) {
  return request(`/api/services/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

export async function search(q: string, limit = 20, offset = 0) {
  return request(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`);
}

// Admin Blogs CRUD
export async function adminGetBlogs(token?: string) {
  return request("/api/blogs?status_filter=", {
    headers: getAuthHeaders(token),
  }).then(r => r.items || r);
}

export async function adminCreateBlog(data: any, token?: string) {
  return request("/api/blogs", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateBlog(id: string, data: any, token?: string) {
  return request(`/api/blogs/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteBlog(id: string, token?: string) {
  return request(`/api/blogs/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

// Admin Verified Portals CRUD
export async function getVerifiedPortals(districtId?: string, token?: string) {
  const query = districtId ? `?district_id=${districtId}` : "";
  return request(`/api/admin/verified-portals${query}`, {
    headers: getAuthHeaders(token),
  });
}

export async function adminCreateVerifiedPortal(data: any, token?: string) {
  return request("/api/admin/verified-portals", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateVerifiedPortal(id: string, data: any, token?: string) {
  return request(`/api/admin/verified-portals/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteVerifiedPortal(id: string, token?: string) {
  return request(`/api/admin/verified-portals/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
