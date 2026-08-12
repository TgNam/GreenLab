package vn.greenlab.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
@Entity
@Table(name = "ward")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Ward {
    @Id
    private int id;
    private String name;
    private int status;
    private int district_id;
    private int parent_id;
    private int city_id;
    private int vtp_id;
}