package vn.greenlab.repository;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import vn.greenlab.model.District;

import java.util.List;

import java.util.Optional;

@Repository

public interface DistrictRepository extends BaseRepository<District, Integer> {

       @Query("SELECT d FROM District d WHERE d.id = :id AND d.city_id = :city_id")

       Optional<District> findByIdAndCityId(int id, int city_id);

       @Query("SELECT d FROM District d WHERE d.city_id = :cityId ORDER BY name ASC")

       List<District> findByCityId(int cityId);

       @Query("SELECT d FROM District d " +

                     "WHERE (:cityId = 0 OR d.city_id = :cityId) " +

                     "AND (:districtName IS NULL OR :districtName = '' OR LOWER(d.name) LIKE LOWER(CONCAT('%', :districtName, '%'))) "
                     +

                     "AND d.status = 1")

       List<District> findByCityIdAndDistrictName(@Param("cityId") int cityId,

                     @Param("districtName") String districtName);

       @Query(value = "SELECT * FROM district WHERE " +

                     "(:id IS NULL OR id = :id) AND " +

                     "(:name IS NULL OR name LIKE CONCAT('%', :name, '%')) AND " +

                     "(:status IS NULL OR status = :status) AND " +

                     "(:cityId = 0 OR city_id = :cityId) " +

                     "ORDER BY id ASC",

                     countQuery = "SELECT COUNT(*) FROM district WHERE " +

                                   "(:id IS NULL OR id = :id) AND " +

                                   "(:name IS NULL OR name LIKE CONCAT('%', :name, '%')) AND " +

                                   "(:status IS NULL OR status = :status) AND " +

                                   "(:cityId = 0 OR city_id = :cityId)",

                     nativeQuery = true)

       Page<District> filterDistricts(@Param("id") Integer id,

                     @Param("name") String name,

                     @Param("status") Integer status,

                     @Param("cityId") int cityId,

                     Pageable pageable);

       @Query(value = "SELECT d.id, d.name, d.status, d.city_id, c.name as city_name " +

                     "FROM district d " +

                     "LEFT JOIN city c ON d.city_id = c.id " +

                     "WHERE " +

                     "(:id IS NULL OR d.id = :id) AND " +

                     "(:name IS NULL OR d.name LIKE CONCAT('%', :name, '%')) AND " +

                     "(:status IS NULL OR d.status = :status) AND " +

                     "(:cityId IS NULL OR d.city_id = :cityId) " +

                     "ORDER BY d.id ASC",

                     countQuery = "SELECT COUNT(*) FROM district d WHERE " +

                                   "(:id IS NULL OR d.id = :id) AND " +

                                   "(:name IS NULL OR d.name LIKE CONCAT('%', :name, '%')) AND " +

                                   "(:status IS NULL OR d.status = :status) AND " +

                                   "(:cityId IS NULL OR d.city_id = :cityId)",

                     nativeQuery = true)

       Page<Object[]> filterDistrictsWithCityName(@Param("id") Integer id,

                     @Param("name") String name,

                     @Param("status") Integer status,

                     @Param("cityId") Integer cityId,

                     Pageable pageable);

       @Query(value = "SELECT * FROM district WHERE id IN :ids", nativeQuery = true)

       List<District> findByIds(@Param("ids") List<Integer> ids);

       @Query(value = "SELECT d.id, d.name, d.status, d.city_id, c.name as city_name " +

                     "FROM district d " +

                     "LEFT JOIN city c ON d.city_id = c.id " +

                     "WHERE " +

                     "(:searchText IS NULL OR :searchText = '' OR " +

                     "CAST(d.id AS CHAR) LIKE CONCAT('%', :searchText, '%') OR " +

                     "d.name LIKE CONCAT('%', :searchText, '%')) AND " +

                     "(:cityId IS NULL OR d.city_id = :cityId) " +

                     "ORDER BY d.id ASC",

                     countQuery = "SELECT COUNT(*) FROM district d WHERE " +

                                   "(:searchText IS NULL OR :searchText = '' OR " +

                                   "CAST(d.id AS CHAR) LIKE CONCAT('%', :searchText, '%') OR " +

                                   "d.name LIKE CONCAT('%', :searchText, '%')) AND " +

                                   "(:cityId IS NULL OR d.city_id = :cityId)",

                     nativeQuery = true)

       Page<Object[]> searchDistrictsByText(@Param("searchText") String searchText,

                     @Param("cityId") Integer cityId,

                     Pageable pageable);

}
