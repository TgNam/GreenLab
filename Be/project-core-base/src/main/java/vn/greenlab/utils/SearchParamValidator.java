package vn.greenlab.utils;

import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.LogAdminType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Utility class để validate các search parameters chung
 * Có thể tái sử dụng cho nhiều search APIs khác nhau
 * Throw BadRequestException với ErrorCode để hỗ trợ đa ngôn ngữ
 */
public class SearchParamValidator {

    // Regex patterns
    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}\\s]*$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]*$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]*$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@"
            + "[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$");

    /**
     * Validate và convert page number từ String
     */
    public static Integer validateAndConvertPage(String pageStr) {
        if (pageStr == null || pageStr.trim().isEmpty()) {
            return 0;
        }
        try {
            Integer page = Integer.parseInt(pageStr.trim());
            if (page < 0) {
                throw new BadRequestException(ErrorCode.INVALID_PAGE);
            }
            return page;
        } catch (NumberFormatException e) {
            throw new BadRequestException(ErrorCode.INVALID_PAGE);
        }
    }

    /**
     * Validate và convert size từ String
     */
    public static Integer validateAndConvertSize(String sizeStr) {
        if (sizeStr == null || sizeStr.trim().isEmpty()) {
            return 20;
        }
        try {
            Integer size = Integer.parseInt(sizeStr.trim());
            if (size <= 0) {
                throw new BadRequestException(ErrorCode.INVALID_SIZE);
            }
            return size;
        } catch (NumberFormatException e) {
            throw new BadRequestException(ErrorCode.INVALID_SIZE);
        }
    }

    /**
     * Validate và convert timeType từ String
     */
    public static Integer validateAndConvertTimeType(String timeTypeStr) {
        if (timeTypeStr == null || timeTypeStr.trim().isEmpty()) {
            return 0;
        }
        try {
            Integer timeType = Integer.parseInt(timeTypeStr.trim());
            if (timeType < 0) {
                throw new BadRequestException(ErrorCode.INVALID_TIME_TYPE);
            }
            return timeType;
        } catch (NumberFormatException e) {
            throw new BadRequestException(ErrorCode.INVALID_TIME_TYPE);
        }
    }

    /**
     * Validate và convert ID từ String sang Long
     */
    public static Integer validateAndConvertId(String idStr) {
        if (idStr == null || idStr.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(idStr.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException(ErrorCode.INVALID_ID_FORMAT);
        }
    }

    /**
     * Validate và convert timestamp từ String sang Long
     */
    public static Long validateAndConvertTimestamp(String timestampStr) {
        if (timestampStr == null || timestampStr.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(timestampStr.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException(ErrorCode.INVALID_ID_FORMAT);
        }
    }

    /**
     * Validate và convert String sang LocalDateTime
     * Hỗ trợ các format:
     * - yyyy-MM-dd (sẽ được convert thành LocalDateTime với time 00:00:00)
     * - yyyy-MM-dd HH:mm
     * - yyyy-MM-ddTHH:mm:ss (ISO format)
     */
    public static LocalDateTime validateAndConvertLocalDateTime(String localDateTimeStr) {
        if (localDateTimeStr == null || localDateTimeStr.trim().isEmpty()) {
            return null;
        }

        String trimmed = localDateTimeStr.trim();

        try {
            // Thử parse với format date-time có space (yyyy-MM-dd HH:mm)
            if (trimmed.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")) {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                return LocalDateTime.parse(trimmed, formatter);
            }
            // Thử parse với format date-time có space và giây (yyyy-MM-dd HH:mm:ss)
            else if (trimmed.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}")) {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                return LocalDateTime.parse(trimmed, formatter);
            }
            // Thử parse với format date only (yyyy-MM-dd) - convert sang LocalDateTime với time 00:00:00
            else if (trimmed.matches("\\d{4}-\\d{2}-\\d{2}")) {
                java.time.LocalDate date = java.time.LocalDate.parse(trimmed);
                return date.atStartOfDay(); // Convert LocalDate to LocalDateTime at 00:00:00
            }
            // Thử parse với ISO format mặc định (yyyy-MM-ddTHH:mm:ss)
            else {
                return LocalDateTime.parse(trimmed);
            }
        } catch (Exception e) {
            e.printStackTrace(System.out);
            throw new BadRequestException(ErrorCode.INVALID_DATE_FORMAT);
        }
    }

    public static LocalDateTime convertLocalDateTime(String localDateTimeStr, boolean isLastOfDay) {
        if (localDateTimeStr == null || localDateTimeStr.trim().isEmpty()) {
            return null;
        }

        String trimmed = localDateTimeStr.trim();

        try {
            // yyyy-MM-dd HH:mm
            if (trimmed.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")) {
                DateTimeFormatter formatter =
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                return LocalDateTime.parse(trimmed, formatter);
            }

            // yyyy-MM-dd HH:mm:ss
            if (trimmed.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}")) {
                DateTimeFormatter formatter =
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                return LocalDateTime.parse(trimmed, formatter);
            }

            // yyyy-MM-dd (DATE ONLY)
            if (trimmed.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate date = LocalDate.parse(trimmed);

                // 🔥 QUAN TRỌNG NHẤT
                return isLastOfDay
                        ? date.plusDays(1).atStartOfDay() // đầu ngày hôm sau
                        : date.atStartOfDay();             // đầu ngày hiện tại
            }

            // ISO: yyyy-MM-ddTHH:mm[:ss]
            return LocalDateTime.parse(trimmed);

        } catch (Exception e) {
            throw new BadRequestException(ErrorCode.INVALID_DATE_FORMAT);
        }
    }


    /**
     * Validate page number (backward compatibility)
     */
    public static boolean isValidPage(Integer page) {
        return page == null || page >= 0;
    }

    /**
     * Validate size (page size) (backward compatibility)
     */
    public static boolean isValidSize(Integer size) {
        return size == null || size > 0;
    }

    /**
     * Validate timeType (backward compatibility)
     */
    public static boolean isValidTimeType(Integer timeType) {
        return timeType == null || timeType >= 0;
    }

    /**
     * Validate name (chỉ chứa chữ cái và khoảng trắng)
     */
    public static boolean isValidName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return true; // null hoặc empty là hợp lệ
        }
        return NAME_PATTERN.matcher(name.trim()).matches();
    }

    /**
     * Validate username (chỉ chứa chữ cái, số và dấu gạch dưới)
     */
    public static boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return true; // null hoặc empty là hợp lệ
        }
        return USERNAME_PATTERN.matcher(username.trim()).matches();
    }

    /**
     * Validate phone (chỉ chứa số)
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return true; // null hoặc empty là hợp lệ
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }

    /**
     * Validate email format
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return true; // null hoặc empty là hợp lệ (có thể không bắt buộc)
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Validate date range (createdFrom <= createdTo)
     */
    public static boolean isValidDateRange(Long createdFrom, Long createdTo) {
        if (createdFrom == null || createdTo == null) {
            return true; // null là hợp lệ
        }
        return createdFrom <= createdTo;
    }

    public static boolean isValidDateRange(LocalDateTime createdFrom, LocalDateTime createdTo) {
        if (createdFrom == null || createdTo == null) {
            return true; // null là hợp lệ
        }
        return createdFrom.isBefore(createdTo) || createdFrom.equals(createdTo);
    }

    /**
     * Validate ID (phải là số, không được chứa chữ)
     * Kiểm tra nếu ID được truyền vào dưới dạng String
     */
    public static boolean isValidId(String id) {
        if (id == null || id.trim().isEmpty()) {
            return true; // null hoặc empty là hợp lệ
        }
        try {
            Long.parseLong(id.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Validate Long ID (đã là Long thì không cần validate format)
     */
    public static boolean isValidId(Long id) {
        return true; // Long type đã đảm bảo là số
    }

    /**
     * Validate các search parameters cho Administrator search
     * Tất cả các tham số số được truyền vào dưới dạng String để có thể validate
     * format
     * Throw BadRequestException với ErrorCode nếu có lỗi
     *
     * @param pageStr        Số trang (String)
     * @param sizeStr        Kích thước trang (String)
     * @param timeTypeStr    Loại thời gian (String)
     * @param idStr          ID (String)
     * @param managerIdStr   ID quản lý (String)
     * @param departmentId   ID phòng ban (String)
     * @param workAreaId     ID khu vực (String)
     * @param name           Tên
     * @param username       Tên đăng nhập
     * @param phone          Số điện thoại
     * @param createdFromStr Ngày bắt đầu (String)
     * @param createdToStr   Ngày kết thúc (String)
     * @return Object chứa các giá trị đã được validate và convert
     */
    public static AdministratorSearchParams validateAndConvertAdministratorSearch(
            String pageStr, String sizeStr, String timeTypeStr,
            String idStr, String managerIdStr, String departmentId, String workAreaId,
            String name, String username, String phone,
            String createdFromStr, String createdToStr) {

        // Validate và convert các tham số số
        Integer page = validateAndConvertPage(pageStr);
        Integer size = validateAndConvertSize(sizeStr);
        Integer timeType = validateAndConvertTimeType(timeTypeStr);
        Integer id = validateAndConvertId(idStr);
        Integer managerId = validateAndConvertId(managerIdStr);
        // Long createdFrom = validateAndConvertTimestamp(createdFromStr);
        // Long createdTo = validateAndConvertTimestamp(createdToStr);
        System.out.println("createdFromStr12: " + createdFromStr);
        System.out.println("createdToStr12: " + createdToStr);
        LocalDateTime createdFrom = validateAndConvertLocalDateTime(createdFromStr);
        LocalDateTime createdTo = validateAndConvertLocalDateTime(createdToStr);

        // Validate name
        // if (!isValidName(name)) {
        // throw new BadRequestException(ErrorCode.INVALID_NAME_FORMAT);
        // }

        // Validate username
        // if (!isValidUsername(username)) {
        // throw new BadRequestException(ErrorCode.INVALID_USERNAME_FORMAT);
        // }

        // Validate phone
        // if (!isValidPhone(phone)) {
        // throw new BadRequestException(ErrorCode.INVALID_PHONE_FORMAT);
        // }

        // Validate date range
        if (!isValidDateRange(createdFrom, createdTo)) {
            throw new BadRequestException(ErrorCode.INVALID_DATE_RANGE);
        }

        return new AdministratorSearchParams(page, size, timeType, id, managerId,
                departmentId, workAreaId, name, username, phone, createdFrom, createdTo);
    }

    /**
     * Class để chứa các tham số đã được validate và convert
     */
    public static class AdministratorSearchParams {
        public final Integer page;
        public final Integer size;
        public final Integer timeType;
        public final Integer id;
        public final Integer managerId;
        public final String departmentId;
        public final String workAreaId;
        public final String name;
        public final String username;
        public final String phone;
        // public final Long createdFrom;
        // public final Long createdTo;
        public final LocalDateTime createdFrom;
        public final LocalDateTime createdTo;

        public AdministratorSearchParams(Integer page, Integer size, Integer timeType,
                                         Integer id, Integer managerId, String departmentId, String workAreaId,
                                         String name, String username, String phone,
                                         // Long createdFrom, Long createdTo) {
                                         LocalDateTime createdFrom, LocalDateTime createdTo) {
            this.page = page;
            this.size = size;
            this.timeType = timeType;
            this.id = id;
            this.managerId = managerId;
            this.departmentId = departmentId;
            this.workAreaId = workAreaId;
            this.name = name;
            this.username = username;
            this.phone = phone;
            this.createdFrom = createdFrom;
            this.createdTo = createdTo;
        }
    }

    /**
     * Normalize các string parameters (trim)
     */
    public static String normalizeString(String value) {
        return value != null ? value.trim() : null;
    }

    /**
     * Normalize page (điều chỉnh để bắt đầu từ 0)
     */
    public static Integer normalizePage(Integer page) {
        if (page != null && page > 0) {
            return page - 1;
        }
        return page != null ? page : 0;
    }

    public static Integer validateSize(Integer size) {
        if(size <= 0 || size > 500) {
            throw new BadRequestException(ErrorCode.INVALID_SIZE);
        }
        return size;
    }

    /**
     * Validate AdministratorInput
     * Validate các trường: phone, username, email, department_id, work_area_id
     * Throw BadRequestException với ErrorCode nếu có lỗi
     */
    public static void validateAdministratorInput(String phone, String username, String email,
                                                  String departmentId, String workAreaId) {

        // Validate phone
        if (phone != null && !phone.trim().isEmpty() && !isValidPhone(phone)) {
            throw new BadRequestException(ErrorCode.INVALID_PHONE_FORMAT);
        }

        // Validate username
        if (username != null && !username.trim().isEmpty() && !isValidUsername(username)) {
            throw new BadRequestException(ErrorCode.INVALID_USERNAME_FORMAT);
        }

        // Validate email
        if (email != null && !email.trim().isEmpty() && !isValidEmail(email)) {
            throw new BadRequestException(ErrorCode.INVALID_EMAIL_FORMAT);
        }

    }

    /**
     * Validate và convert TestProfile search parameters
     * @return Object chứa các giá trị đã được validate và convert
     */
    public static TestProfileSearchParams validateAndConvertTestProfileSearch(
            String pageStr, String sizeStr,
            String profileCode, String profileName, String quickInput,
            String timeTypeStr, String timeFromStr, String timeToStr,
            String createdByStr, String updatedByStr) {

        // Validate và convert các tham số số
        Integer page = validateAndConvertPage(pageStr);
        Integer size = validateAndConvertSize(sizeStr);
        Integer timeType = validateAndConvertTimeType(timeTypeStr);
        Integer createdBy = validateAndConvertId(createdByStr);
        Integer updatedBy = validateAndConvertId(updatedByStr);
        
        // Convert date strings to LocalDateTime
        LocalDateTime timeFrom = validateAndConvertLocalDateTime(timeFromStr);
        LocalDateTime timeTo = validateAndConvertLocalDateTime(timeToStr);

        // Validate date range
        if (!isValidDateRange(timeFrom, timeTo)) {
            throw new BadRequestException(ErrorCode.INVALID_DATE_RANGE);
        }

        return new TestProfileSearchParams(page, size, profileCode, profileName, quickInput,
                timeType, timeFrom, timeTo, createdBy, updatedBy);
    }

    /**
     * Class để chứa các tham số đã được validate và convert cho TestProfile search
     */
    public static class TestProfileSearchParams {
        public final Integer page;
        public final Integer size;
        public final String profileCode;
        public final String profileName;
        public final String quickInput;
        public final Integer timeType;
        public final LocalDateTime timeFrom;
        public final LocalDateTime timeTo;
        public final Integer createdBy;
        public final Integer updatedBy;

        public TestProfileSearchParams(Integer page, Integer size, String profileCode, String profileName,
                                      String quickInput, Integer timeType, LocalDateTime timeFrom, LocalDateTime timeTo,
                                      Integer createdBy, Integer updatedBy) {
            this.page = page;
            this.size = size;
            this.profileCode = profileCode;
            this.profileName = profileName;
            this.quickInput = quickInput;
            this.timeType = timeType;
            this.timeFrom = timeFrom;
            this.timeTo = timeTo;
            this.createdBy = createdBy;
            this.updatedBy = updatedBy;
        }
    }

    /**
     * Validate search-admin parameters
     * Validate page và username
     */
    public static Integer validateSearchAdmin(String pageStr, String username) {
        // Validate page
        Integer page = validateAndConvertPage(pageStr);

        // Validate username
        if (username != null && username.trim().isEmpty() ) {
            throw new BadRequestException(ErrorCode.INVALID_USERNAME_FORMAT);
        }

        return page;
    }

    /**
     * Validate image file type
     * Chỉ cho phép: image/jpeg, image/jpg, image/png, image/webp
     * Throw BadRequestException với ErrorCode nếu file không hợp lệ
     */
    public static void validateImageFile(org.springframework.web.multipart.MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            return; // Không validate nếu file null hoặc empty
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        // Danh sách các content type được phép
        java.util.List<String> allowedContentTypes = java.util.Arrays.asList(
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp");

        // Kiểm tra content type
        boolean isValidContentType = contentType != null && allowedContentTypes.contains(contentType.toLowerCase());

        // Kiểm tra file extension (fallback nếu content type không có)
        boolean isValidExtension = false;
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            isValidExtension = java.util.Arrays.asList("jpg", "jpeg", "png", "webp").contains(extension);
        }

        // Nếu không hợp lệ, throw exception
        if (!isValidContentType && !isValidExtension) {
            throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    public static void validateContractFile(org.springframework.web.multipart.MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            return; // Không validate nếu file null hoặc empty
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        // Danh sách các content type được phép
        java.util.List<String> allowedContentTypes = java.util.Arrays.asList(
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "pdf",
                "doc",
                "docx");

        // Kiểm tra content type
        boolean isValidContentType = contentType != null && allowedContentTypes.contains(contentType.toLowerCase());

        // Kiểm tra file extension (fallback nếu content type không có)
        boolean isValidExtension = false;
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            isValidExtension = java.util.Arrays.asList("jpg", "jpeg", "png", "webp", "pdf", "doc", "docx").contains(extension);
        }

        // Nếu không hợp lệ, throw exception
        if (!isValidContentType && !isValidExtension) {
            throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    /**
     * Validate và convert các search parameters cho Role search
     * Tương tự như AdministratorSearchParams nhưng cho Role
     *
     * @param pageStr        Số trang (String)
     * @param sizeStr        Kích thước trang (String)
     * @param timeTypeStr    Loại thời gian (String)
     * @param idStr          ID (String)
     * @param adminIdStr    ID quản trị viên (String)
     * @param name           Tên
     * @param description    Mô tả
     * @param createdTimeFromStr Ngày bắt đầu (String)
     * @param createdTimeToStr   Ngày kết thúc (String)
     * @return Object chứa các giá trị đã được validate và convert
     */
    public static RoleSearchParams validateAndConvertRoleSearch(
            String pageStr, String sizeStr, String timeTypeStr,
            String idStr, String adminIdStr,
            String name, String description,
            String createdTimeFromStr, String createdTimeToStr) {

        // Validate và convert các tham số số
        Integer page = validateAndConvertPage(pageStr);
        Integer size = validateAndConvertSize(sizeStr);
        Integer timeType = validateAndConvertTimeType(timeTypeStr);
        Integer id = validateAndConvertId(idStr);
        Integer adminId = validateAndConvertId(adminIdStr);

        LocalDateTime createdTimeFrom = validateAndConvertLocalDateTime(createdTimeFromStr);
        LocalDateTime createdTimeTo = validateAndConvertLocalDateTime(createdTimeToStr);

        // Validate date range
        if (!isValidDateRange(createdTimeFrom, createdTimeTo)) {
            throw new BadRequestException(ErrorCode.INVALID_DATE_RANGE);
        }

        return new RoleSearchParams(page, size, timeType, id, adminId,
                name, description, createdTimeFrom, createdTimeTo);
    }

    /**
     * Class để chứa các tham số đã được validate và convert cho Role search
     */
    public static class RoleSearchParams {
        public final Integer page;
        public final Integer size;
        public final Integer timeType;
        public final Integer id;
        public final Integer adminId;
        public final String name;
        public final String description;
        public final LocalDateTime createdTimeFrom;
        public final LocalDateTime createdTimeTo;

        public RoleSearchParams(Integer page, Integer size, Integer timeType,
                                Integer id, Integer adminId,
                                String name, String description,
                                LocalDateTime createdTimeFrom, LocalDateTime createdTimeTo) {
            this.page = page;
            this.size = size;
            this.timeType = timeType;
            this.id = id;
            this.adminId = adminId;
            this.name = name;
            this.description = description;
            this.createdTimeFrom = createdTimeFrom;
            this.createdTimeTo = createdTimeTo;
        }
    }

    /**
     * Validate và convert các search parameters cho Department search
     *
     * @param pageStr           Số trang (String)
     * @param sizeStr           Kích thước trang (String)
     * @param timeTypeStr       Loại thời gian (String)
     * @param name              Tên phòng ban
     * @param shortName         Tên viết tắt
     * @param createdFromStr    Ngày bắt đầu (String)
     * @param createdToStr      Ngày kết thúc (String)
     * @return Object chứa các giá trị đã được validate và convert
     */
    public static DepartmentSearchParams validateAndConvertDepartmentSearch(
            String pageStr, String sizeStr, String timeTypeStr,
            String name, String shortName,
            String createdFromStr, String createdToStr) {

        // Validate và convert các tham số số
        Integer page = validateAndConvertPage(pageStr);
        Integer size = validateAndConvertSize(sizeStr);
        Integer timeType = validateAndConvertTimeType(timeTypeStr);
        Long id = null; // Department search doesn't use id filter directly

        LocalDateTime createdTimeFrom = validateAndConvertLocalDateTime(createdFromStr);
        LocalDateTime createdTimeTo = validateAndConvertLocalDateTime(createdToStr);

        // Validate date range
        if (!isValidDateRange(createdTimeFrom, createdTimeTo)) {
            throw new BadRequestException(ErrorCode.INVALID_DATE_RANGE);
        }

        return new DepartmentSearchParams(page, size, timeType, id,
                createdTimeFrom, createdTimeTo, name, shortName);
    }

    /**
     * Class để chứa các tham số đã được validate và convert cho Department search
     */
    public static class DepartmentSearchParams {
        public final Integer page;
        public final Integer size;
        public final Integer timeType;
        public final Long id;
        public final LocalDateTime createdTimeFrom;
        public final LocalDateTime createdTimeTo;
        public final String name;
        public final String shortName;

        public DepartmentSearchParams(Integer page, Integer size, Integer timeType,
                                      Long id,
                                      LocalDateTime createdTimeFrom, LocalDateTime createdTimeTo,
                                      String name, String shortName) {
            this.page = page;
            this.size = size;
            this.timeType = timeType;
            this.id = id;
            this.createdTimeFrom = createdTimeFrom;
            this.createdTimeTo = createdTimeTo;
            this.name = name;
            this.shortName = shortName;
        }
    }

    /**
     * Validate và convert các search parameters cho Log Admin search
     *
     * @param pageStr        Số trang (String)
     * @param sizeStr        Kích thước trang (String)
     * @param id             ID log (String)
     * @param objectId       Object ID (String)
     * @param note           Note (String)
     * @param typeStr        Loại log (String)
     * @param administratorIdStr ID quản trị viên (String)
     * @param createTimeFromStr Thời gian bắt đầu (String)
     * @param createTimeToStr   Thời gian kết thúc (String)
     * @return Object chứa các giá trị đã được validate và convert
     */
    public static LogAdminSearchParams validateAndConvertLogAdminSearch(
            String pageStr, String sizeStr, String id, String objectId, String note,
            String typeStr, String administratorIdStr,
            String createTimeFromStr, String createTimeToStr) {

        // Validate và convert các tham số số
        Integer page = validateAndConvertPage(pageStr);
        Integer size = validateAndConvertSize(sizeStr);

        // Validate và convert LogType
        LogAdminType type = null;
        if (typeStr != null && !typeStr.trim().isEmpty()) {
            try {
                type = LogAdminType.valueOf(typeStr.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ErrorCode.INVALID_LOG_TYPE);
            }
        }

        // Validate và convert administratorId
        Long administratorId = null;
        if (administratorIdStr != null && !administratorIdStr.trim().isEmpty()) {
            try {
                administratorId = Long.parseLong(administratorIdStr.trim());
                if (administratorId <= 0) {
                    throw new BadRequestException(ErrorCode.INVALID_ADMINISTRATOR_ID);
                }
            } catch (NumberFormatException e) {
                throw new BadRequestException(ErrorCode.INVALID_ADMINISTRATOR_ID);
            }
        }

        // Validate và convert timestamps
        Long createTimeFrom = validateAndConvertTimestamp(createTimeFromStr);
        Long createTimeTo = validateAndConvertTimestamp(createTimeToStr);

        return new LogAdminSearchParams(page, size, id, objectId, note,
                Optional.ofNullable(type), Optional.ofNullable(administratorId),
                Optional.ofNullable(createTimeFrom), Optional.ofNullable(createTimeTo));
    }

    /**
     * Class để chứa các tham số đã được validate và convert cho Log Admin search
     */
    public static class LogAdminSearchParams {
        public final Integer page;
        public final Integer size;
        public final String id;
        public final String objectId;
        public final String note;
        public final Optional<LogAdminType> type;
        public final Optional<Long> administratorId;
        public final Optional<Long> createTimeFrom;
        public final Optional<Long> createTimeTo;

        public LogAdminSearchParams(Integer page, Integer size, String id, String objectId, String note,
                                   Optional<LogAdminType> type, Optional<Long> administratorId,
                                   Optional<Long> createTimeFrom, Optional<Long> createTimeTo) {
            this.page = page;
            this.size = size;
            this.id = id;
            this.objectId = objectId;
            this.note = note;
            this.type = type;
            this.administratorId = administratorId;
            this.createTimeFrom = createTimeFrom;
            this.createTimeTo = createTimeTo;
        }
    }
}
