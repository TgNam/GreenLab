package vn.greenlab.model.excel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RowResult<T> {
    private int rowNumber; // Số thứ tự dòng (1-based)
    private T data; // Dữ liệu object
    private boolean success; // Thành công hay không
    private List<String> errors; // Danh sách lỗi của dòng này
}