import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { hmrBootstrap } from './hmr';

if (environment.production) {
  enableProdMode();
  
  // Ẩn console.log, console.warn, console.info trong production
  // Giữ lại console.error để vẫn có thể debug lỗi
  if (!environment.enableConsoleLog) {
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Giữ lại console.error để vẫn có thể debug lỗi
    // console.error = () => {};
  }
}

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);

if (environment.hmr) {
  if (module['hot']) {
    hmrBootstrap(module, bootstrap);
  } else {
    console.error('HMR is not enabled for webpack-dev-server!');
    console.log('Are you using the --hmr flag for ng serve?');
  }
} else {
  bootstrap().catch(err => console.log(err));
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });

  // Xóa luôn cache của service worker
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
}

// main.ts

function handleChunkError() {
  const key = 'chunk-error-reload';

  // tránh reload loop (chỉ reload 1 lần trong 5s)
  const lastReload = sessionStorage.getItem(key);
  const now = Date.now();

  if (!lastReload || now - Number(lastReload) > 5000) {
    console.error('⚠️ ChunkLoadError detected → reloading app...');
    sessionStorage.setItem(key, now.toString());

    // reload đúng URL hiện tại
    window.location.reload();
  } else {
    console.error('❌ ChunkLoadError nhưng đã reload gần đây → bỏ qua tránh loop');
  }
}

// bắt lỗi global (promise reject)
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const error = event.reason;

  if (error?.message?.includes('ChunkLoadError')) {
    handleChunkError();
  }
});

// bắt lỗi global (runtime error)
window.addEventListener('error', (event: ErrorEvent) => {
  if (event?.message?.includes('ChunkLoadError')) {
    handleChunkError();
  }
});