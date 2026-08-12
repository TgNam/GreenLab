package vn.greenlab.security.oauth2;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OAuth2LoginException extends OAuth2AuthenticationException {

    private final String errorCode;

    public OAuth2LoginException(String errorCode, String message) {
        // Gắn errorCode và message vào OAuth2Error của class cha
        super(new OAuth2Error(errorCode, message, null), message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}