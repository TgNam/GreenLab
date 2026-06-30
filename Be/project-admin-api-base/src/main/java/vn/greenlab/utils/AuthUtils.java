package vn.greenlab.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AuthUtils {

    /**
     * Get admin ID from request attribute (set by JwtAuthFilter)
     * 
     * @param request HttpServletRequest
     * @return Admin ID or null if not found
     */
    public Integer getAdminId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object adminIdAttr = request.getAttribute("ADMIN_ID");
        if (adminIdAttr != null) {
            return ((Number) adminIdAttr).intValue();
        }
        return null;
    }

    /**
     * Get admin ID from current request context (if available)
     * 
     * @return Admin ID or null if not found
     */
    public Integer getCurrentAdminId() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return getAdminId(attributes.getRequest());
        }
        return null;
    }

    /**
     * Get client IP address from request (handles proxy headers)
     * 
     * @param request HttpServletRequest
     * @return Client IP address
     */
    public String getRemoteAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

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

    /**
     * Get client IP address from current request context (if available)
     * 
     * @return Client IP address or null if not available
     */
    public String getCurrentRemoteAddress() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return getRemoteAddress(attributes.getRequest());
        }
        return null;
    }

    /**
     * Get User-Agent header from request
     * 
     * @param request HttpServletRequest
     * @return User-Agent string or null if not available
     */
    public String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return request.getHeader("User-Agent");
    }

    /**
     * Get User-Agent from current request context (if available)
     * 
     * @return User-Agent string or null if not available
     */
    public String getCurrentUserAgent() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return getUserAgent(attributes.getRequest());
        }
        return null;
    }
}
