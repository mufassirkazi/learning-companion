export interface TiunVerifiedUser {
  isAuthenticated: boolean;
  userInfo?: {
    userId: string;
    email: string;
    productAccess: string[];
  };
}

export async function verifyTiunToken(token: string): Promise<TiunVerifiedUser> {
  const apiKey = process.env.TIUN_API_KEY;
  const isSandbox = process.env.NEXT_PUBLIC_TIUN_SANDBOX !== "false";
  const baseUrl = isSandbox
    ? "https://api-sandbox.tiun.live"
    : "https://api.tiun.live";

  // Graceful fallback for local development if no API key is provided
  if (!apiKey || apiKey === "mock-key" || apiKey === "your-tiun-api-key-here") {
    console.warn("TIUN_API_KEY is not configured. Using mock token verification.");
    
    // Decode token if it's a mock token containing user info, or return a default mock user
    if (token.startsWith("mock-token-pro")) {
      const parts = token.split(":");
      const userId = parts[1] || "user-test-nQUdTFASVuhe16slkWyQt";
      const proProductId = process.env.NEXT_PUBLIC_TIUN_PRODUCT_ID || "p-test-pro";
      return {
        isAuthenticated: true,
        userInfo: {
          userId,
          email: "mufassirkazi@gmail.com",
          productAccess: [proProductId],
        },
      };
    } else if (token.startsWith("mock-token-free")) {
      const parts = token.split(":");
      const userId = parts[1] || "user-test-nQUdTFASVuhe16slkWyQt";
      return {
        isAuthenticated: true,
        userInfo: {
          userId,
          email: "mufassirkazi@gmail.com",
          productAccess: [],
        },
      };
    }

    return {
      isAuthenticated: true,
      userInfo: {
        userId: "user-test-nQUdTFASVuhe16slkWyQt",
        email: "mufassirkazi@gmail.com",
        productAccess: [], // Free user by default
      },
    };
  }

  try {
    const response = await fetch(`${baseUrl}/live_api/s2s/v1/users/verification`, {
      method: "POST",
      headers: {
        "X-TIUN-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userVerificationToken: token }),
    });

    if (!response.ok) {
      console.error("Tiun verification API returned status:", response.status);
      return { isAuthenticated: false };
    }

    const data = await response.json();
    return {
      isAuthenticated: !!data.isAuthenticated,
      userInfo: data.userInfo
        ? {
            userId: data.userInfo.userId,
            email: data.userInfo.email || "",
            productAccess: data.userInfo.productAccess || [],
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error verifying Tiun token:", error);
    return { isAuthenticated: false };
  }
}
