package vn.greenlab.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.greenlab.model.enums.SmsOutboxType;
import vn.greenlab.model.enums.SmsRecipientType;

@Entity
@Table(name = "sms_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SmsTemplate implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    @Column(columnDefinition = "TEXT")
    private String content;
    private boolean active;
    @Enumerated(EnumType.STRING)
    private SmsOutboxType type;
    @Enumerated(EnumType.STRING)
    private SmsRecipientType recipientType;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime createTime;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime updateTime;
}
