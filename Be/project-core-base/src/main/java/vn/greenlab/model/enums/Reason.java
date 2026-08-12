package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public enum Reason {
// 1	Xóa do vào sai chỉ định
// 2	Xóa do đổi dịch vụ
// 3	Xóa do mẫu hỏng
// 4	Xóa do nguyên nhân khác
// 5	Sửa thông tin KH do phòng khám/BS
// 6	Sửa thông tin KH do nhân viên nhập sai
// 7	Bổ sung dịch vụ làm thêm
// 8	Bổ sung dịch vụ nhập thiếu
    REASON_1(1, "Xóa do vào sai chỉ định"),
    REASON_2(2, "Xóa do đổi dịch vụ"),
    REASON_3(3, "Xóa do mẫu hỏng"),
    REASON_4(4, "Xóa do nguyên nhân khác"),
    REASON_5(5, "Sửa thông tin KH do phòng khám/BS"),
    REASON_6(6, "Sửa thông tin KH do nhân viên nhập sai"),
    REASON_7(7, "Bổ sung dịch vụ làm thêm"),
    REASON_8(8, "Bổ sung dịch vụ nhập thiếu");

    private final int reason_id;
    private final String reason_name;

    Reason(int reason_id, String reason_name) {
        this.reason_id = reason_id;
        this.reason_name = reason_name;
    }

    public int getReason_id() {
        return reason_id;
    }

    public String getReason_name() {
        return reason_name;
    }

    public static Map<String, String> getReasonsForDelete() {
        return Arrays.stream(Reason.values())
            .filter(reason -> reason.getReason_id() == 1 || reason.getReason_id() == 2 || reason.getReason_id() == 3 || reason.getReason_id() == 4)
            .collect(Collectors.toMap(Reason::name, Reason::getReason_name));
    }

    public static Map<String, String> getReasonsForCreate() {
        return Arrays.stream(Reason.values())
        .filter(reason -> reason.getReason_id() == 7 || reason.getReason_id() == 8)
        .collect(Collectors.toMap(Reason::name, Reason::getReason_name));
    }

    public static Map<String, String> getReasonsForEdit() {
        return Arrays.stream(Reason.values())
        .filter(reason -> reason.getReason_id() == 5 || reason.getReason_id() == 6)
        .collect(Collectors.toMap(Reason::name, Reason::getReason_name));
    }
}
