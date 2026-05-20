/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem("tenantSlug"));
  const [user, setUser] = useState(null);

  const isAuthenticated = !!token;

  const persistTenantSlug = (value) => {
    const nextTenantSlug = value?.trim();
    setTenantSlug(nextTenantSlug || null);

    if (nextTenantSlug) {
      localStorage.setItem("tenantSlug", nextTenantSlug);
    } else {
      localStorage.removeItem("tenantSlug");
    }

    return nextTenantSlug;
  };

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (tenantSlug) localStorage.setItem("tenantSlug", tenantSlug);
    else localStorage.removeItem("tenantSlug");
  }, [tenantSlug]);

  const login = async ({ email, password, tenantSlug }) => {
    persistTenantSlug(tenantSlug);

    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const jwtToken = response.data.token;

    setToken(jwtToken);
    setUser(response.data.user || null);

    return response.data;
  };

  const register = async ({ name, email, password, tenantSlug }) => {
    const nextTenantSlug = persistTenantSlug(tenantSlug);

    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      tenantSlug: nextTenantSlug,
    });

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
        register,
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
