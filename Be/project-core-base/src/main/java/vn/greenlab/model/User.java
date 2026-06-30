package vn.greenlab.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "user", indexes = {
    @Index(columnList = "email", name = "user_email_idx"),
    @Index(columnList = "phone", name = "user_phone_idx"),
    @Index(columnList = "create_time", name = "user_create_time_idx")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String fullName;

    private String phone;

    private String address;

    private String note;

    @Column(columnDefinition = "varchar(255) default '[]'")
    private String patientIds = "[]";

    private String photo;

    private Integer regSource;

    private String salt;

    @Column(columnDefinition = "bit(1) default 1")
    private Boolean status = Boolean.TRUE;

    private Integer type;

    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime createTime;

    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime updateTime;

    private String lastLoginIp;

    @Column(columnDefinition = "bit(1) default 0")
    private Boolean emailVerified = Boolean.FALSE;

    @Column(columnDefinition = "bit(1) default 0")
    private Boolean phoneVerified = Boolean.FALSE;

    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime lastLoginTime;
}
