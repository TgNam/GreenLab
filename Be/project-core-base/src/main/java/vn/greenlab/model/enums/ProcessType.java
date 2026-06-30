package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

public enum ProcessType {
    LM(1, "Lấy mẫu", "Lấy - Thu mẫu"),
    TM(2, "Thu mẫu", "Lấy - Thu mẫu"),
    KQ(3, "Trả KQ", "Gửi đồ - KQ"),
    GD(4, "Gửi đồ", "Gửi đồ - KQ"),
    GM(5, "Gửi mẫu", "Gửi mẫu"),
    KQT(6, "Thu mẫu + gửi thùng (KQ)", "Lấy - Thu mẫu"),
    GT(7, "Gửi thùng", "Gửi đồ - KQ"),
    TR(8, "Trực phòng khám", "Trực phòng khám"),
    CPN(9, "Chuyển phát nhanh", "Chuyển phát nhanh"),
    ;

    private final int process_type_id;
    private final String process_type_name;
    private final String process_type_name2;

    ProcessType(int process_type_id, String process_type_name, String process_type_name2) {
        this.process_type_id = process_type_id;
        this.process_type_name = process_type_name;
        this.process_type_name2 = process_type_name2;
    }

    public int getProcess_type_id() {
        return process_type_id;
    }
    
    public String getProcess_type_name() {
        return process_type_name;
    }

    public String getProcess_type_name2() {
        return process_type_name2;
    }

    public static Map<String, String> getProcessTypeNameMap() {
        return Arrays.stream(ProcessType.values())
                .collect(Collectors.toMap(
                        ProcessType::name,              // key: LM, TM, GT...
                        ProcessType::getProcess_type_name // value: "Lấy mẫu", "Gửi thùng"
                ));
    }
}
