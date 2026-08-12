package vn.greenlab.model.excel;

import org.apache.poi.ss.usermodel.IndexedColors;

/**
 * Rule tô màu nền cell khi export Excel.
 * - rowObject: object của dòng hiện tại (T data trong exportExcel)
 * - cellValue: giá trị của field tương ứng cột
 */
public interface ExcelBgColorRule {
    /** Return true nếu cần áp style nền. */
    boolean matches(Object rowObject, Object cellValue);

    /** Màu nền cần áp (IndexedColors). */
    IndexedColors bgColor();
}

