export const squareRequest = async (endpoint: string, method: string = "GET", body: any = null) => {
    const squareUrl = process.env.SQUARE_SANDBOX_URL;
    const squareToken = process.env.SQUARE_SANDBOX_TOKEN;
  
    if (!squareUrl || !squareToken) {
      throw new Error("Missing Square API environment variables");
    }
  
    try {
      const response = await fetch(`${squareUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${squareToken}`,
          "Square-Version": "2025-03-11",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Square API request failed");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Square API Error:", error);
      throw error;
    }
  };
  