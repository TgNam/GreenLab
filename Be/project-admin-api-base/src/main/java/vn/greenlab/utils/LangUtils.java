package vn.greenlab.utils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;

public class LangUtils {
    public static String getLangFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null)
            return "vi";
        for (Cookie cookie : request.getCookies()) {
            if ("lang".equalsIgnoreCase(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return "vi"; // mặc định tiếng Việt
    }
}
