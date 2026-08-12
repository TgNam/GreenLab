package vn.greenlab.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.Doctor;

@Repository
public interface DoctorRepository extends BaseRepository<Doctor, Long> {

    @Query("SELECT d FROM Doctor d WHERE d.status = 1 ORDER BY d.code ASC, d.id ASC")
    List<Doctor> findAllActiveForSelect();
}
