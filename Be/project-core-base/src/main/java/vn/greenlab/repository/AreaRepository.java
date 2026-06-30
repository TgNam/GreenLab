package vn.greenlab.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.greenlab.model.Area;

import java.util.List;
import java.util.Optional;

@Repository
public interface AreaRepository extends BaseRepository<Area, Long> {
    @Query("SELECT a FROM Area a WHERE a.active = true ORDER BY a.id ASC")
    List<Area> findAllActive();
    
    @Query("SELECT a FROM Area a WHERE a.code = :code")
    Optional<Area> findByCode(@Param("code") String code);

    
}

