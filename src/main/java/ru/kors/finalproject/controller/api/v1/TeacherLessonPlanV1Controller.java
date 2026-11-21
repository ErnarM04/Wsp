package ru.kors.finalproject.controller.api.v1;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.kors.finalproject.entity.Teacher;
import ru.kors.finalproject.entity.User;
import ru.kors.finalproject.service.TeacherLessonPlanService;
import ru.kors.finalproject.web.api.v1.CurrentUserHelper;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/teacher/lesson-plans")
@RequiredArgsConstructor
@Tag(name = "Teacher Lesson Planning", description = "Calendar-thematic lesson plans, AI-generated materials, review, and deadline reminders.")
@SecurityRequirement(name = "Bearer")
public class TeacherLessonPlanV1Controller {
    private final CurrentUserHelper currentUserHelper;
    private final TeacherLessonPlanService lessonPlanService;

    @GetMapping
    public ResponseEntity<List<TeacherLessonPlanService.LessonPlanItem>> list(@AuthenticationPrincipal User user) {
        Teacher teacher = currentUserHelper.requireTeacher(user);
        return ResponseEntity.ok(lessonPlanService.list(teacher));
    }

    @PostMapping
    public ResponseEntity<TeacherLessonPlanService.LessonPlanItem> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateLessonPlanBody body) {
        Teacher teacher = currentUserHelper.requireTeacher(user);
        return ResponseEntity.ok(lessonPlanService.create(
                teacher, body.sectionId(), body.sequenceNumber(), body.lessonDate(), body.topic(), body.learningObjectives(),
                body.taskDeadline(), body.reminderAt()));
    }

    @PutMapping("/{planId}")
    public ResponseEntity<TeacherLessonPlanService.LessonPlanItem> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long planId,
            @Valid @RequestBody UpdateLessonPlanBody body) {
        Teacher teacher = currentUserHelper.requireTeacher(user);
        return ResponseEntity.ok(lessonPlanService.update(
                teacher, planId, body.sequenceNumber(), body.lessonDate(), body.topic(), body.learningObjectives(),
                body.lessonMaterial(), body.taskDeadline(), body.reminderAt()));
    }

    @PostMapping("/{planId}/generate")
    public ResponseEntity<TeacherLessonPlanService.LessonPlanItem> generate(
            @AuthenticationPrincipal User user,
            @PathVariable Long planId) {
        Teacher teacher = currentUserHelper.requireTeacher(user);
        return ResponseEntity.ok(lessonPlanService.generate(teacher, planId));
    }

    @PostMapping("/{planId}/approve")
    public ResponseEntity<TeacherLessonPlanService.LessonPlanItem> approve(
            @AuthenticationPrincipal User user,
            @PathVariable Long planId) {
        Teacher teacher = currentUserHelper.requireTeacher(user);
        return ResponseEntity.ok(lessonPlanService.approve(teacher, planId));
    }

    public record CreateLessonPlanBody(
            @NotNull Long sectionId,
            @Min(1) int sequenceNumber,
            @NotNull LocalDate lessonDate,
            @NotBlank @Size(max = 255) String topic,
            @NotBlank @Size(max = 5000) String learningObjectives,
            Instant taskDeadline,
            Instant reminderAt) {
    }

    public record UpdateLessonPlanBody(
            @Min(1) int sequenceNumber,
            @NotNull LocalDate lessonDate,
            @NotBlank @Size(max = 255) String topic,
            @NotBlank @Size(max = 5000) String learningObjectives,
            String lessonMaterial,
            Instant taskDeadline,
            Instant reminderAt) {
    }
}
