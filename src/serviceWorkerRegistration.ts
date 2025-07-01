export function registerSW(onUpdate: () => void) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
        // Check for updates on load if online
        if (navigator.onLine) {
          registration.update();
        }
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                onUpdate();
              }
            };
          }
        };
      });
    });
  }
} 