package vn.greenlab.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.SystemConfig;
import vn.greenlab.model.enums.SystemConfigKey;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends BaseRepository<SystemConfig, Long> {
    Optional<SystemConfig> findByKey(SystemConfigKey key);

    @Query("""
    SELECT sc FROM SystemConfig sc
    WHERE (:pKey IS NULL OR sc.key = :pKey)
      AND (:isActive IS NULL OR sc.active = :isActive)
      AND (:nameSearch IS NULL OR :nameSearch = ''
           OR LOWER(sc.name) LIKE LOWER(CONCAT('%', :nameSearch, '%')))
      AND (:valueSearch IS NULL OR :valueSearch = ''
           OR LOWER(sc.value) LIKE LOWER(CONCAT('%', :valueSearch, '%')))
      AND (
            :typeSort IS NULL
            OR (
                UPPER(:typeSort) NOT LIKE '%UPDATETIME%'
                AND (:timeFrom IS NULL OR sc.create_time >= :timeFrom)
                AND (:timeTo   IS NULL OR sc.create_time <= :timeTo)
            )
            OR (
                UPPER(:typeSort) LIKE '%UPDATETIME%'
                AND (:timeFrom IS NULL OR sc.update_time >= :timeFrom)
                AND (:timeTo   IS NULL OR sc.update_time <= :timeTo)
            )
          )
""")
    Page<SystemConfig> findByFilters(
            @Param("pKey") SystemConfigKey pKey,
            @Param("isActive") Boolean isActive,
            @Param("timeFrom") LocalDateTime timeFrom,
            @Param("timeTo") LocalDateTime timeTo,
            @Param("typeSort") String typeSort,
            @Param("nameSearch") String nameSearch,
            @Param("valueSearch") String valueSearch,
            Pageable pageable
    );



    void deleteByKey(SystemConfigKey key);
}
