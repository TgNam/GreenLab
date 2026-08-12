
qz.security.setCertificatePromise(function (resolve, reject) {
    //Preferred method - from server
    $.ajax("assets/lib/qz-print/digital-certificate.txt").then(resolve, reject);
});

qz.security.setSignaturePromise(function (toSign) {
    return function (resolve, reject) {
        $.ajax("https://print.naipot.com/qz/sign-message.php?request=" + toSign).then(resolve, reject);
    };
});

/// Connection ///
function launchQZ() {
    if (!qz.websocket.isActive()) {
        window.location.assign("qz:launch");
        //Retry 5 times, pausing 1 second between each attempt
        startConnection({retries: 5, delay: 1});
    }
}

function startConnection(config) {
    if (!qz.websocket.isActive()) {
        //updateState('Waiting', 'default');

        qz.websocket.connect(config).then(function () {
            //updateState('Active', 'success');
            //findVersion();
        }).catch(handleConnectionError);
    } else {
        displayMessage('An active connection with QZ already exists.', 'alert-warning');
    }
}

function endConnection() {
    if (qz.websocket.isActive()) {
        qz.websocket.disconnect().then(function () {
            //updateState('Inactive', 'default');
        }).catch(handleConnectionError);
    } else {
        displayMessage('No active connection with QZ exists.', 'alert-warning');
    }
}

function listNetworkInfo() {
    qz.websocket.getNetworkInfo().then(function (data) {
        if (data.macAddress == null) {
            data.macAddress = 'UNKNOWN';
        }
        if (data.ipAddress == null) {
            data.ipAddress = "UNKNOWN";
        }

        var macFormatted = '';
        for (var i = 0; i < data.macAddress.length; i++) {
            macFormatted += data.macAddress[i];
            if (i % 2 == 1 && i < data.macAddress.length - 1) {
                macFormatted += ":";
            }
        }
        displayMessage("<strong>IP:</strong> " + data.ipAddress + "<br/><strong>Physical Address:</strong> " + macFormatted);
    }).catch(displayError);
}
function config_awb_by_chipo(printer_awb, url_awb) {
    var config = qz.configs.create();
    var data = [{
            type: 'pdf',
            data: url_awb
        }];
    config.setPrinter(printer_awb);
    config.reconfigure({
        orientation: 'portrait',
        rasterize: false,
        interpolation: "nearest-neighbor"
    });
    return qz.print(config, data);
}
function qzPrintPackageBarcode(printer_awb, url_awb) {
    var config = qz.configs.create();
    var data = [{
            type: 'pdf',
            data: url_awb
        }];
    config.setPrinter(printer_awb);
    config.reconfigure({
        orientation: 'portrait',
        rasterize: false,
        interpolation: "nearest-neighbor"
    });
    return qz.print(config, data);
}
function qzPrintDeliveryNotes(printer_awb, url_awb) {
    var config = qz.configs.create(printer_awb, {});
    var data = [{
            type: 'html',
            format: 'file',
            data: url_awb
        }];
    //config.setPrinter(printer_awb);
    config.reconfigure({
    });
    return qz.print(config, data);
}
function qzPrintVTPLading(printer_awb, url_awb) {
    var config = qz.configs.create(printer_awb, {units: "cm", size: {width: 10, height: 15}, margins: {top: 0.2, right: 0.2, bottom: 0, left: 0}});
    var data = [{
            type: 'html',
            format: 'file',
            data: url_awb
        }];
    //config.setPrinter(printer_awb);
    config.reconfigure({
    });
    return qz.print(config, data);
}
function socket_qz_connection() {
    if (!qz.websocket.isActive()) {
        return false;
    } else {
        return true;
    }

}
/// Helpers ///
function handleConnectionError(err) {
    updateState('Error', 'danger');
    if (err.target != undefined) {
        if (err.target.readyState >= 2) { //if CLOSING or CLOSED
            displayError("Connection to QZ Tray was closed");
        } else {
            displayError("A connection error occurred, check log for details");
            console.error(err);
        }
    } else {
        displayError(err);
    }
}
function findVersion() {
    qz.api.getVersion().then(function (data) {
        $("#qz-version").html(data);
        qzVersion = data;
    }).catch(displayError);
}
function displayError(err) {
    console.error(err);
    displayMessage(err, 'alert-danger');
}
startConnection();