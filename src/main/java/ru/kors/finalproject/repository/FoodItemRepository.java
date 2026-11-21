package ru.kors.finalproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.kors.finalproject.entity.FoodItem;

import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    @Query("select i from FoodItem i join fetch i.category where i.category.id = :categoryId and i.available = true order by i.id")
    List<FoodItem> findByCategoryIdAndAvailableTrue(@Param("categoryId") Long categoryId);

    @Query("select i from FoodItem i join fetch i.category where i.available = true order by i.id")
    List<FoodItem> findByAvailableTrue();

    @Query("select i from FoodItem i join fetch i.category where i.popular = true and i.available = true order by i.id")
    List<FoodItem> findByPopularTrueAndAvailableTrue();

    @Query("select i from FoodItem i left join fetch i.category order by i.id")
    List<FoodItem> findAllWithCategoryOrderByIdAsc();
}
