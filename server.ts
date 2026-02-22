import { serve } from "bun";
import { extname, join } from "path";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(import.meta.dir, "public");

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(publicDir, pathname);

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response("Not found", { status: 404 });
    }

    const ext = extname(filePath);
    const contentType = mimeTypes[ext] ?? "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType
      }
    });
  }
});

console.log(`Quantum QEC Lab running at http://localhost:${port}`);
