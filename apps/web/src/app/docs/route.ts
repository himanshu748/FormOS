/**
 * Renders the Scalar API reference for the FormOS tRPC procedures.
 *
 * This is a docs-only route (allowed by the brief). It loads the Scalar viewer
 * and points it at /api/openapi.json — the introspected description of the real
 * tRPC procedures. No business logic lives here.
 */
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FormOS API — Reference</title>
    <style>
      body { margin: 0; }
      .formos-bar {
        position: fixed; top: 0; left: 0; right: 0; height: 38px; z-index: 99999;
        display: flex; align-items: center; gap: 12px; padding: 0 14px;
        background: #c0c0c0; border-bottom: 2px solid #fff;
        font-family: Tahoma, "Segoe UI", sans-serif; font-size: 13px; color: #000;
      }
      .formos-bar a { color: #0a3fae; text-decoration: none; font-weight: 700; }
      .formos-bar span { color: #404040; }
      .scalar-loading { padding: 60px 16px; text-align: center; font-family: Tahoma, sans-serif; color: #444; }
      body > .scalar-app { padding-top: 38px; }
    </style>
  </head>
  <body>
    <div class="formos-bar">
      <a href="/">&lsaquo; FormOS</a>
      <span>API Reference · generated from the tRPC router</span>
    </div>
    <div class="scalar-loading">Loading API reference…</div>
    <script
      id="api-reference"
      data-url="/api/openapi.json"
      data-configuration='{"theme":"kepler","hideClientButton":true,"metaData":{"title":"FormOS API"}}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export function GET() {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
