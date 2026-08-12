package vn.greenlab.model.enums;

public enum LogType {

    // logType
    // 2 Sửa mã bác sĩ + TTHC ảnh hưởng KQ 2 (map logGroup = 2)
    // 3 Sửa TTHC ảnh hưởng KQ 2 (map logGroup = 2)
    // 4 Sửa TTHC không ảnh hưởng KQ 2 (map logGroup = 2)
    // 5 Xoá sau 10p + chưa thu tiền và chạy XN 3 (map logGroup = 3)
    // 6 Xoá khi đã thu tiền + chưa chạy XN 3 (map logGroup = 3)
    // 7 Xoá khi chưa thu tiền + chưa chạy XN 3 (map logGroup = 3)
    // 8 Xoá khi đã thu tiền + đã chạy XN 3 (map logGroup = 3)
    // 9 Thêm khi đã thu tiền + chưa duyệt KQ 1 (map logGroup = 1)
    // 10 Thêm khi đã thu tiền + đã duyệt KQ 1 (map logGroup = 1)
    // 11 Thêm khi chưa thu tiền + đã duyệt KQ 1 (map logGroup = 1)
    // 12 Đánh dấu xoá dịch vụ 3 (map logGroup = 3)
    // 13 Bỏ đánh dấu xoá dịch vụ 3 (map logGroup = 3)
    // 14 Thay đổi trạng thái Đủ KQ 4 (map logGroup = 4)
    // logGroup
    // 1 Thêm dịch vụ
    // 2 Sửa thông tin khách hàng
    // 3 Xoá dịch vụ

    LOG_1(1, "Sửa mã bác sĩ + TTHC không ảnh hưởng KQ", 2, "Sửa thông tin khách hàng"),
    LOG_2(2, "Sửa mã bác sĩ + TTHC ảnh hưởng KQ", 2, "Sửa thông tin khách hàng"),
    LOG_3(3, "Sửa TTHC ảnh hưởng KQ", 2, "Sửa thông tin khách hàng"),
    LOG_4(4, "Sửa TTHC không ảnh hưởng KQ", 2, "Sửa thông tin khách hàng"),
    LOG_5(5, "Xoá sau 10p + chưa thu tiền và chạy XN", 3, "Xoá dịch vụ"),
    LOG_6(6, "Xoá khi đã thu tiền + chưa chạy XN", 3, "Xoá dịch vụ"),
    LOG_7(7, "Xoá khi chưa thu tiền + chưa chạy XN", 3, "Xoá dịch vụ"),
    LOG_8(8, "Xoá khi đã thu tiền + đã chạy XN", 3, "Xoá dịch vụ"),
    LOG_9(9, "Thêm khi đã thu tiền + chưa duyệt KQ", 1, "Thêm dịch vụ"),
    LOG_10(10, "Thêm khi đã thu tiền + đã duyệt KQ", 1, "Thêm dịch vụ"),
    LOG_11(11, "Thêm khi chưa thu tiền + đã duyệt KQ", 1, "Thêm dịch vụ"),
    LOG_12(12, "Đánh dấu xoá dịch vụ", 3, "Xoá dịch vụ"),
    LOG_13(13, "Bỏ đánh dấu xoá dịch vụ", 3, "Xoá dịch vụ"),
    LOG_14(14, "Thay đổi trạng thái Đủ KQ", 4, "Thay đổi trạng thái Đủ KQ"),
    LOG_15(15, "Thêm mới hồ sơ bệnh nhân", 1, "Thêm dịch vụ"),
    LOG_16(16, "Cập nhật hồ sơ bệnh nhân", 1, "Thêm dịch vụ"),
    ;

    private final int log_type_id;
    private final String log_type_name;
    private final int log_group_id;
    private final String log_group_name;

    LogType(int log_type_id, String log_type_name, int log_group_id, String log_group_name) {
        this.log_type_id = log_type_id;
        this.log_type_name = log_type_name;
        this.log_group_id = log_group_id;
        this.log_group_name = log_group_name;
    }

    public int getLog_type_id() {
        return log_type_id;
    }

    public String getLog_type_name() {
        return log_type_name;
    }

    public int getLog_group_id() {
        return log_group_id;
    }

    public String getLog_group_name() {
        return log_group_name;
    }
}