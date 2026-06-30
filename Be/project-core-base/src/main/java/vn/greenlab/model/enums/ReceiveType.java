package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ReceiveType {

    KHONG_NHAN_KET_QUA(0, "Không nhận kết quả"),
    NHAN_KET_QUA_GIAY_TAI_NHA(1, "Nhận kết quả giấy tại nhà"),
    NHAN_QUA_ZALO_MESSAGE(2, "Nhận qua Zalo/Message"),
    NHAN_QUA_EMAIL(3, "Nhận qua Email"),
    TRA_CUU_QUA_WEBSITE(4, "Tra cứu qua website");

    private final int receive_type_id;
    private final String receive_type_name;

    ReceiveType(int receive_type_id, String receive_type_name) {
        this.receive_type_id = receive_type_id;
        this.receive_type_name = receive_type_name;
    }

    public int getReceive_type_id() {
        return receive_type_id;
    }

    public String getReceive_type_name() {
        return receive_type_name;
    }

    public static Map<String, String> getReceiveTypeMap() {
        return Collections.unmodifiableMap(
                Stream.of(ReceiveType.values())
                        .sorted(Comparator.comparing(ReceiveType::name))
                        .collect(Collectors.toMap(
                                ReceiveType::name, // key
                                ReceiveType::getReceive_type_name,                 // ✅ value
                                (a, b) -> a,
                                LinkedHashMap::new
                        )));
    }

}