package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

public enum PartnerType {
    BV(1, "Bệnh viện/ TT Y tế"),
    PK(2, "Phòng khám"),
    BS(3, "Bác sĩ"),
    CTV(4, "Cộng tác viên"),
    NV(5, "Nhân viên Công ty"),
    NB(6, "Nội bộ"),
    KL(7, "Khách lẻ"),
    PKTY(8, "Phòng khám thú y"),
    ĐL(9, "Đại lý");

    private final int partner_type_id;
    private final String partner_type_name;

    PartnerType(int partner_type_id, String partner_type_name) {
        this.partner_type_id = partner_type_id;
        this.partner_type_name = partner_type_name;
    }

    public int getPartner_type_id() {
        return partner_type_id;
    }

    public String getPartner_type_name() {
        return partner_type_name;
    }

    public static Map<String, String> getPartnerTypeMap() {
        return Arrays.stream(PartnerType.values())
                .collect(Collectors.toMap(
                    PartnerType::name,
                    PartnerType::getPartner_type_name));
    }

    public static String getNameById(PartnerType partnerType) {
        return Arrays.stream(PartnerType.values())
                .filter(e -> e.equals(partnerType))
                .map(PartnerType::getPartner_type_name)
                .findFirst()
                .orElse(null);
    }
}
