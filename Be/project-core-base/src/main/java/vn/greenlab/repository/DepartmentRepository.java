package vn.greenlab.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.Department;

@Repository
public interface DepartmentRepository extends BaseRepository<Department, Long> {

        @Query("SELECT d FROM Department d WHERE d.short_name = :shortName")
        Optional<Department> findByShort_name(String shortName);

        @Query("SELECT d FROM Department d WHERE d.short_name in :shortName")
        List<Department> findAllByShort_nameIn(List<String> shortName);

        @Query("SELECT d FROM Department d WHERE (:id IS NULL OR d.id = :id) " +
                        "AND ((:timeType = 0 AND (:createTimeFrom IS NULL OR d.create_time >= :createTimeFrom)) " +
                        "OR (:timeType = 1 AND (:createTimeFrom IS NULL OR d.update_time >= :createTimeFrom))) " +
                        "AND ((:timeType = 0 AND (:createTimeTo IS NULL OR d.create_time <= :createTimeTo)) " +
                        "OR (:timeType = 1 AND (:createTimeTo IS NULL OR d.update_time <= :createTimeTo))) " +
                        "AND (:name IS NULL OR d.name LIKE CONCAT('%', :name, '%')) " +
                        "AND (:shortName IS NULL OR d.short_name LIKE CONCAT('%', :shortName, '%')) " +
                        "AND (:status IS NULL OR d.status = :status) ORDER BY d.create_time DESC")
        Page<Department> findAllByFilters(
                        @Param("id") Long id,
                        @Param("createTimeFrom") java.time.LocalDateTime createTimeFrom,
                        @Param("createTimeTo") java.time.LocalDateTime createTimeTo,
                        @Param("name") String name,
                        @Param("shortName") String shortName,
                        @Param("status") Integer status,
                        @Param("timeType") Integer timeType,
                        Pageable pageable);

        @Query("SELECT d FROM Department d WHERE (:name IS NULL OR d.name LIKE CONCAT('%', :name, '%')) AND (:name IS NULL OR d.short_name LIKE CONCAT('%', :name, '%')) AND d.status = 1 AND (:ids IS NULL OR d NOT IN :ids) ORDER BY d.create_time DESC")
        Page<Department> searchDepartmentActive(
                        @Param("name") String name,
                        @Param("ids") List<Long> ids,
                        Pageable pageable);

    @Query("SELECT d FROM Department d WHERE LOWER(d.short_name) = LOWER(:shortName)")
    Optional<Department> findByShortNameIgnoreCase(@Param("shortName") String shortName);

    @Query("SELECT d FROM Department d WHERE d.id != :id AND LOWER(d.short_name) = LOWER(:shortName)")
    Optional<Department> findByShortNameIgnoreCaseAndIdNot(@Param("shortName") String shortName, @Param("id") Long id);

}
