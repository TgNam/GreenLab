package vn.greenlab.model.excel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelImportResult<T> {
    private int totalRows; // Tổng số dòng
    private int successCount; // Số dòng thành công
    private int errorCount; // Số dòng lỗi
    private List<RowResult<T>> results; // Danh sách kết quả từng dòng
    private List<String> globalErrors; // Lỗi chung (file extension, format, etc.)
    private Map<String, String> fieldToColumnNameMap; // Map field name -> column name (VD: "patientName" -> "HỌ VÀ TÊN")
    /** Các cột thực sự có trong file (theo thứ tự header) — dùng để trả về chỉ những cột user import. */
    private Set<String> importedFieldNames;
}

