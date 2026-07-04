import { defineMcp } from "@lovable.dev/mcp-js";
import aboutGeneloTool from "./tools/about-genelo";
import listModesTool from "./tools/list-modes";
import pricingTool from "./tools/pricing";

export default defineMcp({
  name: "genelo-ai-mcp",
  title: "Genelo AI",
  version: "0.1.0",
  instructions:
    "Tools for Genelo AI — a Tanzanian AI assistant by GNL Technology. Use `about_genelo` for background on the product and founder, `list_modes` to see available chat modes, and `get_pricing` for the current plans.",
  tools: [aboutGeneloTool, listModesTool, pricingTool],
});
