package vn.greenlab.model.output.city;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityOutput {
    private int id;
    private String name;
    private String code;
    private String region;
    private int parent_id;
    private String parent_name;
}
