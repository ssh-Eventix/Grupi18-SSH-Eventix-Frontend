/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import api from "../api/axios";
import { getUserFromToken } from "../utils/routeDestinations";

const AuthContext = createContext(null);

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem("tenantSlug"));
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return null;

    try {
      return getUserFromToken(storedToken);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenantSlug");
      return null;
    }
  });

  const isAuthenticated = !!token;

  const saveAuth = ({ jwtToken, user, tenantSlug }) => {
    localStorage.setItem("token", jwtToken);

    if (tenantSlug) localStorage.setItem("tenantSlug", tenantSlug);
    else localStorage.removeItem("tenantSlug");

    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    setTenantSlug(tenantSlug || null);
    setToken(jwtToken);
  };

  const login = async ({ email, password, tenantSlug }) => {
    setLoading(true);

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenantSlug");

      setToken(null);
      setUser(null);
      setTenantSlug(null);

      const cleanTenantSlug = tenantSlug?.trim();

      const response = await api.post(
        "/auth/login",
        {
          email: email.trim(),
          password,
        },
        {
          headers: cleanTenantSlug
            ? { "X-Tenant-Slug": cleanTenantSlug }
            : {},
        }
      );

      if (response.data.tenantSlugRequired) {
        return response.data;
      }

      const jwtToken = response.data.accessToken || response.data.token;
      const tokenUser = getUserFromToken(jwtToken, email);

      const role = normalizeRole(
        tokenUser?.role ||
          response.data.role ||
          response.data.roles?.[0]
      );

      const finalUser = {
        ...tokenUser,
        role,
        tenantSlug: response.data.tenantSlug || cleanTenantSlug || tokenUser?.tenantSlug || null,
      };

      saveAuth({
        jwtToken,
        user: finalUser,
        tenantSlug: finalUser.tenantSlug,
      });

      return {
        ...response.data,
        token: jwtToken,
        user: finalUser,
        role,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ firstName, lastName, email, password }) => {
    setLoading(true);

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenantSlug");

      const response = await api.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      const jwtToken = response.data.accessToken || response.data.token;

      if (jwtToken) {
        const tokenUser = getUserFromToken(jwtToken, email);

        const finalUser = {
          ...tokenUser,
          role: "buyer",
          tenantSlug: null,
        };

        saveAuth({
          jwtToken,
          user: finalUser,
          tenantSlug: null,
        });
      }

      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectTo) => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("user");

    setToken(null);
    setTenantSlug(null);
    setUser(null);

    if (redirectTo) window.location.replace(redirectTo);
  };

  const impersonate = (jwtToken, tenantSlug) => {
    const tokenUser = getUserFromToken(jwtToken);

    const role = normalizeRole(tokenUser?.role);

    const finalUser = {
      ...tokenUser,
      role,
      tenantSlug: tenantSlug || tokenUser?.tenantSlug || null,
    };

    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(finalUser));

    if (finalUser.tenantSlug) {
      localStorage.setItem("tenantSlug", finalUser.tenantSlug);
    } else {
      localStorage.removeItem("tenantSlug");
    }

    setToken(jwtToken);
    setTenantSlug(finalUser.tenantSlug);
    setUser(finalUser);
  };

  const stopImpersonation = () => {
    const superAdminToken = localStorage.getItem("superAdminToken");

    if (superAdminToken) {
      localStorage.setItem("token", superAdminToken);
      setToken(superAdminToken);
      setUser(getUserFromToken(superAdminToken));
    }

    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("impersonationSessionId");
    localStorage.removeItem("tenantSlug");

    setTenantSlug(null);
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
        impersonate,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);