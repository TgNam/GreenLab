package vn.greenlab.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.input.AuthDtos.AdminLoginRequest;
import vn.greenlab.model.input.AuthDtos.TokenResponse;
import vn.greenlab.model.input.auth.ChangePasswordRequest;
import vn.greenlab.model.input.auth.ForgotPasswordRequest;
import vn.greenlab.model.output.Response;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.service.AdministratorService;
import vn.greenlab.service.AuthService;
import vn.greenlab.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Optional;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = "/auth", name = "Quản lý xác thực")
@Tag(name = "Đăng nhập", description = "Đăng nhập")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final AdministratorRepository administratorRepository;
    private final AdministratorService administratorService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthService authService, JwtService jwtService,
            AdministratorRepository administratorRepository, AdministratorService administratorService,
            PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.administratorRepository = administratorRepository;
        this.administratorService = administratorService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping(value = "/login", name = "Đăng nhập")
    public ResponseEntity<?> loginAdmin(@RequestBody AdminLoginRequest request, HttpServletRequest httpRequest) {
        Optional<Administrator> optionalAdmin = administratorRepository
                .findByUsernameOrEmail(request.getUsernameOrEmail().toLowerCase().trim());
        if (optionalAdmin.isEmpty()) {
            throw new BadRequestException(ErrorCode.ACCOUNT_NOT_EXISTS);
        }
        Optional<AuthService.AuthResult> result = authService.authenticateAdministrator(
                request.getUsernameOrEmail(),
                request.getPassword());
        if (result.isEmpty()) {
            throw new BadRequestException(ErrorCode.WRONG_PASSWORD);

        }
        Administrator admin = optionalAdmin.get();
        if (admin.getStatus() == 0) {
            throw new BadRequestException(ErrorCode.ACCOUNT_LOCKED);
        }
        AuthService.AuthResult auth = result.get();
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", auth.getEmail());
        claims.put("id", auth.getId());
        Map<String, Object> tokenMap = jwtService.generateToken(auth.getSubject(), claims, request.isRememberMe());
        String token = (String) tokenMap.get("token");
        Date expiryDate = (Date) tokenMap.get("expiryDate");
        long maxAge = (expiryDate.getTime() - System.currentTimeMillis()) / 1000;
        // ===== Tạo HttpOnly cookie =====
        ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie.from("token", token)
                .path("/")
                .maxAge(maxAge);
        System.out.println("=============Checking localhost calling to server: " + isLocalhostHost(httpRequest)
                + "=============");
        if (!isLocalhostHost(httpRequest)) {
            cookieBuilder.sameSite("Strict");
        } else {
            cookieBuilder.sameSite("Lax");
        }
        ResponseCookie cookie = cookieBuilder.build();
        // Save client IP address to lastLoginIp field
        String clientIp = getClientIp(httpRequest);
        admin.setLast_login_ip(clientIp);
        administratorRepository.save(admin);
        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new TokenResponse(null, admin.getFull_name(), admin.getPhoto()));

    }

    @PostMapping(value = "/forgot-password", name = "Quên mật khẩu")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        administratorService.recoverPassword(request);
        return ResponseEntity.ok().body(new Response(true, ErrorCode.SUCCESS, "Email đã được gửi"));
    }

    @GetMapping(value = "/check-lost-password-code", name = "Kiểm tra mã khôi phục mật khẩu")
    public ResponseEntity<?> checkLostPasswordCode(@RequestParam String code) {
        boolean exists = administratorService.checkExistLostPasswordCode(code);
        if (!exists) {
            throw new BadRequestException(ErrorCode.LOST_PASSWORD_CODE_NOT_FOUND);
        }
        return ResponseEntity.ok().body(new Response(true, "Thành công"));
    }

    @PostMapping(value = "/change-password", name = "Đổi mật khẩu")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        administratorService.changeLostPassword(request, passwordEncoder);
        return ResponseEntity.ok().body(new Response(true, ErrorCode.SUCCESS, "Mật khẩu đã được đổi"));
    }

    /**
     * Localhost: không set SameSite để tránh ràng buộc khi dev (proxy/ngrok khác
     * host).
     */
    private boolean isLocalhostHost(HttpServletRequest request) {
        String host = request.getServerName();
        if (host == null || host.isEmpty()) {
            return false;
        }
        String h = host.toLowerCase();
        return "localhost".equals(h)
                || "127.0.0.1".equals(h)
                || "::1".equals(h)
                || "0:0:0:0:0:0:0:1".equals(h);
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for X-Forwarded-For header (used when behind a proxy)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        // Check for X-Real-IP header (used by some proxies)
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        // Fall back to direct remote address
        return request.getRemoteAddr();
    }
}
