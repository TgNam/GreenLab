package vn.greenlab.model.output.administrator;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

import vn.greenlab.model.enums.Position;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
// Dành cho nhân viên của GreenLab
public class AdministratorOutput {

    private int id;
    private String user_name;
    private String password;
    private String salt;
    private String email;
    private String photo;
    private int status;
    private String phone;
    private String start_barcode;
    private String full_name;
    private Position position;
    private String position_name;
    private String area_id;
    private String work_position_id;
    private String work_group_id;
    private String department_id;
    private String department_short_name;
    private String work_area_id;
    private String work_area_short_name;
    private String token;
    private String digital_signature;
    private LocalDateTime create_time;
    private LocalDateTime update_time;
    private int manager_id;
    private String manager_username;
    private String manager_email;
    private String department_name;
    private String work_area_name;
    private String last_login_ip;
}
