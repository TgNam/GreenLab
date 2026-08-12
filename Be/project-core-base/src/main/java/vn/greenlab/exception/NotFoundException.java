package vn.greenlab.exception;

import vn.greenlab.model.enums.ErrorCode;

public class NotFoundException extends RuntimeException {
    private final ErrorCode errorCode;

    public NotFoundException(ErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }

    public NotFoundException(String message) {
        super(message);
        this.errorCode = null;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
