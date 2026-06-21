const OFFLINE_HTML = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#09090b">
  <title>Mất kết nối | OmniHost</title>
  <style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#09090b;color:#fff;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:max(24px,env(safe-area-inset-top)) 24px max(24px,env(safe-area-inset-bottom))}.wrap{width:100%;max-width:360px;text-align:center}.logo{position:relative;width:80px;height:80px;margin:0 auto;border-radius:23px;background:#fff}.tile{position:absolute;width:31px;height:31px;border:3px solid #09090b;border-radius:10px}.tile:first-child{left:14px;top:14px}.tile:last-child{right:14px;bottom:14px}.wifi{display:flex;width:48px;height:48px;margin:32px auto 0;align-items:center;justify-content:center;border-radius:16px;background:#ffffff1a;color:#d4d4d8;font-size:24px}h1{margin:20px 0 0;font-size:24px;line-height:1.2}p{margin:12px 0 0;color:#a1a1aa;font-size:14px;line-height:1.65}button{width:100%;height:48px;margin-top:28px;border:1px solid #ffffff33;border-radius:12px;background:#ffffff1a;color:#fff;font:600 15px inherit}button:active{background:#ffffff26}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="logo" aria-hidden="true"><span class="tile"></span><span class="tile"></span></div>
    <div class="wifi" aria-hidden="true">×</div>
    <h1>Không có kết nối mạng</h1>
    <p>Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại. OmniHost không lưu và hiển thị dữ liệu booking cũ khi offline.</p>
    <button onclick="location.reload()">Thử kết nối lại</button>
  </main>
</body>
</html>`

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET" || request.mode !== "navigate") return

  event.respondWith(
    fetch(request).catch(() => new Response(OFFLINE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }))
  )
})
