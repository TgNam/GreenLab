package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestDTO {
    private Integer id;
    private String code;
    private String name;
    private String shortName;
    private String description;
    private String method;
    private Integer testCategoryId;
    private String testCategoryName;
    private Integer specimenTypeId;
    private String specimenTypeName;
    private Integer unitId;
    private String unitName;
    private String unitSymbol;
    private BigDecimal normalValueMin;
    private BigDecimal normalValueMax;
    private String normalValueText;
    private BigDecimal price;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
    private Boolean isPrimary;
}
