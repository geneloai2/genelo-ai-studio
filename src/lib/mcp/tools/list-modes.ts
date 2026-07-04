import { defineTool } from "@lovable.dev/mcp-js";
import { MODES } from "@/lib/modes";

export default defineTool({
  name: "list_modes",
  title: "List Genelo AI modes",
  description:
    "List the available Genelo AI chat modes (Gn 2.0, Gn 3.5, Gn Flash 6, Gn Pro), including whether each mode is Pro-only and its daily image limit for free users.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = MODES.map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.tag,
      description: m.description,
      pro: m.pro,
      imageLimit: m.imageLimit,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { modes: rows },
    };
  },
});
