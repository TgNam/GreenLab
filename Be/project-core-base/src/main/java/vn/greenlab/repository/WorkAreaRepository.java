package vn.greenlab.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.Department;
import vn.greenlab.model.Ward;
import vn.greenlab.model.WorkArea;

@Repository
public interface WorkAreaRepository extends BaseRepository<WorkArea, Long> {
    @Query("SELECT w FROM WorkArea w WHERE w.short_name = :shortName")
    Optional<WorkArea> findByShort_name(String shortName);

    @Query("SELECT w FROM WorkArea w WHERE w.short_name in :shortName")
    List<WorkArea> findAllByShort_nameIn(List<String> shortName);

    @Query("SELECT w FROM WorkArea w WHERE w.id = :id")
    Optional<WorkArea> findById(int id);
}
