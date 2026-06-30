package vn.greenlab.model.excel;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ExcelColumn {
    String name(); // Tên cột trong Excel
    int order() default -1; // Thứ tự cột (0-based), -1 = không cần chỉ định thứ tự
    boolean required() default false; // Có bắt buộc không
    /**
     * Nhóm \"bắt buộc 1 trong n cột\".
     * Các field có cùng requiredAnyGroup != \"\" sẽ được validate theo rule:
     * ít nhất 1 trong các cột trong cùng nhóm phải có dữ liệu.
     */
    String requiredAnyGroup() default ""; // Tên nhóm required 1 trong n (ví dụ: \"BIRTH_OR_YEAR\")
    String defaultValue() default ""; // Giá trị mặc định nếu null

    /**
     * Tô màu nền (fill) cho cell theo điều kiện đơn giản:
     * nếu giá trị cell (toString) == bgColorWhenEquals thì set background = bgColor.
     *
     * Ví dụ: bgColor = "RED", bgColorWhenEquals = "2003"
     */
    String bgColor() default ""; // Tên màu trong IndexedColors (RED, YELLOW, ...)
    String bgColorWhenEquals() default ""; // Giá trị so sánh (string) để áp màu nền

    /**
     * Rule động để quyết định tô nền theo row object.
     * Nếu dùng rule này thì mọi logic sẽ nằm trong class rule (matches + bgColor).
     */
    Class<? extends ExcelBgColorRule> bgRule() default NoBgColorRule.class;
}