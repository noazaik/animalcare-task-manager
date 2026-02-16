const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;

const server = http.createServer((req, res) => {
  // Serve index.html for all routes
  const filePath = path.join(__dirname, 'index.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading page');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Client running at http://localhost:${PORT}`);
});
