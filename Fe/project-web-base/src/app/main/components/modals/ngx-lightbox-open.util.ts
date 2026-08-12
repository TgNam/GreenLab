/**
 * ngx-lightbox thêm class `lb-disable-scrolling` lên documentElement khi mở preview.
 * Dùng để tránh ESC (keydown) đóng modal trước khi lightbox nhận keyup và đóng preview.
 */
export function isNgxLightboxOpen(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }
    return document.querySelector('.lb-container') !== null;
}
