package vn.greenlab.model.output;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistrictOutput {
    private int id;
    private String name;
    private int status;
    private int city_id;
    private String city_name; // Tên tỉnh/thành phố từ join với city
}
