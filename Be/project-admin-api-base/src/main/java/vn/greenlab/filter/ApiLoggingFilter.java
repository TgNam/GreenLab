package vn.greenlab.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.web.multipart.MultipartResolver;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
;

@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    // private final LogRequestRepository logRepo;
    private static final Set<String> IGNORE_URLS = Set.of(
            "/api-admin/system/logrequests/list",
            "/api-admin/system/logrequests/search-admin",
            "/api-admin/menu/roles");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MultipartResolver multipartResolver;

    // public ApiLoggingFilter(LogRequestRepository logRepo) {
    //     this.logRepo = logRepo;
    // }

    
    public ApiLoggingFilter() {
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (IGNORE_URLS.contains(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        long start = System.currentTimeMillis();

        HttpServletRequest requestToUse = request;
        boolean isMultipart = multipartResolver.isMultipart(request);
        CachedBodyHttpServletResponse cachedResponse = new CachedBodyHttpServletResponse(response);

        // Chỉ wrap body nếu không phải multipart
        if (!isMultipart) {
            requestToUse = new CachedBodyHttpServletRequest(request);
        }

        // Thực hiện filter chain
        filterChain.doFilter(requestToUse, cachedResponse);

        long end = System.currentTimeMillis();

        // LogRequest log = new LogRequest();
        // log.setId(logRepo.genId6());
        // log.setAdminId(0);
        // Object adminIdAttr = requestToUse.getAttribute("ADMIN_ID");
        // if (adminIdAttr != null) {
        //     Long adminId = adminIdAttr == null ? null : ((Number) adminIdAttr).longValue();
        //     log.setAdminId(adminId);
        // }

        // log.setIp(getClientIp(requestToUse));
        // log.setUrl(path);
        // log.setMethod(request.getMethod());
        // log.setTime(LocalDateTime.now());
        // log.setEndTime(end);
        // log.setCompletionTime(end - start);
        // log.setError(response.getStatus() >= 400);

        // --- REQUEST BODY ---
        if (!isMultipart) {
            String reqBody = new String(((CachedBodyHttpServletRequest) requestToUse).getCachedBody(),
                    StandardCharsets.UTF_8);
            // log.setRequest(reqBody);
        } else {
            MultipartHttpServletRequest multi = multipartResolver.resolveMultipart(request);
            Map<String, MultipartFile> files = multi.getFileMap();
            List<Map<String, Object>> fileList = new ArrayList<>();
            files.forEach((k, f) -> {
                Map<String, Object> info = new HashMap<>();
                info.put("field", k);
                info.put("filename", f.getOriginalFilename());
                info.put("size", f.getSize());
                info.put("contentType", f.getContentType());
                fileList.add(info);
            });
            // log.setRequest(objectMapper.writeValueAsString(fileList));
        }

        // --- RESPONSE BODY ---
        String respBody = new String(cachedResponse.getBody(),
                StandardCharsets.UTF_8);
        // log.setResp(respBody);

        // logRepo.save(log);

        // TRẢ BODY LẠI CHO CLIENT
        response.getOutputStream().write(cachedResponse.getBody());
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
