package vn.greenlab.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.model.Doctor;
import vn.greenlab.model.output.DoctorSelectOutput;
import vn.greenlab.repository.DoctorRepository;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    public List<DoctorSelectOutput> getDoctorSelectList() {
        Optional<List<DoctorSelectOutput>> cached = redisCacheComponent.getList(
                RedisCacheComponent.CacheKeys.DOCTOR_SELECT,
                DoctorSelectOutput.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        List<DoctorSelectOutput> list = doctorRepository.findAllActiveForSelect().stream()
                .map(this::toSelectOutput)
                .collect(Collectors.toList());

        redisCacheComponent.put(
                RedisCacheComponent.CacheKeys.DOCTOR_SELECT,
                list,
                RedisCacheComponent.A_DAY * 30);

        return list;
    }

    public void clearDoctorSelectCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.DOCTOR_SELECT);
    }

    private DoctorSelectOutput toSelectOutput(Doctor doctor) {
        return DoctorSelectOutput.builder()
                .id(doctor.getId())
                .code(doctor.getCode())
                .doctorName(doctor.getDoctor_name())
                .city_id(doctor.getCity_id())
                .build();
    }
}
