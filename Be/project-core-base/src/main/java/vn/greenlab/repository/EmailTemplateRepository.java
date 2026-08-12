package vn.greenlab.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.EmailTemplate;
import vn.greenlab.model.enums.EmailOutboxType;

@Repository
public interface EmailTemplateRepository extends BaseRepository<EmailTemplate, Long> {

    @Query("SELECT e FROM EmailTemplate e WHERE (:id IS NULL OR e.id = :id) " +
            "AND (:createTimeFrom IS NULL OR e.createTime >= :createTimeFrom) " +
            "AND (:createTimeTo IS NULL OR e.createTime <= :createTimeTo) " +
            "AND (:name IS NULL OR e.name LIKE CONCAT('%', :name, '%')) " +
            "AND (:type IS NULL OR e.type = :type) " +
            "AND (:active IS NULL OR e.active = :active) ORDER BY e.createTime DESC")
    Page<EmailTemplate> findAllByFilters(
            @Param("id") Long id,
            @Param("createTimeFrom") LocalDateTime createTimeFrom,
            @Param("createTimeTo") LocalDateTime createTimeTo,
            @Param("name") String name,
            @Param("type") EmailOutboxType type,
            @Param("active") Boolean active,
            Pageable pageable);

    Optional<EmailTemplate> findByName(String name);

    List<EmailTemplate> findByActive(boolean active);

    @Query("SELECT e FROM EmailTemplate e WHERE e.type = :type AND e.active = :active")
    List<EmailTemplate> findByTypeAndActive(@Param("type") EmailOutboxType type, @Param("active") boolean active);
}
