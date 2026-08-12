package vn.greenlab.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.greenlab.model.Ward;

import java.util.List;

@Repository
public interface WardRepository extends BaseRepository<Ward, Integer> {

    @Query("SELECT w FROM Ward w WHERE :districtId = 0 OR w.district_id = :districtId ORDER BY name ASC")
    List<Ward> findByDistrictId(@Param("districtId") int districtId);

    @Query(value = "SELECT w.* FROM ward w " +
           "LEFT JOIN district d ON w.district_id = d.id " +
           "WHERE " +
           "(:id IS NULL OR w.id = :id) AND " +
           "(:name IS NULL OR w.name LIKE CONCAT('%', :name, '%')) AND " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:districtId IS NULL OR w.district_id = :districtId) AND " +
           "(:cityId IS NULL OR d.city_id = :cityId) AND " +
           "(:wardType IS NULL OR (:wardType = 1 AND w.city_id > 0) OR (:wardType = 0 AND w.city_id = 0)) " +
           "ORDER BY w.id ASC",
           countQuery = "SELECT COUNT(*) FROM ward w " +
           "LEFT JOIN district d ON w.district_id = d.id " +
           "WHERE " +
           "(:id IS NULL OR w.id = :id) AND " +
           "(:name IS NULL OR w.name LIKE CONCAT('%', :name, '%')) AND " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:districtId IS NULL OR w.district_id = :districtId) AND " +
           "(:cityId IS NULL OR d.city_id = :cityId) AND " +
           "(:wardType IS NULL OR (:wardType = 1 AND w.city_id > 0) OR (:wardType = 0 AND w.city_id = 0))",
           nativeQuery = true)
    Page<Ward> filterWards(@Param("id") Integer id,
                            @Param("name") String name,
                            @Param("status") Integer status,
                            @Param("districtId") Integer districtId,
                            @Param("cityId") Integer cityId,
                            @Param("wardType") Integer wardType,
                            Pageable pageable);

    @Query(value = "SELECT w.id, w.name, w.status, w.district_id, w.city_id, d.name as district_name, c.name as city_name " +
           "FROM ward w " +
           "LEFT JOIN district d ON w.district_id = d.id " +
           "LEFT JOIN city c ON w.city_id = c.id " +
           "WHERE " +
           "(:id IS NULL OR w.id = :id) AND " +
           "(:name IS NULL OR w.name LIKE CONCAT('%', :name, '%')) AND " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:districtId IS NULL OR w.district_id = :districtId) AND " +
           "(:cityIdOld IS NULL OR d.city_id = :cityIdOld) AND " +
           "(:cityIdNew IS NULL OR w.city_id = :cityIdNew) AND " +
           "(:wardType IS NULL OR (:wardType = 1 AND w.city_id > 0) OR (:wardType = 0 AND w.city_id = 0)) " +
           "ORDER BY w.id ASC",
           countQuery = "SELECT COUNT(*) FROM ward w " +
           "LEFT JOIN district d ON w.district_id = d.id " +
           "WHERE " +
           "(:id IS NULL OR w.id = :id) AND " +
           "(:name IS NULL OR w.name LIKE CONCAT('%', :name, '%')) AND " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:districtId IS NULL OR w.district_id = :districtId) AND " +
           "(:cityIdOld IS NULL OR d.city_id = :cityIdOld) AND " +
           "(:cityIdNew IS NULL OR w.city_id = :cityIdNew) AND " +
           "(:wardType IS NULL OR (:wardType = 1 AND w.city_id > 0) OR (:wardType = 0 AND w.city_id = 0))",
           nativeQuery = true)
    Page<Object[]> filterWardsWithNames(@Param("id") Integer id,
                                         @Param("name") String name,
                                         @Param("status") Integer status,
                                         @Param("districtId") Integer districtId,
                                         @Param("cityIdOld") Integer cityIdOld,
                                         @Param("cityIdNew") Integer cityIdNew,
                                         @Param("wardType") Integer wardType,
                                         Pageable pageable);

    /**
     * Tìm tất cả phường/xã chưa được map với city (city_id = 0).
     * Dùng cho việc map phường/xã mới với tỉnh/thành phố.
     */
    @Query("SELECT w FROM Ward w WHERE w.city_id = 0 ORDER BY w.id ASC")
    List<Ward> findUnmappedWards();

    /**
     * Tìm tất cả phường/xã đã được map với city (city_id > 0).
     */
    @Query("SELECT w FROM Ward w WHERE w.city_id > 0 ORDER BY w.id ASC")
    List<Ward> findMappedWards();

    /**
     * Tìm phường/xã theo city_id (map với tỉnh/thành phố).
     */
    @Query("SELECT w FROM Ward w WHERE w.city_id = :cityId ORDER BY w.id ASC")
    List<Ward> findByCity_id(@Param("cityId") int cityId);

    @Query(value = "SELECT * FROM ward WHERE parent_id != 0", nativeQuery = true)
    List<Ward> findListWardOld();

    @Query(value = "SELECT * FROM ward WHERE parent_id = 0", nativeQuery = true)
    List<Ward> findListWardNew();
}
