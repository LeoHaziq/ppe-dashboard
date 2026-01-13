// Cloudflare Worker sebagai proxy ke Google Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybNyAyDVNXkpCBzqB81mQNMWZay9HLx0dkjUR5__ZNXmB4L0nne-1_i1G6ybGRUOdx/exec";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle static files
    if (path === '/' || path === '/index.html') {
      return serveStaticFile('index.html');
    }
    if (path === '/style.css') {
      return serveStaticFile('style.css', 'text/css');
    }
    if (path === '/script.js') {
      return serveStaticFile('script.js', 'application/javascript');
    }
    
    // API proxy
    if (path === '/api') {
      return handleAPIProxy(url);
    }
    
    // Default: serve index.html
    return serveStaticFile('index.html');
  }
};

// Serve static files from string
async function serveStaticFile(filename, contentType = 'text/html') {
  let content = '';
  
  if (filename === 'index.html') {
    content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PPE Safety Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        /* CSS content from style.css */
        :root { --primary-color: #2c3e50; --secondary-color: #3498db; }
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        /* ... full CSS content from style.css ... */
    </style>
</head>
<body>
    <!-- HTML content from index.html -->
    <div class="container-fluid py-4">
        <div class="dashboard-container">
            <!-- ... full HTML content ... -->
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // JavaScript content from script.js
        const API_BASE = '/api';
        let chart1, chart2;
        let dataLimit = 10;
        
        // ... full JavaScript content from script.js ...
    </script>
</body>
</html>`;
  }
  
  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

// Handle API proxy requests
async function handleAPIProxy(url) {
  try {
    const action = url.searchParams.get('action') || 'dashboard';
    const limit = url.searchParams.get('limit');
    
    let googleUrl = `${GOOGLE_SCRIPT_URL}?action=${action}`;
    if (limit) googleUrl += `&limit=${limit}`;
    
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
