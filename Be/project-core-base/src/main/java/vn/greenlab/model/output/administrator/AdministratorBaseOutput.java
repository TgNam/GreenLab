package vn.greenlab.model.output.administrator;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Builder
// Dành cho nhân viên của GreenLab
public class AdministratorBaseOutput {

    private int id;
    private String user_name;
    private String email;
    private String phone;
    private String start_barcode;
    private String full_name;

    public AdministratorBaseOutput(int id, String user_name, String email, String phone, String start_barcode, String full_name) {
        this.id = id;
        this.user_name = user_name;
        this.email = email;
        this.phone = phone;
        this.start_barcode = start_barcode;
        this.full_name = full_name;
    }
}
