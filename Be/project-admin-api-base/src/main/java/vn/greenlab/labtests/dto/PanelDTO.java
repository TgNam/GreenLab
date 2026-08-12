package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PanelDTO {
    private Integer id;
    private String code;
    private String name;
    private String shortDescription;
    private Integer panelCategoryId;
    private String panelCategoryName;
    private Integer discountTypeId;
    private String discountTypeName;
    private Integer testCount;
    private BigDecimal originalPrice;
    private BigDecimal sellingPrice;
    private BigDecimal discountAmount;
    private BigDecimal discountValue;
    private String createdAt;
    private String updatedAt;
    private List<TestDTO> tests;
}
