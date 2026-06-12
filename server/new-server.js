import http from "node:http";

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";
  if (url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>New Server</title>
    <style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;margin:40px;color:#ddd;background:#0b0b0b}a{color:#7ee787}</style>
  </head>
  <body>
    <h1>New Server</h1>
    <p>Endpoints:</p>
    <ul>
      <li><a href="/health">/health</a> — status JSON</li>
      <li>/api/echo (POST) — ecoa o body enviado</li>
    </ul>
    <p>Teste com:</p>
    <pre>curl http://localhost:${PORT}/health</pre>
  </body>
</html>`);
    return;
  }

  if (url === "/api/echo" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    res.writeHead(200, { "Content-Type": "application/json" });
    try {
      JSON.parse(body);
      res.end(body || "{}");
    } catch {
      res.end(JSON.stringify({ raw: body }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`New server listening on http://localhost:${PORT}`);
});
