import { zapierService } from "../services/zapier";

// Sample SOP for testing
const testSOP = {
  id: "test-sop-1",
  title: "Weekly Invoice Processing",
  description: "Standard procedure for processing weekly invoices",
  steps: [
    "Download invoice reports from accounting system",
    "Review and validate invoice data",
    "Process payments through payment gateway",
    "Send confirmation emails to vendors"
  ],
  createdBy: "test-user",
  createdAt: new Date()
};

async function testZapierIntegration() {
  try {
    console.log("Testing Zapier integration...");
    console.log("Sample SOP:", testSOP.title);
    
    const suggestions = await zapierService.suggestAutomations(testSOP);
    console.log("Received automation suggestions:", suggestions);
    
    return suggestions;
  } catch (error) {
    console.error("Error testing Zapier integration:", error);
    throw error;
  }
}

// Run the test
testZapierIntegration()
  .then(() => console.log("Zapier integration test completed successfully"))
  .catch(error => {
    console.error("Zapier integration test failed:", error);
    process.exit(1);
  });
