package ru.kors.finalproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.kors.finalproject.entity.TeacherLessonPlan;

import java.time.Instant;
import java.util.List;

public interface TeacherLessonPlanRepository extends JpaRepository<TeacherLessonPlan, Long> {
    List<TeacherLessonPlan> findByTeacherIdOrderByLessonDateAscSequenceNumberAsc(Long teacherId);

    List<TeacherLessonPlan> findByReminderAtLessThanEqualAndReminderSentAtIsNull(Instant now);
}
