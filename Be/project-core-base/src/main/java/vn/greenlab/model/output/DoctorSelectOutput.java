package vn.greenlab.model.output;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class DoctorSelectOutput {

    private long id;
    private String code;
    private String doctorName;
    private int city_id;
}
