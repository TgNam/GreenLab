package vn.greenlab.model.excel;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelExportResult<T> {
    private int totalRows; // Tổng số dòng export
    private int successCount; // Số dòng export thành công
    private int errorCount; // Số dòng export lỗi
    private List<RowResult<T>> results; // Danh sách kết quả từng dòng
    private byte[] excelBytes; // File Excel dạng byte[]
}
