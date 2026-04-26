import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem("tenantSlug"));
  const [user, setUser] = useState(null);

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (tenantSlug) localStorage.setItem("tenantSlug", tenantSlug);
    else localStorage.removeItem("tenantSlug");
  }, [tenantSlug]);

  const login = async ({ email, password, tenantSlug }) => {
    setTenantSlug(tenantSlug);

    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const jwtToken = response.data.token;

    setToken(jwtToken);
    setUser(response.data.user || null);

    return response.data;
  };

  const logout = () => {
    setToken(null);
    setTenantSlug(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        tenantSlug,
        user,
        isAuthenticated,
        login,
        logout,
        setTenantSlug,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};