package vn.greenlab.exception;

import vn.greenlab.model.enums.ErrorCode;

public class BadRequestException extends RuntimeException {
    private final ErrorCode errorCode;
    private final String customMessage;

    public BadRequestException(ErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.customMessage = null;
    }

    public BadRequestException(String message) {
        super(message);
        this.errorCode = null;
        this.customMessage = null;
    }

    public BadRequestException(ErrorCode errorCode, String customMessage) {
        super(customMessage != null ? customMessage : errorCode.name());
        this.errorCode = errorCode;
        this.customMessage = customMessage;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public String getCustomMessage() {
        return customMessage;
    }
}