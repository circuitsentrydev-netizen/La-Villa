
async function testPaystackConnection(): Promise<void> {
  console.log("Testing Node.js connection to Paystack...");

  try {
    const response = await fetch("https://api.paystack.co", {
      signal: AbortSignal.timeout(15000),
    });

    console.log("Connection successful!");
    console.log("HTTP status:", response.status);

    await response.body?.cancel();
  } catch (error: unknown) {
    console.error("Connection failed.");

    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if ("cause" in error) {
        console.error("Cause:", error.cause);
      }
    } else {
      console.error(error);
    }
  }
}

void testPaystackConnection();
