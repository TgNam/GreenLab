package vn.greenlab.model.output;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WardOutput {
    private int id;
    private String name;
    private int status;
    private int district_id;
    private int city_id; // ID của tỉnh/thành phố mới (city_id > 0 = phường/xã mới, city_id = 0 = phường/xã cũ)
    private String district_name; // Tên quận/huyện từ join với district
    private String city_name; // Tên tỉnh/thành phố từ join với city
}