package vn.greenlab.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalAccessor;
import java.time.temporal.TemporalQuery;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class TextUtils {
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9,10}$");
    private static final Pattern ID_NUMBER_PATTERN = Pattern.compile("^\\d{9}$|^\\d{12}$");

    public static final DateTimeFormatter DDMMYY = DateTimeFormatter.ofPattern("ddMMyy");
    public static final DateTimeFormatter DD_MM_YYYY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter YYYYMMDD_HHMMSS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    public static final DateTimeFormatter HHmmDDMMYYYY = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    public static final DateTimeFormatter DD_MM_YYYY_HHMMSS = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    public static final DateTimeFormatter YYYY_MM_DD = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final DateTimeFormatter YYYY_MM_DD_HHMMSS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static String throwCauseException(Throwable e) {
        try {
            if (e != null) {
                Throwable cause = e.getCause();
                if (cause != null) {
                    Throwable causeNext = cause.getCause();
                    if (causeNext != null) {
                        return causeNext.getMessage();
                    }
                    return cause.getMessage();
                }
            }
            return e.getMessage() == null ? e.toString() : e.getMessage();
        } catch (Exception ex) {
            return null;
        }
    }

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * Cắt hết dấu tiếng Việt
     *
     * @param str
     * @return
     */
    public static String removeDiacritical(String str) {
        if (str == null) {
            return str;
        }
        str = str.replaceAll("(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)", "a");
        str = str.replaceAll("(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)", "e");
        str = str.replaceAll("(ì|í|ị|ỉ|ĩ)", "i");
        str = str.replaceAll("(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)", "o");
        str = str.replaceAll("(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)", "u");
        str = str.replaceAll("(ỳ|ý|ỵ|ỷ|ỹ)", "y");
        str = str.replaceAll("(đ)", "d");
        str = str.replaceAll("(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)", "A");
        str = str.replaceAll("(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)", "E");
        str = str.replaceAll("(Ì|Í|Ị|Ỉ|Ĩ)", "I");
        str = str.replaceAll("(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)", "O");
        str = str.replaceAll("(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)", "U");
        str = str.replaceAll("(Ỳ|Ý|Ỵ|Ỷ|Ỹ)", "Y");
        str = str.replaceAll("(Đ)", "D");
        return str;
    }

    public static String getDetailError(Exception e) {
        try {
            StackTraceElement[] stackTrace = e.getStackTrace();
            StackTraceElement ste = stackTrace[0];
            for (StackTraceElement stackTraceElement : stackTrace) {
                if (stackTraceElement.getClassName().contains("vn.greenlab")
                        && !stackTraceElement.getClassName().contains("vn.greenlab.model")
                        && stackTraceElement.getLineNumber() != -1
                        && !stackTraceElement.getClassName().contains("BaseRepository")
                        && !stackTraceElement.getClassName().contains("BaseRepositoryImpl")
                        && !stackTraceElement.getClassName().contains("BaseMongoLogRepository")) {
                    ste = stackTraceElement;
                    break;
                }
            }
            String className = ste.getClassName();
            String methodName = ste.getMethodName();
            int lineNumber = ste.getLineNumber();
            String error = "Error at CLASS: " + className + "; METHOD: " + methodName + "; LINE NUMBER: " + lineNumber;
            error += "; MESSAGE: " + throwCauseException(e);
            return error;
        } catch (Exception ex) {
        }
        return null;
    }

    /**
     * replace escape string when query search
     *
     * @author namtn
     * @param s
     * @return escaped s
     */
    public static String escapeStringSQL(String s) {
        return s.toLowerCase().trim()
                .replaceAll("%", "\\\\%")
                .replaceAll("_", "\\\\_");
    }

    /**
     * replace escape string when query search
     *
     * @author namtn
     * @param s
     * @return escaped s
     */
    public static String escapeStringMongo(String s) {
        return s.trim()
                .replaceAll("\\*", "\\\\*").replaceAll("\\?", "\\\\?");
    }

    public static String getSexLabel(Integer sex) {
        if (sex == null)
            return "Không xác định";

        return switch (sex) {
            case 1 -> "Nam";
            case 2 -> "Nữ";
            case 3 -> "Khác";
            default -> "Không xác định";
        };
    }

    public static String generateUniqueNumbers(Set<String> existed) {
        List<Integer> digits = IntStream.range(0, 10)
                .boxed()
                .collect(Collectors.toList());

        Collections.shuffle(digits);

        if (digits.get(0) == 0) {
            for (int i = 1; i < digits.size(); i++) {
                if (digits.get(i) != 0) {
                    Collections.swap(digits, 0, i);
                    break;
                }
            }
        }
        String numberPart = digits.stream()
                .limit(8)
                .map(String::valueOf)
                .collect(Collectors.joining());
        return "G" + numberPart;
    }

    public static String validatePhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String normalizedPhone = phone.trim()
                .replace(" ", "")
                .replace("+84", "0")
                .replace("-", "")
                .replace("+", "");
        if (!PHONE_PATTERN.matcher(normalizedPhone).matches()) {
            return null;
        }
        return normalizedPhone;
    }

    public static boolean validateIdNumber(String idNumber) {
        if (idNumber == null || idNumber.isBlank()) {
            return false;
        }
        return ID_NUMBER_PATTERN.matcher(idNumber.trim()).matches();
    }

    private static final Pattern EMAIL_PATTERN = Pattern
            .compile("^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$");

    public static boolean validateEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String trimmed = email.trim().toLowerCase();
        return EMAIL_PATTERN.matcher(trimmed).matches();
    }

    /**
     * Format số với X chữ số thập phân bằng NumberFormat.
     * Ví dụ: formatDecimal(12.3456, 2) => "12.35"
     */
    public static String formatDecimal(Number value, int fractionDigits) {
        if (value == null) {
            return "0";
        }
        int digits = Math.max(0, fractionDigits);
        NumberFormat numberFormat = NumberFormat.getNumberInstance(Locale.US);
        numberFormat.setGroupingUsed(false);
        numberFormat.setMinimumFractionDigits(digits);
        numberFormat.setMaximumFractionDigits(digits);
        return numberFormat.format(value.doubleValue());
    }

    /**
     * Làm tròn số với X chữ số thập phân bằng NumberFormat.
     * Ví dụ: roundDecimal(12.3456, 2) => 12.35
     */
    public static double roundDecimal(Number value, int fractionDigits) {
        String formatted = formatDecimal(value, fractionDigits);
        try {
            return Double.parseDouble(formatted);
        } catch (Exception ex) {
            return 0D;
        }
    }

    // public static TemporalAccessor stringToDate(String dateStr, DateTimeFormatter
    // formatter) {
    // if (dateStr == null || dateStr.trim().isEmpty()) {
    // return null;
    // }
    // try {
    // return formatter.parse(dateStr);
    // } catch (Exception ex) {
    // return null;
    // }
    // }

    public static <T> T stringToDate(String dateStr, DateTimeFormatter formatter, Class<T> clazz) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            TemporalAccessor accessor = formatter.parse(dateStr);

            // 1. Nếu muốn kết quả là LocalDateTime
            if (clazz == LocalDateTime.class) {
                if (!accessor.isSupported(ChronoField.HOUR_OF_DAY)) {
                    // Nếu thiếu giờ, bù 00:00:00
                    return clazz.cast(LocalDate.from(accessor).atStartOfDay());
                }
                return clazz.cast(LocalDateTime.from(accessor));
            }

            // 2. Nếu muốn kết quả là LocalDate
            if (clazz == LocalDate.class) {
                return clazz.cast(LocalDate.from(accessor));
            }

            // 3. Nếu muốn kết quả là LocalTime
            if (clazz == LocalTime.class) {
                return clazz.cast(LocalTime.from(accessor));
            }

            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    public static LocalDate stringToLocalDate(String dateStr, DateTimeFormatter formatter) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        return LocalDate.parse(dateStr, formatter);
    }

    public static LocalDateTime stringToLocalDateTime(String dateStr, DateTimeFormatter formatter) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateStr, formatter);
    }

    public static String dateToString(TemporalAccessor date, DateTimeFormatter formatter) {
        if (date == null) {
            return null;
        }
        return DDMMYY.format(date);
    }

    public static String dateTimeToString(LocalDateTime ldt) {
        if (ldt == null) {
            return "";
        }
        return DD_MM_YYYY_HHMMSS.format(ldt);
    }

    public static String instantToString(Instant instant) {
        if (instant == null) {
            return "";
        }
        DateTimeFormatter formatter = DD_MM_YYYY_HHMMSS
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        return formatter.format(instant);
    }

    public static String getMD5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(input.getBytes());

            byte byteData[] = md.digest();

            // convert the byte to hex format method 1
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < byteData.length; i++) {
                sb.append(Integer.toString((byteData[i] & 0xff) + 0x100, 16).substring(1));
            }

            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean checkFormatSid(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        String regex = "\\d{6}-\\d+";
        return text.matches(regex);
    }

    public static String removeAccent(String s) {
        if (s == null) return null;

        // 1. Phân tách các ký tự có dấu thành: ký tự gốc + dấu (ví dụ: 'á' -> 'a' + '´')
        String temp = Normalizer.normalize(s, Normalizer.Form.NFD);

        // 2. Sử dụng Regex để loại bỏ các ký tự thuộc nhóm "Dấu" (Non-spacing Mark)
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String result = pattern.matcher(temp).replaceAll("");

        // 3. Xử lý riêng chữ 'Đ' và 'đ' vì chúng không nằm trong chuẩn NFD thông thường
        return result.replaceAll("đ", "d").replaceAll("Đ", "D");
    }

    /**
     * Format số tiền với #,### có nghĩa là phân cách hàng nghìn bằng dấu phẩy
     * Ví dụ: formatMoney(1234567890) => "1,234,567,890"
     * @param value
     * @return
     */
    public static String formatMoney(Object value) {
        if (value == null) return "0";
        // Pattern #,### có nghĩa là phân cách hàng nghìn bằng dấu phẩy
        DecimalFormat formatter = new DecimalFormat("#,###");
        return formatter.format(value);
    }
}
