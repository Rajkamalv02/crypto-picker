const marketService = require("./src/services/marketService");

async function test() {
  try {
    console.log("Testing fetchHistoricalData...");
    const data = await marketService.fetchHistoricalData("BTC");
    console.log("Data type:", typeof data);
    console.log("Is Array:", Array.isArray(data));
    if (Array.isArray(data)) {
      console.log("Length:", data.length);
      console.log("First item:", data[0]);
    } else {
      console.log("Full Data:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
