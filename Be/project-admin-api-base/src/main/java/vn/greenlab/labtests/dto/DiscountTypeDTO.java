package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountTypeDTO {
    private Integer id;
    private String code;
    private String name;
    private String calculationMethod;
    private String createdAt;
}
