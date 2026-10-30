/** Keep visual quality instructions separate from the user's exact brief. */
export function buildImagePrompt(prompt: string, referenceCount = 0) {
  return `Create a polished, high-detail image that follows the user's brief precisely.
USER BRIEF (highest priority):
${prompt}

VISUAL QUALITY:
- Use crisp, well-defined edges and fine, coherent details at the image's native resolution. Avoid accidental blur, compression artifacts, halos and excessive sharpening.
- Match the requested medium and style: photographs should have believable lighting, materials, proportions and anatomy; illustrations should have clean intentional shapes and consistent style.
- Compose the subject thoughtfully with clear visual hierarchy. Keep requested objects, colors, layout and exclusions faithful to the brief. Do not invent unwanted decorations or watermarks.
- If text is requested, reproduce the exact wording, spelling and capitalization with readable typography. Do not add unsolicited text. Preserve deliberate blur, grain or abstraction when requested.
${referenceCount > 0 ? `REFERENCE IMAGES: ${referenceCount} attached image(s), in input order. Apply the requested edits to these images rather than creating an unrelated scene. Preserve identity, facial features, product geometry, labels, colors and composition unless the brief explicitly changes them. When combining references, follow the roles the user assigns.` : ""}`;
}