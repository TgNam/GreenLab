package vn.greenlab.model.input.email_template;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.greenlab.model.enums.EmailOutboxType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Model tìm kiếm mẫu email")
public class EmailTemplateSearch {

    @Schema(description = "Trang", example = "1")
    @Builder.Default
    private int page = 1;

    @Schema(description = "Số bản ghi mỗi trang", example = "50")
    @Builder.Default
    private int size = 50;

    @Schema(description = "ID mẫu email")
    private Long id;

    @Schema(description = "Từ thời gian tạo", example = "2026-03-01")
    private String from_time;

    @Schema(description = "Đến thời gian tạo", example = "2026-03-31")
    private String to_time;

    @Schema(description = "Tên mẫu")
    private String name;

    @Schema(description = "Loại mẫu email")
    private EmailOutboxType type;

    @Schema(description = "Trạng thái active")
    private Boolean active;
}
