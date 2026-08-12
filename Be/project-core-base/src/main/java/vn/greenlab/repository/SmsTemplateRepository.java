package vn.greenlab.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.SmsTemplate;
import vn.greenlab.model.enums.SmsOutboxType;
import vn.greenlab.model.enums.SmsRecipientType;

@Repository
public interface SmsTemplateRepository extends BaseRepository<SmsTemplate, Long> {

    @Query("SELECT s FROM SmsTemplate s WHERE (:id IS NULL OR s.id = :id) " +
            "AND (:createTimeFrom IS NULL OR s.createTime >= :createTimeFrom) " +
            "AND (:createTimeTo IS NULL OR s.createTime <= :createTimeTo) " +
            "AND (:name IS NULL OR s.name LIKE CONCAT('%', :name, '%')) " +
            "AND (:type IS NULL OR s.type = :type) " +
            "AND (:recipientType IS NULL OR s.recipientType = :recipientType) " +
            "AND (:active IS NULL OR s.active = :active) ORDER BY s.createTime DESC")
    Page<SmsTemplate> findAllByFilters(
            @Param("id") Long id,
            @Param("createTimeFrom") LocalDateTime createTimeFrom,
            @Param("createTimeTo") LocalDateTime createTimeTo,
            @Param("name") String name,
            @Param("type") SmsOutboxType type,
            @Param("recipientType") SmsRecipientType recipientType,
            @Param("active") Boolean active,
            Pageable pageable);

    Optional<SmsTemplate> findByName(String name);

    List<SmsTemplate> findByActive(boolean active);

    @Query("SELECT s FROM SmsTemplate s WHERE s.type = :type AND s.active = :active")
    List<SmsTemplate> findByTypeAndActive(@Param("type") SmsOutboxType type, @Param("active") boolean active);
}
