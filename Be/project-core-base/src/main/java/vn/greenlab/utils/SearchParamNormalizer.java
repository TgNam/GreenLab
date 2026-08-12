package vn.greenlab.utils;

/**
 * Utility class để normalize các search parameters
 * Tách riêng để dễ tái sử dụng
 */
public class SearchParamNormalizer {
    
    /**
     * Normalize các string parameters (trim)
     */
   
    
    /**
     * Normalize page (điều chỉnh để bắt đầu từ 0)
     */
    public static Integer normalizePage(Integer page) {
        if (page != null && page > 0) {
            return page - 1;
        }
        return page != null ? page : 0;
    }
    
    /**
     * Normalize string (trim và null check)
     */
    public static String normalizeString(String value) {
        return value != null ? value.trim() : null;
    }
    
    /**
     * Normalize tất cả các string parameters cho Administrator search
     * Trả về một array với thứ tự: [departmentId, workAreaId, username, phone, name]
     */
    public static String[] normalizeAdministratorSearchStrings(
            String departmentId, String workAreaId, 
            String username, String phone, String name) {
        return new String[]{
            normalizeString(departmentId),
            normalizeString(workAreaId),
            normalizeString(username),
            normalizeString(phone),
            normalizeString(name)
        };
    }
}

