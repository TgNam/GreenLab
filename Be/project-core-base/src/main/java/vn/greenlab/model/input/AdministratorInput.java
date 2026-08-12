package vn.greenlab.model.input;

import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministratorInput {
    private String user_name;
    private String password;
    private String salt;
    private String email;
    private MultipartFile photo;
    private MultipartFile digital_signature;
    private int status;
    private String phone;
    private String start_barcode;
    private String full_name;
    private String position;
    private String area_id;
    private String work_position_id;
    private String work_group_id;
    private String department_id;
    private String work_area_id;
    private String token;
    private long create_time;
    private long update_time;
    private boolean clear_photo;
    private boolean clear_digital_signature;
}
