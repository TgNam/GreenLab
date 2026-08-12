package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.Unit;

import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Integer> {

    Optional<Unit> findByCode(String code);

    @Query("SELECT u FROM Unit u WHERE " +
           "(:code IS NULL OR u.code LIKE %:code%) " +
           "AND (:name IS NULL OR u.name LIKE %:name%) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "ORDER BY u.id DESC")
    Page<Unit> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}
