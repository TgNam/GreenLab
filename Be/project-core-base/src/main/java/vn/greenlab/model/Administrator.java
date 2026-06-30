package vn.greenlab.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;

import com.fasterxml.jackson.annotation.JsonIgnore;

import vn.greenlab.model.enums.Position;


@Entity
@Table(name = "administrator", indexes = {
    @Index(columnList = "user_name", name = "user_name_idx"),
    @Index(columnList = "position", name = "position_idx"),
    @Index(columnList = "start_barcode", name = "start_barcode_idx"),
    @Index(columnList = "email", name = "email_idx"),
    @Index(columnList = "create_time", name = "create_time_idx"),
    @Index(columnList = "update_time", name = "update_time_idx"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
// Dành cho nhân viên của GreenLab
public class Administrator {

    @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    @Enumerated(EnumType.STRING)
    private Position position;
    private String area_id;
    private String work_position_id;
    private String work_group_id;
    private String department_id;
    private String work_area_id;
    private String token;
    private String digital_signature;
    //change create_time and update_time to datetime(3)
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime create_time;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime update_time;
    private String last_login_ip;

    // nhóm quyền phân cấp
    private String roleIds;

    /** Không đưa vào JSON Redis — tránh lazy/circular reference khi {@code RedisCacheComponent#put}. */
    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "administrator_role",
            joinColumns = @JoinColumn(name = "administrator_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            indexes = @Index(name = "idx_administrator_role_administrator_id", columnList = "administrator_id"))
    private List<Role> roles;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Administrator manager;

    @Column(columnDefinition = "varchar(32)")
    private String lost_password_code;

    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime change_password_time;
}