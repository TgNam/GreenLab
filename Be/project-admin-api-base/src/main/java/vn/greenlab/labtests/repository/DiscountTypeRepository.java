package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.DiscountType;

import java.util.Optional;

@Repository
public interface DiscountTypeRepository extends JpaRepository<DiscountType, Integer> {

    Optional<DiscountType> findByCode(String code);

    @Query("SELECT dt FROM DiscountType dt WHERE " +
           "(:code IS NULL OR dt.code LIKE %:code%) " +
           "AND (:name IS NULL OR dt.name LIKE %:name%) " +
           "ORDER BY dt.id DESC")
    Page<DiscountType> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}
