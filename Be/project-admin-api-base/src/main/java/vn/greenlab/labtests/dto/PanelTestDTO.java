package vn.greenlab.labtests.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PanelTestDTO {
    private Integer id;
    private Integer panelId;
    private Integer testId;
    private String testCode;
    private String testName;
    private Boolean isPrimary;
    private String createdAt;
}
