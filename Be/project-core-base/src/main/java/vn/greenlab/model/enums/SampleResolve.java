package vn.greenlab.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum SampleResolve {
// 1	Đạt - Chấp nhận
// 2	Thông báo cho NV DVKH
// 3	Thông báo cho đơn vị gửi mẫu
// 4	Thông báo cho bệnh nhân
// 5	Thông báo cho NV Kinh doanh phụ trách
// 6	Thông báo cho NV bàn giao mẫu
// 7	Thông báo cho NV DVKH + KD
// 8	Thông báo cho NV DVKH + NV bàn giao mẫu 
// 9	Thông báo cho NV NV bàn giao mẫu + KD
// 10	Thông báo cho NV DVKH + NV bàn giao mẫu + KD

    SAMPLE_RESOLVE_1(1, "Đạt - Chấp nhận"),
    SAMPLE_RESOLVE_2(2, "Thông báo cho NV DVKH"),
    SAMPLE_RESOLVE_3(3, "Thông báo cho đơn vị gửi mẫu"),
    SAMPLE_RESOLVE_4(4, "Thông báo cho bệnh nhân"),
    SAMPLE_RESOLVE_5(5, "Thông báo cho NV Kinh doanh phụ trách"),
    SAMPLE_RESOLVE_6(6, "Thông báo cho NV bàn giao mẫu"),
    SAMPLE_RESOLVE_7(7, "Thông báo cho NV DVKH + KD"),
    SAMPLE_RESOLVE_8(8, "Thông báo cho NV DVKH + NV bàn giao mẫu"),
    SAMPLE_RESOLVE_9(9, "Thông báo cho NV NV bàn giao mẫu + KD"),
    SAMPLE_RESOLVE_10(10, "Thông báo cho NV DVKH + NV bàn giao mẫu + KD");

    private final int sample_resolve_id;
    private final String sample_resolve_name;
    public static final Map<SampleResolve, String> getSampleResolve = Collections.unmodifiableMap((Stream.of(values()).collect(Collectors.toMap((e) -> e, SampleResolve::getSample_resolve_name))));

    SampleResolve(int sample_resolve_id, String sample_resolve_name) {
        this.sample_resolve_id = sample_resolve_id;
        this.sample_resolve_name = sample_resolve_name;
    }

    @JsonValue
    public int getSample_resolve_id() {
        return sample_resolve_id;
    }

    public String getSample_resolve_name() {
        return sample_resolve_name;
    }

    @JsonCreator
    public static SampleResolve fromId(int id) {
        for (SampleResolve v : values()) {
            if (v.sample_resolve_id == id) return v;
        }
        throw new IllegalArgumentException("Unknown SampleResolve id: " + id);
    }
}
