import { defineTool } from "@lovable.dev/mcp-js";

const ABOUT = `Genelo AI is a friendly, professional AI assistant built in Tanzania by GNL Technology.

Founder & CEO: Genelo Moses Mwazembe (aka "Dumbile"), a BBICT student at Moshi Co-operative University (MoCU), born in Songwe Region and raised in Ichenjezya, Tanzania.

Genelo AI helps with front-end code (HTML, CSS, JS, TS, React, Vue, Svelte, Python and more), research, teaching, calculations, image ideas, and shipping real apps.

Websites:
- https://geneloai.lovable.app
- https://genelopay.lovable.app`;

export default defineTool({
  name: "about_genelo",
  title: "About Genelo AI",
  description:
    "Return background information about Genelo AI, its founder Genelo Moses Mwazembe, and GNL Technology.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: ABOUT }],
  }),
});
