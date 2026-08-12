/**
 * QZ Tray common for Greenlab - load after qz-tray.js.
 * Cert/Sign dùng fetch, không phụ thuộc jQuery.
 * Cấu hình: window.__GREENLAB_QZ_STATIC_URL (base URL cho cert file), window.__GREENLAB_QZ_SIGN_URL (optional).
 */
(function () {
    if (typeof qz === 'undefined') {
        console.error('qz-print-greenlab: Load qz-tray.js first.');
        return;
    }
    // Đọc certificate từ file tĩnh trong assets
    var staticUrl = window.__GREENLAB_QZ_STATIC_URL || 'assets/lib/qz-print/';
    var signUrl = 'https://print.naipot.com/qz/sign-message.php?request=';

    qz.security.setCertificatePromise(function (resolve, reject) {
        if (!staticUrl) {
            reject(new Error('Chưa cấu hình __GREENLAB_QZ_STATIC_URL'));
            return;
        }
        fetch(staticUrl + 'digital-certificate.txt')
            .then(function (r) { return r.text(); })
            .then(resolve)
            .catch(reject);
    });

    qz.security.setSignaturePromise(function (toSign) {
        return function (resolve, reject) {
            if (!signUrl) {
                reject(new Error('Chưa cấu hình __GREENLAB_QZ_SIGN_URL'));
                return;
            }
            fetch(signUrl + (signUrl.indexOf('?') >= 0 ? '&' : '?') + 'request=' + encodeURIComponent(toSign))
                .then(function (r) { return r.text(); })
                .then(resolve)
                .catch(reject);
        };
    });

    window.startConnection = function (config) {
        config = config || { retries: 5, delay: 1 };
        if (!qz.websocket.isActive()) {
            return qz.websocket.connect(config);
        }
        return Promise.resolve();
    };

    window.launchQZ = function () {
        if (!qz.websocket.isActive()) {
            window.location.assign('qz:launch');
            setTimeout(function () { startConnection({ retries: 5, delay: 1 }); }, 1000);
        }
    };

    /**
     * In PDF qua QZ Tray (data base64).
     * @param {string} base64Pdf - PDF dạng base64 (không có prefix data:application/pdf;base64,)
     * @param {string} [printerName] - Tên máy in (mặc định dùng máy in mặc định)
     */
    /**
     * In PDF qua QZ Tray - 1 trang landscape 208x90mm (4 tem 104x45mm).
     */
    window.qzPrintPdfBase64 = function (base64Pdf, printerName, orientation = 'landscape', size = { width: 208, height: 90 }, options) {
        options = options || {};
        var config = qz.configs.create(printerName || null, {});
        console.log('orientation', orientation);
        var reconf = {
            units: 'mm',
            size: size,
            orientation: orientation || 'landscape',
            rasterize: typeof options.rasterize === 'boolean' ? options.rasterize : false,
            scaleContent: typeof options.scaleContent === 'boolean' ? options.scaleContent : true,
            density: options.density,
            ignoreTransparency: typeof options.ignoreTransparency === 'boolean' ? options.ignoreTransparency : false,
            interpolation: typeof options.interpolation === 'string' && options.interpolation
                ? options.interpolation
                : 'nearest-neighbor'
        };
        if (typeof options.colorType === 'string' && options.colorType) {
            reconf.colorType = options.colorType;
        }
        config.reconfigure(reconf);
        var data;
        if (options.qzDataOverride && Array.isArray(options.qzDataOverride) && options.qzDataOverride.length > 0) {
            data = options.qzDataOverride;
        } else {
            var item = { type: options.type || 'pdf', format: 'base64', data: base64Pdf };
            if (options.qzDataItemOptions && typeof options.qzDataItemOptions === 'object') {
                item.options = options.qzDataItemOptions;
            }
            data = [item];
        }
        return qz.print(config, data);
    };
})();
