package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitDTO {
    private Integer id;
    private String code;
    private String name;
    private String symbol;
    private Boolean isActive;
    private String createdAt;
}
