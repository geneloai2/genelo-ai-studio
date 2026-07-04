import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_pricing",
  title: "Get Genelo AI pricing",
  description:
    "Return the current Genelo AI pricing plans, including the free tier and Genelo Pro subscription.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const plans = [
      {
        id: "free",
        name: "Free",
        price: "TSh 0",
        features: [
          "Access to Gn 2.0 (3 free images/day)",
          "Access to Gn 3.5 (10 free images/day)",
          "Full chat with markdown and code blocks",
        ],
      },
      {
        id: "pro",
        name: "Genelo Pro",
        price: "TSh 1,200/month",
        features: [
          "Unlocks Gn Flash 6 and Gn Pro modes",
          "Unlimited image generations",
          "Priority responses",
        ],
      },
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(plans, null, 2) }],
      structuredContent: { plans },
    };
  },
});
