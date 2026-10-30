# Project conventions

- Keep the company Organization structured data on About and reference the same organization ID from the site's parentOrganization so search engines can connect the company and AI site consistently.
- Reuse src/lib/brand.ts for company logo and website references across the shell, console, search metadata and sitemap so branding remains consistent.
- Keep image-quality prompting in a browser-safe image-prompt helper and pass ordered reference images to the existing generator so edits preserve the user's brief and source detail.