package vn.greenlab.repository;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.greenlab.model.User;

@Repository
public interface UserRepository extends BaseRepository<User, Long> {

    @Query("""
        SELECT u FROM User u
        WHERE
          (:keyword IS NULL OR :keyword = '' OR
            LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            u.phone           LIKE CONCAT('%', :keyword, '%'))
        AND (:email IS NULL OR u.email = :email)
        AND (:fullName IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :fullName, '%')))
        AND (:phone IS NULL OR u.phone LIKE CONCAT('%', :phone, '%'))
        AND (:isActive IS NULL OR u.status = :isActive)
        AND (:type IS NULL OR u.type = :type)
        AND (:regSource IS NULL OR u.regSource = :regSource)
        AND (:createdFrom IS NULL OR u.createTime >= :createdFrom)
        AND (:createdTo IS NULL OR u.createTime <= :createdTo)
    """)
    Page<User> search(@Param("keyword") String keyword,
                      @Param("email") String email,
                      @Param("fullName") String fullName,
                      @Param("phone") String phone,
                      @Param("isActive") Boolean isActive,
                      @Param("type") Integer type,
                      @Param("regSource") Integer regSource,
                      @Param("createdFrom") LocalDateTime createdFrom,
                      @Param("createdTo") LocalDateTime createdTo,
                      Pageable pageable);
}
