package vn.greenlab.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import vn.greenlab.service.AdministratorService;
import vn.greenlab.service.PermissionService;
import vn.greenlab.utils.LangUtils;
import vn.greenlab.controller.PermissionInit;
import vn.greenlab.filter.ApiLoggingFilter;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.Permission;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.repository.PermissionRepository;

import java.util.function.Supplier;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ApiLoggingFilter apiLoggingFilter;

    @Autowired
    private List<RequestMappingHandlerMapping> handlerMappings;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ApiLoggingFilter apiLoggingFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.apiLoggingFilter = apiLoggingFilter;
    }

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private AdministratorService administratorService;

    @Autowired
    private PermissionRepository permissionRepository;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private boolean matches(String pattern, String requestUri) {
        return pathMatcher.match(pattern, requestUri);
    }

    @Value("${admin}")
    private String idAdmin;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/api/auth/**", "/api-admin/auth/**").permitAll()
                        // Allow Swagger UI and OpenAPI documentation (documentation is public, but API
                        // calls require auth)
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html")
                        .permitAll()
                        .anyRequest().access(dynamicPermissionManager()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // ApiLoggingFilter chạy ngay sau JwtAuthFilter
                .addFilterAfter(apiLoggingFilter, JwtAuthFilter.class)
                .exceptionHandling(e -> e.accessDeniedHandler(accessDeniedHandler()));

        // Chèn filter: ApiLoggingFilter chạy đầu tiên
        // JwtAuthFilter chạy sau ApiLoggingFilter nhưng trước
        // UsernamePasswordAuthenticationFilter

        return http.build();
    }

    private AuthorizationManager<RequestAuthorizationContext> dynamicPermissionManager() {
        return new AuthorizationManager<RequestAuthorizationContext>() {
            @Override
            public AuthorizationDecision check(Supplier<Authentication> authentication,
                    RequestAuthorizationContext context) {
                Authentication auth = authentication.get();
                if (auth == null || !auth.isAuthenticated()) {
                    return new AuthorizationDecision(false);
                }

                

                // cắt context path /api-admin
                String contextPath = context.getRequest().getContextPath();
                String requestUri = context.getRequest().getRequestURI().substring(contextPath.length());

                //lấy pattern để check trong db
                String patternRequestUri = getPattern(context.getRequest());
                String httpMethod = context.getRequest().getMethod();

                Object adminIdAttr = context.getRequest().getAttribute("ADMIN_ID");
                if (adminIdAttr instanceof Long) {
                    Long adminId = (Long) adminIdAttr;
                    // List<Permission> permissions =
                    // permissionService.getPermissionsForAdministrator(adminId);
                    // Optional<Administrator> adminOpt = administratorService.findById(adminId);
                    // if (adminOpt.isEmpty()) {
                    // return new AuthorizationDecision(false);
                    // }
                    // Administrator admin = adminOpt.get();
                    // String rawUri = "";
                    // String rawName = "";
                    // String rawMethod = "";

                    //check skip permission
                    // Integer skip = permissionRepository.checkPermissionSkipByUriAndMethod(patternRequestUri, httpMethod);
                    // if (skip != null && skip == 1) {
                    //     return new AuthorizationDecision(true);
                    // }
                    
                    //check skip by new function by PhuongDT
                    if(checkSkipPermission(patternRequestUri)){
                        return new AuthorizationDecision(true);
                    }
                    if (!idAdmin.contains(adminIdAttr.toString())) {
                        Integer allowed = permissionRepository.findPermissionByUriAndMethodAndAdminId(adminId,
                            patternRequestUri, httpMethod);
                        if (allowed != null && allowed == 1) {
                            return new AuthorizationDecision(true);
                        } else {
                            // tìm thông tin quyền
                            String lang = LangUtils.getLangFromCookie(context.getRequest());
                            context.getRequest().setAttribute("ACCESS_DENIED_MESSAGE",
                                    ErrorCode.NOT_HAVE_PERMISSION.getDescription(lang));
                            if (!requestUri.isEmpty()) {
                                context.getRequest().setAttribute("ACCESS_DENIED_URI",
                                        requestUri);
                            }
                            // if (!rawName.isEmpty()) {
                            // context.getRequest().setAttribute("ACCESS_DENIED_NAME",
                            // rawName);
                            // }
                            if (!httpMethod.isEmpty()) {
                                context.getRequest().setAttribute("ACCESS_DENIED_METHOD",
                                        httpMethod);
                            }
                            return new AuthorizationDecision(false);
                        }
                    }
                    return new AuthorizationDecision(true);

                }
                context.getRequest().setAttribute("ACCESS_DENIED_MESSAGE",
                        "Token không hợp lệ");

                // fallback: allow only if any authority present (maintain previous behavior if
                // needed)
                return new AuthorizationDecision(false);
            }
        };

    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            String message = (String) request.getAttribute("ACCESS_DENIED_MESSAGE");
            if (message == null) {
                message = "Truy cập bị từ chối"; // default
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", message);
            if (request.getAttribute("ACCESS_DENIED_URI") != null) {
                resp.put("uri", request.getAttribute("ACCESS_DENIED_URI"));
            }
            if (request.getAttribute("ACCESS_DENIED_METHOD") != null) {
                resp.put("method", request.getAttribute("ACCESS_DENIED_METHOD"));
            }
            if (request.getAttribute("ACCESS_DENIED_NAME") != null) {
                resp.put("name", request.getAttribute("ACCESS_DENIED_NAME"));
            }
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            new ObjectMapper().writeValue(response.getWriter(), resp);

        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                List.of("http://localhost:51055", "http://localhost:4200", "http://172.17.0.1:4200",
                        "http://180.93.144.20:4200", "https://dev.greenlab.vn"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        // Cho phép FE đọc header tên file download từ response.
        configuration.setExposedHeaders(List.of("Content-Disposition", "X-File-Name"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // @Bean
    // public FilterRegistrationBean<JwtAuthFilter>
    // jwtAuthFilterRegistration(JwtAuthFilter filter) {
    // FilterRegistrationBean<JwtAuthFilter> registration = new
    // FilterRegistrationBean<>();
    // registration.setFilter(filter);
    // registration.setOrder(1); // chạy trước
    // return registration;
    // }

    // @Bean
    // public FilterRegistrationBean<ApiLoggingFilter>
    // apiLoggingFilterRegistration(ApiLoggingFilter filter) {
    // FilterRegistrationBean<ApiLoggingFilter> registration = new
    // FilterRegistrationBean<>();
    // registration.setFilter(filter);
    // registration.setOrder(2); // chạy sau
    // return registration;
    // }

    public String getPattern(HttpServletRequest request) {
        for (RequestMappingHandlerMapping mapping : handlerMappings) {
            try {
                HandlerExecutionChain handler = mapping.getHandler(request);
                if (handler != null) {
                    return (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                }
            } catch (Exception e) {
            }
        }
        return request.getRequestURI(); // Trả về URI gốc nếu không tìm thấy pattern
    }

    public boolean checkSkipPermission(String uri) {
        if(uri.contains("/common/") || uri.contains("/api/common/")){
            return true;
        }
        return false;
    }
}