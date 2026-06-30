package vn.greenlab.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum SampleStatus {
    
// 1	Đạt       	0
// 2	Mẫu đông  	1
// 3	Mẫu vỡ hồng cầu	1
// 4	Mẫu sai thể tích	1
// 5	Mẫu lấy không đúng loại	1
// 6	Mẫu hỏng	1
// 7	Mẫu ghi sai tên	1
// 8	Máu dán/ghi sai mã	1
// 9	Mẫu lấy sai ống 	1
// 10	Mẫu bị đổ hết	1
// 11	Mẫu không ghi tên	1
// 12	Mẫu không ghi chú XN	1
// 13	Mẫu lấy thiếu ống	1
// 14	Mấy bị thối hỏng	1
// 15	Mẫu dịch bị khô	1
// 16	Thiếu phiếu thông tin	1
// 17	Khác	1
// 18	Mẫu SLSS giọt máu còn ướt	1
// 19	Mấu SLSS thiếu giờ	1
// 20	Mẫu SLSS không đủ giọt	1
// 21	Mẫu SLSS giọt trồng lên nhau	1
// 22	Phiếu SLSS thiếu thông tin	1
// 23	Phiếu SLSS sai gói bệnh	1
// 29	Thiếu ảnh	1
// 30	Mẫu QuantiFERON quá giờ	1
// 32	Mẫu tinh dịch đồ quá giờ	1
// 33	Mẫu ít tế bào	1
// 34	Mẫu cần kiểm tra lại	1
// 35	Mẫu nhiều máu	1
// 36	Mẫu nồng độ cfDNA thấp	1
// 37	Mẫu tạp nhiễm	1

    SAMPLE_STATUS_1(1, "Đạt", 0),
    SAMPLE_STATUS_2(2, "Mẫu đông", 1),
    SAMPLE_STATUS_3(3, "Mẫu vỡ hồng cầu", 1),
    SAMPLE_STATUS_4(4, "Mẫu sai thể tích", 1),
    SAMPLE_STATUS_5(5, "Mẫu lấy không đúng loại", 1),
    SAMPLE_STATUS_6(6, "Mẫu hỏng", 1),
    SAMPLE_STATUS_7(7, "Mẫu ghi sai tên", 1),
    SAMPLE_STATUS_8(8, "Máu dán/ghi sai mã", 1),
    SAMPLE_STATUS_9(9, "Mẫu lấy sai ống", 1),
    SAMPLE_STATUS_10(10, "Mẫu bị đổ hết", 1),
    SAMPLE_STATUS_11(11, "Mẫu không ghi tên", 1),
    SAMPLE_STATUS_12(12, "Mẫu không ghi chú XN", 1),
    SAMPLE_STATUS_13(13, "Mẫu lấy thiếu ống", 1),
    SAMPLE_STATUS_14(14, "Mấy bị thối hỏng", 1),
    SAMPLE_STATUS_15(15, "Mẫu dịch bị khô", 1),
    SAMPLE_STATUS_16(16, "Thiếu phiếu thông tin", 1),
    SAMPLE_STATUS_17(17, "Khác", 1),
    SAMPLE_STATUS_18(18, "Mẫu SLSS giọt máu còn ướt", 1),
    SAMPLE_STATUS_19(19, "Mấu SLSS thiếu giờ", 1),
    SAMPLE_STATUS_20(20, "Mẫu SLSS không đủ giọt", 1),
    SAMPLE_STATUS_21(21, "Mẫu SLSS giọt trồng lên nhau", 1),
    SAMPLE_STATUS_22(22, "Phiếu SLSS thiếu thông tin", 1),
    SAMPLE_STATUS_23(23, "Phiếu SLSS sai gói bệnh", 1),
    SAMPLE_STATUS_24(24, "Thiếu ảnh", 1),
    SAMPLE_STATUS_25(25, "Mẫu QuantiFERON quá giờ", 1),
    SAMPLE_STATUS_26(26, "Mẫu tinh dịch đồ quá giờ", 1),
    SAMPLE_STATUS_27(27, "Mẫu ít tế bào", 1),
    SAMPLE_STATUS_28(28, "Mẫu cần kiểm tra lại", 1),
    SAMPLE_STATUS_29(29, "Mẫu nhiều máu", 1),
    SAMPLE_STATUS_30(30, "Mẫu nồng độ cfDNA thấp", 1),
    SAMPLE_STATUS_31(31, "Mẫu tạp nhiễm", 1)
    ;

    private final int sample_status_id;
    private final String sample_status_name;
    private final int is_error;
    public static final Map<SampleStatus, String> getSampleStatus = Collections.unmodifiableMap((Stream.of(values()).collect(Collectors.toMap((e) -> e, SampleStatus::getSample_status_name))));

    SampleStatus(int sample_status_id, String sample_status_name, int is_error) {
        this.sample_status_id = sample_status_id;
        this.sample_status_name = sample_status_name;
        this.is_error = is_error;
    }

    @JsonValue
    public int getSample_status_id() {
        return sample_status_id;
    }

    public String getSample_status_name() {
        return sample_status_name;
    }

    public int getIs_error() {
        return is_error;
    }

    @JsonCreator
    public static SampleStatus fromId(int id) {
        for (SampleStatus v : values()) {
            if (v.sample_status_id == id) return v;
        }
        throw new IllegalArgumentException("Unknown SampleStatus id: " + id);
    }
}
