import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {

  if (typeof window !== "undefined") {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

  }

  return config;

});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      // Check if the error is due to token expiration (401 Unauthorized)
      if (error.response?.status === 401) {
        // Clear the expired token
        localStorage.removeItem("token");
        
        // Show toast notification (if available)
        try {
          // Dynamic import to avoid SSR issues
          import("@/hooks/use-toast").then(({ toast }) => {
            toast({
              title: "Session Expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
          });
        } catch (e) {
          console.log("Toast not available");
        }
        
        // Small delay to show toast before redirect
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1000);
        
        return Promise.reject(new Error("Session expired. Please sign in again."));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;