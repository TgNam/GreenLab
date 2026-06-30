package vn.greenlab.model.enums;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum Position {

    BAC_SI("Bác sỹ"),
    CHUYEN_VIEN_LAY_MAU("Chuyên viên lấy mẫu"),
    GIAM_DOC("Giám đốc"),
    KY_THUAT_VIEN("Kỹ thuật viên"),
    KY_THUAT_VIEN_TRUONG("Kỹ thuật viên trưởng"),
    NHAN_VIEN("Nhân viên"),
    NHAN_VIEN_LAI_XE("Nhân viên lái xe"),
    NHAN_VIEN_LAP_TRINH("Nhân viên lập trình"),
    NHAN_VIEN_TONG_DAI("Nhân viên tổng đài"),
    PHOPHONG("Phó phòng"),
    PHU_TRACH_ATSH("Phụ trách ATSH"),
    PHU_TRACHA_CM("Phụ trách CM"),
    QUAN_LY_CHAT_LUONG("Quản lý chất lượng"),
    QUAN_LY_CHUYEN_MON("Quản lý chuyên môn"),
    QUAN_LY_KINH_DOANH_KHACH_LE("Quản lý kinh doanh khách lẻ"),
    QUAN_LY_PHONG_KHAM("Quản lý phòng khám"),
    SALES_ADMIN("Sales admin"),
    TRUONG_PHONG("Trưởng phòng"),
    ;

    private final String position_name;

    Position(String position_name) {
        this.position_name = position_name;
    }

    public String getPosition_name() {
        return position_name;
    }

    public static final Map<Position, String> getPositions = Collections.unmodifiableMap(
        Stream.of(values())
                .sorted(Comparator.comparing(Position::name))
                .collect(Collectors.toMap(
                        e -> e,
                        Position::getPosition_name,
                        (a, b) -> a,
                        LinkedHashMap::new)));

    public static Position convertToPosition(String positionName) {
        try {
            switch (positionName.toUpperCase()) {
                case "BÁC SỸ":
                    return Position.BAC_SI;
                case "CHUYÊN VIÊN LẤY MẪU":
                    return Position.CHUYEN_VIEN_LAY_MAU;
                case "CHUYỂN VIÊN LẤY MẪU":
                    return Position.CHUYEN_VIEN_LAY_MAU;
                case "GIÁM ĐỐC":
                    return Position.GIAM_DOC;
                case "KỸ THUẬT VIÊN":
                    return Position.KY_THUAT_VIEN;
                case "KỸ THUẬT VIÊN TRƯỞNG":
                    return Position.KY_THUAT_VIEN_TRUONG;
                case "NHÂN VIÊN":
                    return Position.NHAN_VIEN;
                case "NHÂN VIÊN LÁI XE":
                    return Position.NHAN_VIEN_LAI_XE;
                case "NHÂN VIÊN LẬP TRÌNH":
                    return Position.NHAN_VIEN_LAP_TRINH;
                case "NHÂN VIÊN TỔNG ĐÀI":
                    return Position.NHAN_VIEN_TONG_DAI;
                case "PHÓ PHÒNG":
                    return Position.PHOPHONG;
                case "PHỤ TRÁCH ATSH":
                    return Position.PHU_TRACH_ATSH;
                case "PHỤ TRÁCH CM":
                    return Position.PHU_TRACHA_CM;
                case "QUẢN LÝ CHẤT LƯỢNG":
                    return Position.QUAN_LY_CHAT_LUONG;
                case "QUẢN LÝ CHUYÊN MÔN":
                    return Position.QUAN_LY_CHUYEN_MON;
                case "QUẢN LÝ KINH DOANH KHÁCH LẺ":
                    return Position.QUAN_LY_KINH_DOANH_KHACH_LE;
                case "QUẢN LÝ PHÒNG KHÁM":
                    return Position.QUAN_LY_PHONG_KHAM;
                case "SALES ADMIN":
                    return Position.SALES_ADMIN;
                case "TRƯỞNG PHÒNG":
                    return Position.TRUONG_PHONG;
                default:
                    return Position.NHAN_VIEN;
            }
        } catch (Exception e) {
            return null;
        }
    }
}
