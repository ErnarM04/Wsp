package ru.kors.finalproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.kors.finalproject.entity.DormRoom;

import java.util.List;

public interface DormRoomRepository extends JpaRepository<DormRoom, Long> {

    @Query("SELECT r FROM DormRoom r JOIN FETCH r.dormBuilding WHERE r.dormBuilding.id = :dormBuildingId ORDER BY r.id")
    List<DormRoom> findByDormBuildingId(@Param("dormBuildingId") Long dormBuildingId);

    @Query("SELECT r FROM DormRoom r JOIN FETCH r.dormBuilding WHERE r.roomType = :roomType AND r.occupied < r.capacity ORDER BY r.id")
    List<DormRoom> findAvailableByType(@Param("roomType") DormRoom.RoomType roomType);

    @Query("SELECT r FROM DormRoom r JOIN FETCH r.dormBuilding WHERE r.occupied < r.capacity ORDER BY r.id")
    List<DormRoom> findAllAvailable();

    @Query("SELECT r FROM DormRoom r JOIN FETCH r.dormBuilding ORDER BY r.id")
    List<DormRoom> findAllWithBuildingOrderByIdAsc();
}
