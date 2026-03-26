export const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
        return data;
      } catch (e: any) {
        if (!res.ok) throw new Error(`Request failed with status ${res.status} (invalid JSON)`);
        throw new Error(`Failed to parse JSON: ${e.message}`);
      }
    }
    
    if (!res.ok) {
      const text = await res.text();
      if (text.includes("<!doctype") || text.includes("<html")) {
        throw new Error(`Server error (${res.status}). The backend might be misconfigured.`);
      }
      throw new Error(text || `Request failed with status ${res.status}`);
    }
    
    return null;
  } catch (e: any) {
    if (e.message.includes("Unexpected token") || e.message.includes("is not valid JSON")) {
      throw new Error("Received invalid response from server. The backend might be misconfigured.");
    }
    throw e;
  }
};
