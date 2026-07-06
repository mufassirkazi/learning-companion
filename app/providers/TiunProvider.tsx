"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { tiun } from "@tiun/sdk";

interface TiunContextType {
  isAuthenticated: boolean;
  user: any;
  isPro: boolean;
  loading: boolean;
  login: () => Promise<void>;
  checkout: () => Promise<void>;
  logout: () => Promise<void>;
  getVerificationToken: () => Promise<string | null>;
}

const TiunContext = createContext<TiunContextType | undefined>(undefined);

export function TiunProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMockModeRef = useRef(false);

  useEffect(() => {
    const snippetId =
      process.env.NEXT_PUBLIC_TIUN_SNIPPET_ID || "s-test-snippet-id";
    const isSandbox = process.env.NEXT_PUBLIC_TIUN_SANDBOX !== "false";

    // Detect if we are using a placeholder snippet ID
    const isPlaceholder =
      snippetId === "s-test-snippet-id" ||
      snippetId.startsWith("your-") ||
      snippetId === "";

    if (isPlaceholder) {
      console.warn(
        "Quizly is running in Tiun MOCK mode because NEXT_PUBLIC_TIUN_SNIPPET_ID is not configured in .env."
      );
      isMockModeRef.current = true;
      setLoading(false);
      return;
    }

    console.log("Initializing Tiun SDK with Snippet ID:", snippetId, "Sandbox:", isSandbox);

    try {
      tiun.init({
        snippetId,
        language: "en",
        sandbox: isSandbox,
      });

      const off = tiun.on("userChange", (payload) => {
        console.log("Tiun userChange payload:", payload);
        const isAuth = !!payload?.isAuthenticated;
        const u = payload?.user || null;
        
        setIsAuthenticated(isAuth);
        setUser(u);

        const access = u?.productAccess || [];
        const proProductId = process.env.NEXT_PUBLIC_TIUN_PRODUCT_ID || "p-test-pro";
        const hasProAccess =
          access.includes(proProductId) ||
          access.includes("p-test-pro") ||
          access.includes("p-live-pro");
        setIsPro(hasProAccess);
        
        setLoading(false);
      });

      return () => {
        if (off) off();
      };
    } catch (err) {
      console.error("Failed to initialize Tiun SDK:", err);
      isMockModeRef.current = true;
      setLoading(false);
    }
  }, []);

  const login = async () => {
    if (isMockModeRef.current) {
      const confirmLogin = window.confirm(
        "💡 [TIUN MOCK MODE]\n\nYou are using a placeholder Tiun Snippet ID. To test the real Tiun login overlay, add your actual NEXT_PUBLIC_TIUN_SNIPPET_ID to your .env file.\n\nWould you like to simulate logging in with a FREE account now?"
      );
      if (confirmLogin) {
        setIsAuthenticated(true);
        setUser({
          userId: "user-test-nQUdTFASVuhe16slkWyQt",
          email: "mufassirkazi@gmail.com",
          productAccess: [],
        });
        setIsPro(false);
      }
      return;
    }

    try {
      await tiun.login();
    } catch (err) {
      console.error("Error during login:", err);
    }
  };

  const checkout = async () => {
    if (isMockModeRef.current) {
      const confirmUpgrade = window.confirm(
        "💡 [TIUN MOCK MODE]\n\nYou are using a placeholder Tiun Snippet ID. To test the real Tiun payment overlay, add your actual NEXT_PUBLIC_TIUN_SNIPPET_ID to your .env file.\n\nWould you like to simulate upgrading to a PRO subscription now?"
      );
      if (confirmUpgrade) {
        setIsAuthenticated(true);
        setUser((prevUser: any) => ({
          userId: prevUser?.userId || "user-test-nQUdTFASVuhe16slkWyQt",
          email: prevUser?.email || "mufassirkazi@gmail.com",
          productAccess: ["p-test-pro"],
        }));
        setIsPro(true);
      }
      return;
    }

    try {
      const productId =
        process.env.NEXT_PUBLIC_TIUN_PRODUCT_ID || "p-test-pro";
      await tiun.checkout({ productId });
    } catch (err) {
      console.error("Error during checkout:", err);
    }
  };

  const logout = async () => {
    if (isMockModeRef.current) {
      setIsAuthenticated(false);
      setUser(null);
      setIsPro(false);
      return;
    }

    try {
      await tiun.logout();
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  const getVerificationToken = async (): Promise<string | null> => {
    if (isMockModeRef.current) {
      const activeUserId = user?.userId || "user-test-nQUdTFASVuhe16slkWyQt";
      return isPro ? `mock-token-pro:${activeUserId}` : `mock-token-free:${activeUserId}`;
    }

    try {
      return await tiun.getUserVerificationToken();
    } catch (err) {
      console.error("Error getting verification token:", err);
      return null;
    }
  };

  return (
    <TiunContext.Provider
      value={{
        isAuthenticated,
        user,
        isPro,
        loading,
        login,
        checkout,
        logout,
        getVerificationToken,
      }}
    >
      {children}
    </TiunContext.Provider>
  );
}

export function useTiun() {
  const context = useContext(TiunContext);
  if (context === undefined) {
    throw new Error("useTiun must be used within a TiunProvider");
  }
  return context;
}
