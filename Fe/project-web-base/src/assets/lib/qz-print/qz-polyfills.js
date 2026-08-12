/**
 * Polyfills cho qz-tray.js: RSVP và Sha256.
 * Load file này TRƯỚC qz-tray.js để tránh lỗi "RSVP is not defined" / "Sha256 is not defined".
 */
(function () {
  'use strict';

  // RSVP: qz-tray dùng RSVP.Promise. Dùng native Promise thay thế.
  if (typeof window.RSVP === 'undefined') {
    window.RSVP = {
      Promise: function (resolver) {
        return new Promise(resolver);
      }
    };
  }

  // Sha256: qz-tray dùng Sha256.hash(data) để ký. Trả về Promise<string> (hex).
  if (typeof window.Sha256 === 'undefined') {
    window.Sha256 = {
      hash: function (data) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
          var encoder = new TextEncoder();
          var dataBuffer = encoder.encode(data);
          return crypto.subtle.digest('SHA-256', dataBuffer).then(function (buffer) {
            var bytes = new Uint8Array(buffer);
            var hex = '';
            for (var i = 0; i < bytes.length; i++) {
              hex += ('0' + bytes[i].toString(16)).slice(-2);
            }
            return hex;
          });
        }
        return Promise.reject(new Error('Sha256 cần crypto.subtle (chạy trên HTTPS hoặc localhost).'));
      }
    };
  }
})();
