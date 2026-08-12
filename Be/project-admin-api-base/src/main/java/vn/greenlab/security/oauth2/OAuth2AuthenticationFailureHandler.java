package vn.greenlab.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationFailureHandler.class);
    
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    public OAuth2AuthenticationFailureHandler(HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository) {
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.info("=== OAuth2AuthenticationFailureHandler called ===");
        log.info("Exception type: {}", exception.getClass().getName());
        log.info("Exception message: {}", exception.getMessage());
        
        // Đọc redirect_uri từ cookie
        Optional<String> redirectUri = HttpCookieOAuth2AuthorizationRequestRepository
                .getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        String baseUrl = redirectUri.orElse("/");
        log.info("Redirect base URL: {}", baseUrl);

        String errorCode = "login_failed";
        String errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";

        // Xử lý OAuth2LoginException - custom exception
        if (exception instanceof OAuth2LoginException oauth2Ex) {
            log.info("OAuth2LoginException detected");
            errorCode = oauth2Ex.getErrorCode();
            errorMessage = oauth2Ex.getMessage();
            log.info("Error code: {}, message: {}", errorCode, errorMessage);
        } else {
            log.info("Other exception type: {}", exception.getClass().getName());
            errorMessage = exception.getMessage();
        }

        // Build redirect URL với query params
        String targetUrl = UriComponentsBuilder
                .fromUriString(baseUrl)
                .queryParam("error", errorCode)
                .queryParam("message", errorMessage != null ? errorMessage : "")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
        
        log.info("Redirecting to: {}", targetUrl);

        // Xóa OAuth2 cookies
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // Redirect về FE
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
