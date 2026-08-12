package vn.greenlab.labtests.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.PanelTest;

import java.util.List;
import java.util.Optional;

@Repository
public interface PanelTestRepository extends JpaRepository<PanelTest, Integer> {

    List<PanelTest> findByPanelId(Integer panelId);

    List<PanelTest> findByTestId(Integer testId);

    @Query("SELECT pt FROM PanelTest pt WHERE pt.panelId = :panelId AND pt.testId = :testId")
    Optional<PanelTest> findByPanelIdAndTestId(@Param("panelId") Integer panelId, @Param("testId") Integer testId);

    @Query("SELECT COUNT(pt) FROM PanelTest pt WHERE pt.panelId = :panelId")
    Integer countByPanelId(@Param("panelId") Integer panelId);

    void deleteByPanelId(Integer panelId);

    void deleteByTestId(Integer testId);

    boolean existsByPanelIdAndTestId(Integer panelId, Integer testId);
}
