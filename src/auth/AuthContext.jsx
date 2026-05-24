/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { getUserFromToken } from "../utils/routeDestinations";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem("tenantSlug"));
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("user");
      }
    }

    const storedToken = localStorage.getItem("token");

    if (!storedToken) return null;

    try {
      return getUserFromToken(storedToken);
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (tenantSlug) localStorage.setItem("tenantSlug", tenantSlug);
    else localStorage.removeItem("tenantSlug");
  }, [tenantSlug]);

  const saveUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const login = async ({ email, password, tenantSlug }) => {
    const cleanTenantSlug = tenantSlug?.trim();

    const response = await api.post(
      "/auth/login",
      {
        email: email.trim(),
        password,
      },
      {
        headers: cleanTenantSlug
          ? {
              "X-Tenant-Slug": cleanTenantSlug,
            }
          : {},
      }
    );

    if (response.data.tenantSlugRequired) {
      return response.data;
    }

    const jwtToken = response.data.accessToken || response.data.token;
    setToken(jwtToken);

    const nextUser = getUserFromToken(jwtToken, email);

    const resolvedRole =
      response.data.role ||
      response.data.roles?.[0] ||
      nextUser?.role ||
      "Buyer";

    const resolvedTenantSlug = response.data.tenantSlug || cleanTenantSlug || null;

    const finalUser = {
      ...nextUser,
      role: resolvedRole,
      tenantSlug: resolvedTenantSlug,
    };

    saveUser(finalUser);
    setTenantSlug(resolvedTenantSlug);

    return {
      ...response.data,
      role: resolvedRole,
      user: finalUser,
    };
  };

  const register = async ({ firstName, lastName, email, password }) => {
    setLoading(true);

    try {
      localStorage.removeItem("tenantSlug");
      localStorage.removeItem("user");
      setTenantSlug(null);
      setUser(null);

      const response = await api.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      const jwtToken = response.data.accessToken || response.data.token;

      if (jwtToken) {
        setToken(jwtToken);

        const nextUser = getUserFromToken(jwtToken, email);

        const finalUser = {
          ...nextUser,
          role: "Buyer",
          tenantSlug: null,
        };

        saveUser(finalUser);
        setTenantSlug(null);
      }

      return {
        ...response.data,
        role: "Buyer",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectTo) => {
    setToken(null);
    setTenantSlug(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("user");

    if (redirectTo) {
      window.location.replace(redirectTo);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        tenantSlug,
        user,
        loading,
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

export const useAuth = () => useContext(AuthContext);
