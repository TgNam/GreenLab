package vn.greenlab.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.enums.Position;
import vn.greenlab.model.output.administrator.AdministratorBaseOutput;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdministratorRepository extends BaseRepository<Administrator, Integer> {

  @Query(value = "SELECT a.status FROM administrator a WHERE a.id = :id", nativeQuery = true)
  Integer checkActiveStatus(@Param("id") Long id);

  @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
      "FROM Administrator a WHERE a.lost_password_code = :code")
  boolean existsByLost_password_code(@Param("code") String code);

  @Query("SELECT a FROM Administrator a WHERE a.lost_password_code = :code")
  Optional<Administrator> findByLost_password_code(@Param("code") String code);

  @Query("SELECT a FROM Administrator a WHERE LOWER(a.user_name) = :username")
  Optional<Administrator> findByUser_name(@Param("username") String user_name);

  @Query("SELECT a FROM Administrator a WHERE a.user_name in (:username)")
  List<Administrator> findByListUser_name(@Param("username") List<String> user_name);

  @Query("SELECT a FROM Administrator a WHERE LOWER(a.user_name) = :username OR LOWER(a.email) = :username")
  Optional<Administrator> findByUsernameOrEmail(@Param("username") String user_name);

  @Query("SELECT a FROM Administrator a WHERE a.phone = :phone")
  Optional<Administrator> findByPhone(@Param("phone") String phone);

  Optional<Administrator> findByEmail(String email);

  @Query("""
      SELECT a FROM Administrator a
      LEFT JOIN FETCH a.manager
      WHERE
        (:username IS NULL OR a.email LIKE CONCAT('%', :username, '%')
                            OR a.full_name LIKE CONCAT('%', :username, '%'))
        AND (:id IS NULL OR a.id = :id)
        AND (:phone IS NULL OR a.phone = :phone)
        AND (:createTimeFrom IS NULL OR ((:timeType = 0 AND a.create_time >= :createTimeFrom) OR (:timeType = 1 AND a.update_time >= :createTimeFrom)))
        AND (:createTimeTo IS NULL OR ((:timeType = 0 AND a.create_time <= :createTimeTo) OR (:timeType = 1 AND a.update_time <= :createTimeTo)))
        AND (:isActive IS NULL OR a.status = :isActive)
        AND (:managerId IS NULL OR a.manager.id = :managerId)
        AND (:usernameRel IS NULL OR a.user_name LIKE CONCAT('%', :usernameRel, '%'))
        AND (:departmentId IS NULL OR a.department_id = :departmentId)
        AND (:workAreaId IS NULL OR a.work_area_id = :workAreaId)
      """)
  Page<Administrator> findAllByUsernameAndStatus(Integer id, LocalDateTime createTimeFrom, LocalDateTime createTimeTo,
      String username,
      String phone, Integer isActive, Integer managerId, String departmentId, String workAreaId, String usernameRel,
      Integer timeType,
      Pageable pageable);

  @Query("SELECT a FROM Administrator a WHERE (:areaId IS NULL OR a.area_id = :areaId) AND a.status = 1")
  Page<Administrator> findAll(@Param("areaId") String areaId, Pageable pageable);

  @Query("SELECT a FROM Administrator a WHERE (:username IS NULL OR a.user_name LIKE CONCAT('%', :username, '%') OR a.full_name LIKE CONCAT('%', :username, '%')) AND (:adminIds IS NULL OR a.id NOT IN :adminIds) AND a.status = 1")
  Page<Administrator> searchAdministratorByTextActive(@Param("username") String username,
      @Param("adminIds") List<Integer> adminIds,
      Pageable pageable);

  @Query("SELECT a FROM Administrator a WHERE (:username IS NULL OR a.user_name LIKE CONCAT('%', :username, '%') OR a.full_name LIKE CONCAT('%', :username, '%')) AND (:adminIds IS NULL OR a.id NOT IN :adminIds)")
  Page<Administrator> searchAdministratorByText(@Param("username") String username,
      @Param("adminIds") List<Integer> adminIds,
      Pageable pageable);

  @Query("SELECT a FROM Administrator a WHERE (:username IS NULL OR a.user_name LIKE CONCAT('%', :username, '%') OR a.full_name LIKE CONCAT('%', :username, '%')) AND a.area_id IS NOT NULL AND a.department_id = 'DVKH' AND (:adminIds IS NULL OR a.id NOT IN :adminIds) AND a.status = 1")
  Page<Administrator> searchAdministratorByTextActiveAndAreaAndCSKH(@Param("username") String username,
      @Param("adminIds") List<Integer> adminIds,
      Pageable pageable);

  @Query("SELECT a FROM Administrator a LEFT JOIN FETCH a.roles r WHERE LOWER(a.user_name) = :username OR LOWER(a.email) = :username")
  Optional<Administrator> findByUsernameOrEmailWithRoles(@Param("username") String username);

  @Query("SELECT DISTINCT a FROM Administrator a LEFT JOIN FETCH a.roles r WHERE a.id = :id")
  Optional<Administrator> findByIdWithRoles(@Param("id") Integer id);

  @Query("SELECT a FROM Administrator a WHERE a.id IN :ids")
  List<Administrator> findByIds(List<Integer> ids);

  @Query("SELECT DISTINCT a FROM Administrator a JOIN a.roles r WHERE r.id = :roleId")
  List<Administrator> findByRoleId(@Param("roleId") Integer roleId);

  @Query("""
          SELECT a
          FROM Administrator a
          WHERE (:id IS NULL OR a.id = :id)
            AND (
                  :keyword IS NULL
                  OR :keyword = ''
                  OR LOWER(a.user_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(a.email)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR a.phone            LIKE CONCAT('%', :keyword, '%')
                )
      """)
  Page<Administrator> getAdministratorList(@Param("id") Integer id,
      @Param("keyword") String keyword, Pageable pageable);

  @Query("""
          SELECT a
          FROM Administrator a
          WHERE (:id IS NULL OR a.id = :id) AND a.area_id IS NOT NULL AND a.department_id = 'DVKH'
            AND (
                  :keyword IS NULL
                  OR :keyword = ''
                  OR LOWER(a.user_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(a.email)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR a.phone            LIKE CONCAT('%', :keyword, '%')
                )
      """)
  Page<Administrator> findAllHaveAreaAndCSKH(@Param("id") Integer id,
      @Param("keyword") String keyword, Pageable pageable);

  @Query("SELECT a FROM Administrator a WHERE a.area_id IS NOT NULL AND a.department_id = 'DVKH'")
  List<Administrator> findAllHaveAreaAndCSKH();

  /**
   * =============================================
   * QUERY HELPER CHO LOGIC PatientManage_InsertPatientPC
   * =============================================
   */

  /**
   * Tìm UserGettest từ SEQ prefix (3 ký tự đầu)
   * Tương đương logic trong stored procedure:
   * IF(LEFT(@SEQ,3) <> '000')
   * SET @UserGettest = (SELECT TOP 1 UserID FROM Sys_User
   * WHERE StartBy = LEFT(@SEQ,3)
   * AND LEN(@SEQ) = 7
   * AND StartBy <> '000'
   * AND LEN(ISNULL(DoctorID,'')) = 0)
   * 
   * Tìm Administrator có start_barcode = 3 ký tự đầu của SEQ
   * Điều kiện:
   * - SEQ có độ dài = 7
   * - Prefix (3 ký tự đầu) <> '000'
   * - Administrator không có doctor_id (trong hệ thống mới có thể không có field
   * này)
   * 
   * @param seqPrefix 3 ký tự đầu của SEQ
   * @return Administrator nếu tìm thấy, null nếu không
   */
  @Query("SELECT a FROM Administrator a WHERE a.start_barcode = :seqPrefix")
  Optional<Administrator> findUserGettestBySeqPrefix(@Param("seqPrefix") String seqPrefix);

  @Query("SELECT a FROM Administrator a WHERE a.start_barcode = :seqPrefix")
  List<Administrator> findAllBySeqPrefix(@Param("seqPrefix") String seqPrefix);

  @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
      "FROM Administrator a WHERE a.start_barcode = :startBarcode")
  boolean existsByStartBarcode(@Param("startBarcode") String startBarcode);

  @Query("""
          SELECT a
          FROM Administrator a
          WHERE (
                  :keyword IS NULL
                  OR :keyword = ''
                  OR LOWER(a.full_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(a.user_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(a.email)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR a.phone            LIKE CONCAT('%', :keyword, '%')
                )
      """)
  Page<Administrator> getAdministratorSelectBox(@Param("keyword") String keyword, Pageable pageable);

  @Query("SELECT new vn.greenlab.model.output.administrator.AdministratorBaseOutput(a.id, a.user_name, a.full_name, a.email, a.phone, a.start_barcode) FROM Administrator a")
  List<AdministratorBaseOutput> getAllAdministratorBaseInfo();

  @Query("SELECT a FROM Administrator a WHERE a.status = 1 AND (:keyword IS NULL OR :keyword = '' OR LOWER(a.full_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(a.user_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR a.phone LIKE CONCAT('%', :keyword, '%')) AND (:position IS NULL OR a.position = :position)")
  List<Administrator> findByKeywordAndPosition(@Param("keyword") String keyword, @Param("position") Position position);
}