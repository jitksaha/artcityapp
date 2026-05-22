import { createFileRoute } from "@tanstack/react-router";

// Bare iframe-friendly directory page. Reads filter params from URL and renders
// the same embed.js widget for sites that prefer iframes over <script> tags.
export const Route = createFileRoute("/embed/directory")({
  head: () => ({
    meta: [
      { title: "Talent Directory" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmbedDirectory,
});

function EmbedDirectory() {
  if (typeof window === "undefined") {
    return <div id="acw-mount" />;
  }
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const dataAttrs: Record<string, string> = { "data-widget": "directory", "data-target": "acw-mount" };
  ["category", "location", "language", "vip", "featured", "limit", "columns", "filters", "title", "refresh", "link-base"].forEach((k) => {
    const v = params.get(k);
    if (v != null) dataAttrs[`data-${k}`] = v;
  });
  return (
    <div style={{ padding: 12, fontFamily: "system-ui, sans-serif" }}>
      <div id="acw-mount" />
      <script
        async
        src={`${url.origin}/api/public/embed.js`}
        {...dataAttrs}
      />
    </div>
  );
}