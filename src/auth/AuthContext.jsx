/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { getUserFromToken } from "../utils/routeDestinations";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem("tenantSlug"));
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) return null;

    try {
      return getUserFromToken(storedToken);
    } catch {
      return null;
    }
  });

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

    const jwtToken = response.data.accessToken || response.data.token;

    setToken(jwtToken);
    const nextUser = getUserFromToken(jwtToken, email);

    setUser(nextUser);

    return { ...response.data, user: nextUser };
  };

  const register = async ({ firstName, lastName, email, password, tenantSlug }) => {
    const nextTenantSlug = persistTenantSlug(tenantSlug);

    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    }, {
      headers: nextTenantSlug ? { "X-Tenant-Slug": nextTenantSlug } : undefined,
    });

    const jwtToken = response.data.accessToken || response.data.token;

    if (jwtToken) {
      setToken(jwtToken);
      const nextUser = getUserFromToken(jwtToken, email);

      setUser(nextUser);

      return { ...response.data, user: nextUser };
    }

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
