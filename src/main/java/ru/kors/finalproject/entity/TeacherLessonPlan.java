package ru.kors.finalproject.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "teacher_lesson_plans", indexes = {
        @Index(name = "idx_teacher_lesson_plans_teacher_date", columnList = "teacher_id, lesson_date"),
        @Index(name = "idx_teacher_lesson_plans_reminder", columnList = "reminder_at, reminder_sent_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherLessonPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_offering_id", nullable = false)
    private SubjectOffering subjectOffering;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(nullable = false)
    private LocalDate lessonDate;

    @Column(nullable = false)
    private String topic;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String learningObjectives;

    @Column(name = "lesson_material", columnDefinition = "TEXT")
    private String lessonMaterial;

    @Column(name = "task_deadline")
    private Instant taskDeadline;

    @Column(name = "reminder_at")
    private Instant reminderAt;

    @Column(name = "reminder_sent_at")
    private Instant reminderSentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus reviewStatus = ReviewStatus.DRAFT;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant approvedAt;

    public enum ReviewStatus {
        DRAFT,
        APPROVED
    }
}
