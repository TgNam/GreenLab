package vn.greenlab.service;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;

import vn.greenlab.repository.WorkAreaRepository;
import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.model.WorkArea;
import java.util.List;
import java.util.Optional;

@Service
public class WorkAreaService {
    @Autowired
    private WorkAreaRepository workAreaRepository;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    private List<WorkArea> loadWorkAreaCache() {
        Optional<List<WorkArea>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.WORK_AREA, WorkArea.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<WorkArea> list = workAreaRepository.findAll();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.WORK_AREA, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private void clearWorkAreaCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.WORK_AREA);
    }

    public List<WorkArea> getWorkAreaCache() {
        return loadWorkAreaCache();
    }
}
