package vn.greenlab.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import vn.greenlab.model.Administrator;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.security.JwtService;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;
    private final AdministratorRepository administratorRepository;

    public OAuth2AuthenticationSuccessHandler(JwtService jwtService,
                                              HttpCookieOAuth2AuthorizationRequestRepository repository,
                                              AdministratorRepository administratorRepository) {
        this.jwtService = jwtService;
        this.httpCookieOAuth2AuthorizationRequestRepository = repository;
        this.administratorRepository = administratorRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        // 1. Đọc lại URL của Frontend từ Cookie
        Optional<String> redirectUri = HttpCookieOAuth2AuthorizationRequestRepository.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        String targetUrl = redirectUri.orElse("/"); // Mặc định nếu không có

        // 2. Lấy thông tin Administrator
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        Administrator admin = oAuth2User.getAdministrator();

        // Cập nhật IP
        admin.setLast_login_ip(getClientIp(request));
        administratorRepository.save(admin);

        // 3. Tạo JWT (Giống hệt logic AuthController của bạn)
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", admin.getEmail());
        claims.put("id", admin.getId());

        // Subject thường là username hoặc email
        Map<String, Object> tokenMap = jwtService.generateToken(admin.getUser_name() != null ? admin.getUser_name() : admin.getEmail(), claims, false);
        String token = (String) tokenMap.get("token");
        Date expiryDate = (Date) tokenMap.get("expiryDate");
        long maxAge = (expiryDate.getTime() - System.currentTimeMillis()) / 1000;

        // 4. Set Cookie
        ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie.from("token", token)
                .path("/")
                .maxAge(maxAge);

        if (!isLocalhostHost(request)) {
            cookieBuilder.sameSite("Lax").secure(true).domain("greenlab.io.vn");
        } else {
            cookieBuilder.sameSite("Lax");
        }

        response.addHeader(HttpHeaders.SET_COOKIE, cookieBuilder.build().toString());

        // Xóa cookie auth tạm
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // 5. Chuyển hướng trình duyệt về lại FE
        // FE sẽ đọc được cookie vì có cùng domain hoặc đang ở chế độ localhost
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private boolean isLocalhostHost(HttpServletRequest request) {
        String host = request.getServerName();
        if (host == null || host.isEmpty()) return false;
        String h = host.toLowerCase();
        return "localhost".equals(h) || "127.0.0.1".equals(h) || "::1".equals(h) || "0:0:0:0:0:0:0:1".equals(h);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) return xForwardedFor.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
