package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PanelCategoryDTO {
    private Integer id;
    private String code;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean isFeatured;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}
