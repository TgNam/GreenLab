package vn.greenlab.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import vn.greenlab.utils.TextUtils;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.LogAdminType;
// import vn.greenlab.service.LogAdminService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // @Autowired
    // private LogAdminService logAdminService;

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        String lang = "vi"; // default
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("lang".equals(cookie.getName())) {
                    // System.out.println("LANGCOOKIE: " + cookie.getValue());
                    lang = cookie.getValue();
                    break;
                }
            }
        }
        Map<String, Object> error = new HashMap<>();
        ErrorCode code = ex.getErrorCode();
        error.put("code", code != null ? code.name() : "");
        // Nếu có customMessage thì dùng nó, nếu không thì dùng description từ ErrorCode
        String message = ex.getCustomMessage() != null ? ex.getCustomMessage()
                : (code != null ? code.getDescription(lang) : ex.getMessage());
        Map<String, String> errorI18n = new HashMap<>();
        errorI18n.put("vi", ex.getCustomMessage() != null ? ex.getCustomMessage()
                : (code != null ? code.getDescription("vi") : ex.getMessage()));
        errorI18n.put("en", ex.getCustomMessage() != null ? ex.getCustomMessage()
                : (code != null ? code.getDescription("en") : ex.getMessage()));
        error.put("i18n", errorI18n);
        error.put("message", message);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex,
            HttpServletRequest request) {
        String lang = "vi"; // default
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("lang".equals(cookie.getName())) {
                    // System.out.println("LANGCOOKIE: " + cookie.getValue());
                    lang = cookie.getValue();
                    break;
                }
            }
        }

        Map<String, Object> error = new HashMap<>();
        ErrorCode code = ex.getErrorCode();
        error.put("code", code != null ? code.name() : "");
        error.put("message", code != null ? code.getDescription(lang) : ex.getMessage());
        Map<String, String> errorI18n = new HashMap<>();
        errorI18n.put("vi", (code != null ? code.getDescription("vi") : ex.getMessage()));
        errorI18n.put("en", (code != null ? code.getDescription("en") : ex.getMessage()));
        error.put("i18n", errorI18n);
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFoundException(EntityNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("success", "false");
        error.put("code", "500");
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();

        error.put("success", "false");
        error.put("message", ex.getMessage());
        error.put("code", "500");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        // logAdminService.add(ex.toString(), String.valueOf(System.currentTimeMillis()),
        //         "Có lỗi xảy ra: " + TextUtils.getDetailError(ex), LogAdminType.EXCEPTION, 0, "");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(IncorrectResultSizeDataAccessException.class)
    public ResponseEntity<Map<String, String>> handleNonUnique() {
        Map<String, String> error = new HashMap<>();
        error.put("success", "false");
        error.put("message", "Dữ liệu bị trùng, vui lòng kiểm tra lại");
        error.put("code", "500");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
}