package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum ResultType {
    RS_1(1, "KQ XÉT NGHIỆM", 1, true, 0),
    RS_2(2, "KQ DOUBLTEST", 2, true, 3),
    RS_3(3, "KQ TRIPLTEST", 3, true, 3),
    RS_4(4, "KQ SLSS", 4, true, 1),
    RS_5(5, "KQ PCR - HPV Type", 5, true, 2),
    RS_6(6, "KQ PCR - CHL-NGN", 6, true, 2),
    RS_7(7, "KQ PCR - HPV HIGH-LOW RISK", 7, true, 2),
    RS_8(8, "KQ PCR - HPV Cobas", 8, true, 2),
    RS_9(9, "KQ PCR - HBV", 9, true, 2),

    RS_10(10, "KQ PCR - HLA", 10, true, 2),
    RS_11(11, "KQ PCR - HBV ĐL", 11, true, 2),
    RS_12(12, "KQ PCR - 12VK", 12, true, 2),
    RS_13(13, "KQ - HBV Cobas5800", 13, true, 2),
    RS_14(14, "KQ PCR - HSV Type", 14, true, 2),
    RS_15(15, "KQ PCR - HCV", 15, true, 2),
    RS_16(16, "KQ PCR - HPV 41 Type", 16, true, 2),
    RS_17(17, "KQ Thalas", 17, true, 2),
    RS_20(20, "KQ DI TRUYỀN", 20, true, 4),
    RS_21(21, "KQ TSG", 21, true, 3),
    RS_99(99, "KQ dạng FILE", 99, true, 99),
    RS_100(100, "Thông tin đính kèm", 100, true, 99),
    ;

    private final int result_type_id;
    private final String result_type_name;
    private final int order_number;
    private final boolean active;
    private final int result_group_id;

    ResultType(int result_type_id, String result_type_name, int order_number, boolean active, int result_group_id) {
        this.result_type_id = result_type_id;
        this.result_type_name = result_type_name;
        this.order_number = order_number;
        this.active = active;
        this.result_group_id = result_group_id;
    }

    public int getResult_type_id() {
        return result_type_id;
    }

    public String getResult_type_name() {
        return result_type_name;
    }

    public int getOrder_number() {
        return order_number;
    }

    public boolean isActive() {
        return active;
    }

    public int getResult_group_id() {
        return result_group_id;
    }

    public static Map<ResultType, String> getResultTypeMap() {
        return Arrays.stream(ResultType.values())
                .collect(Collectors.toMap(
                        Function.identity(), // key = enum
                        ResultType::getResult_type_name // value = name
                ));
    }

    public static ResultType fromId(int id) {
        for (ResultType rt : values()) {
            if (rt.getResult_type_id() == id) {
                return rt;
            }
        }
        return null; // hoặc throw exception nếu cần strict
    }
}