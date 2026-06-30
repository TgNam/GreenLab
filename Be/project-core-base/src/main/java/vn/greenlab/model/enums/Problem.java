package vn.greenlab.model.enums;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum Problem {
    // 0 Đã xử lý xong
    // 1 Thiếu mẫu
    // 2 Thiếu phiếu khai
    // 3 Thiếu thông tin
    // 4 Huỷ mẫu
    // 5 Kiểm tra lại chỉ định
    // 6 Vỡ hồng cầu, lấy mẫu lại
    // 7 Mẫu đông
    // 8 Vật tư hết hạn
    // 9 Sai thể tích
    // 10 Mẫu ít tế bào
    // 11 Lấy lại mẫu kiểm tra lại
    // 12 Lưu mẫu
    // 12 Mẫu nhiều máu
    // 13 Huyết tương đục
    // 14 Tiểu cầu vón
    // 15 Nắp sai ống
    // 16 Mẫu lấy k đúng loại
    // 17 Mẫu thối/hỏng
    // 18 Mẫu ghi sai tên
    // 19 Mẫu dán/ ghi sai mã
    // 20 Mẫu bị đổ
    // 21 Mẫu không ghi tên
    // 22 Mẫu thiếu/ sai ghi chú xn ( thiếu/ sai ghi ký hiệu trên ống)
    // 23 Mẫu dịch bị khô
    // 24 Mẫu quá giờ
    // 25 Mẫu dán code sai quy cách
    // 26 Mẫu ức chế
    // 27 Khác
    PROBLEM_0(0, "Đã xử lý xong", 0),
    PROBLEM_1(1, "Thiếu mẫu", 1),
    PROBLEM_2(2, "Thiếu phiếu khai", 1),
    PROBLEM_3(3, "Thiếu thông tin", 1),
    PROBLEM_4(4, "Huỷ mẫu", 1),
    PROBLEM_5(5, "Kiểm tra lại chỉ định", 1),
    PROBLEM_6(6, "Vỡ hồng cầu, lấy mẫu lại", 1),
    PROBLEM_7(7, "Mẫu đông", 1),
    PROBLEM_8(8, "Vật tư hết hạn", 1),
    PROBLEM_9(9, "Sai thể tích", 1),
    PROBLEM_10(10, "Mẫu ít tế bào", 1),
    PROBLEM_11(11, "Lấy lại mẫu kiểm tra lại", 1),
    PROBLEM_12(12, "Lưu mẫu", 1),
    PROBLEM_13(13, "Mẫu nhiều máu", 1),
    PROBLEM_14(14, "Huyết tương đục", 1),
    PROBLEM_15(15, "Tiểu cầu vón", 1),
    PROBLEM_16(16, "Nắp sai ống", 1),
    PROBLEM_17(17, "Mẫu lấy k đúng loại", 1),
    PROBLEM_18(18, "Mẫu thối/hỏng", 1),
    PROBLEM_19(19, "Mẫu ghi sai tên", 1),
    PROBLEM_20(20, "Mẫu dán/ ghi sai mã", 1),
    PROBLEM_21(21, "Mẫu bị đổ", 1),
    PROBLEM_22(22, "Mẫu không ghi tên", 1),
    PROBLEM_23(23, "Mẫu thiếu/ sai ghi chú xn ( thiếu/ sai ghi ký hiệu trên ống)", 1),
    PROBLEM_24(24, "Mẫu dịch bị khô", 1),
    PROBLEM_25(25, "Mẫu dán code sai quy cách", 1),
    PROBLEM_26(26, "Mẫu ức chế", 1),
    PROBLEM_27(27, "Khác", 1);

    private final int problem_id;
    private final String problem_name;
    private final int status;

    Problem(int problem_id, String problem_name, int status) {
        this.problem_id = problem_id;
        this.problem_name = problem_name;
        this.status = status;
    }

    public int getProblem_id() {
        return problem_id;
    }

    public String getProblem_name() {
        return problem_name;
    }

    public int getStatus() {
        return status;
    }

    // public static final Map<Problem, String> getProblems =
    // Collections.unmodifiableMap(
    // Stream.of(values()).filter(e -> e.getStatus() == 1)
    // .collect(Collectors.toMap(

    // e -> e,
    // e -> e.getProblem_name())));

    public static final Map<Problem, String> getProblems = Collections.unmodifiableMap(
            Stream.of(values())
                .filter(e -> e.getStatus() == 1)
                    .sorted(Comparator.comparing(Problem::name))
                    .collect(Collectors.toMap(
                            e -> e,
                            Problem::getProblem_name,
                            (a, b) -> a,
                            LinkedHashMap::new)));

    public static final Map<String, Problem> getProblems2 = Collections.unmodifiableMap(
            Stream.of(values()).filter(e -> e.getStatus() == 1)
                    .collect(Collectors.toMap(
                            e -> e.getProblem_name(),
                            e -> e

                    )));
}
