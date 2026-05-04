import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// The proxy endpoint
app.get('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url param');

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid url');
  }

  const clientMethod = req.method;
  const clientHeaders = { ...req.headers };
  // Remove headers that might interfere with the proxying
  delete clientHeaders.host;
  delete clientHeaders.connection;
  delete clientHeaders['accept-encoding']; // Let Node handle compression

  const options = {
    method: clientMethod,
    headers: clientHeaders,
  };

  const httpx = parsedUrl.protocol === 'https:' ? https : http;

  const proxyReq = httpx.request(parsedUrl, options, (proxyRes) => {
    // Forward the status code and headers
    res.status(proxyRes.statusCode);
    
    // Copy all headers from the remote server to the client
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Set CORS headers explicitly to be safe
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    // Pipe the response stream to the client
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error(`Proxy error: ${e.message}`);
    if (!res.headersSent) {
      res.status(502).send('Bad Gateway');
    }
  });

  // End request if GET
  req.pipe(proxyReq);
});

// Serve frontend in production
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// For development Vite integration, if you run this behind Vite, Vite will be on a different port.
// But we run it as the main server.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
