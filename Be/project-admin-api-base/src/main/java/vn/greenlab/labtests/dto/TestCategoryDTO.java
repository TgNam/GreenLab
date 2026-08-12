package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCategoryDTO {
    private Integer id;
    private String code;
    private String name;
    private String description;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}
