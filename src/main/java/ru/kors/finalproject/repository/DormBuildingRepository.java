package ru.kors.finalproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.kors.finalproject.entity.DormBuilding;

import java.util.List;

public interface DormBuildingRepository extends JpaRepository<DormBuilding, Long> {

    List<DormBuilding> findAllByOrderByIdAsc();
}
