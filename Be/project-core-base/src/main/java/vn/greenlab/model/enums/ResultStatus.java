package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

public enum ResultStatus {
//     CAL - KQ Calib
// DEL - Hủy kết quả
// E00 - Chưa có SID
// E01 - Chưa có chỉ định
// E02 - Cập nhật lỗi
// E03 - XN đã có kết quả
// E04 - Chưa có mẫu
// E05 - Đã valid cấp 2
// E06 - Kết quả lỗi
// QC - KQ QC
// QCU - Đã cập nhật KQ QC
// QE - Nhập QC lỗi
// REV - Cần xem lại
// UPL - Đã upload
// VAL - Đã chấp nhận

    CAL("KQ Calib"),
    DEL("Hủy kết quả"),
    E00("Chưa có SID"),
    E01("Chưa có chỉ định"),
    E02("Cập nhật lỗi"),
    E03("XN đã có kết quả"),
    E04("Chưa có mẫu"),
    E05("Đã valid cấp 2"),
    E06("Kết quả lỗi"),
    QC("KQ QC"),
    QCU("Đã cập nhật KQ QC"),
    QE("Nhập QC lỗi"),
    REV("Cần xem lại"),
    UPL("Đã upload"),
    VAL("Đã chấp nhận"),
    ;

    private final String status;

    ResultStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public static Map<String, String> toMap() {
        return Arrays.stream(ResultStatus.values())
                .collect(Collectors.toMap(ResultStatus::name, (e) -> e.name() + " - " + e.getStatus()));
    }
}