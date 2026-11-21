package ru.kors.finalproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.kors.finalproject.entity.Notification;
import ru.kors.finalproject.entity.SubjectOffering;
import ru.kors.finalproject.entity.Teacher;
import ru.kors.finalproject.entity.TeacherLessonPlan;
import ru.kors.finalproject.repository.SubjectOfferingRepository;
import ru.kors.finalproject.repository.TeacherLessonPlanRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TeacherLessonPlanService {
    private static final int MAX_TOPIC_LENGTH = 255;
    private static final int MAX_OBJECTIVES_LENGTH = 5000;

    private final TeacherLessonPlanRepository lessonPlanRepository;
    private final SubjectOfferingRepository subjectOfferingRepository;
    private final GeminiClientService geminiClientService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<LessonPlanItem> list(Teacher teacher) {
        return lessonPlanRepository.findByTeacherIdOrderByLessonDateAscSequenceNumberAsc(teacher.getId())
                .stream().map(this::toItem).toList();
    }

    @Transactional
    public LessonPlanItem create(
            Teacher teacher,
            Long sectionId,
            int sequenceNumber,
            LocalDate lessonDate,
            String topic,
            String learningObjectives,
            Instant taskDeadline,
            Instant reminderAt
    ) {
        SubjectOffering offering = requireOwnedOffering(teacher, sectionId);
        validatePlan(sequenceNumber, lessonDate, topic, learningObjectives, taskDeadline, reminderAt);
        Instant now = Instant.now();
        TeacherLessonPlan plan = lessonPlanRepository.save(TeacherLessonPlan.builder()
                .teacher(teacher)
                .subjectOffering(offering)
                .sequenceNumber(sequenceNumber)
                .lessonDate(lessonDate)
                .topic(topic.trim())
                .learningObjectives(learningObjectives.trim())
                .taskDeadline(taskDeadline)
                .reminderAt(reminderAt)
                .reviewStatus(TeacherLessonPlan.ReviewStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build());
        return toItem(plan);
    }

    @Transactional
    public LessonPlanItem update(
            Teacher teacher,
            Long planId,
            int sequenceNumber,
            LocalDate lessonDate,
            String topic,
            String learningObjectives,
            String lessonMaterial,
            Instant taskDeadline,
            Instant reminderAt
    ) {
        TeacherLessonPlan plan = requireOwnedPlan(teacher, planId);
        ensureDraft(plan);
        validatePlan(sequenceNumber, lessonDate, topic, learningObjectives, taskDeadline, reminderAt);
        plan.setSequenceNumber(sequenceNumber);
        plan.setLessonDate(lessonDate);
        plan.setTopic(topic.trim());
        plan.setLearningObjectives(learningObjectives.trim());
        plan.setLessonMaterial(trimToNull(lessonMaterial));
        plan.setTaskDeadline(taskDeadline);
        if (!Objects.equals(plan.getReminderAt(), reminderAt)) {
            plan.setReminderSentAt(null);
        }
        plan.setReminderAt(reminderAt);
        plan.setUpdatedAt(Instant.now());
        return toItem(lessonPlanRepository.save(plan));
    }

    @Transactional
    public LessonPlanItem generate(Teacher teacher, Long planId) {
        TeacherLessonPlan plan = requireOwnedPlan(teacher, planId);
        ensureDraft(plan);
        SubjectOffering offering = plan.getSubjectOffering();
        String course = offering.getSubject().getCode() + " — " + offering.getSubject().getName();
        String context = """
                Teacher: %s
                Course: %s
                Lesson number: %d
                Lesson date: %s
                Topic: %s
                Learning objectives: %s
                """.formatted(teacher.getName(), course, plan.getSequenceNumber(), plan.getLessonDate(), plan.getTopic(), plan.getLearningObjectives());
        String instructions = """
                Create a classroom-ready lesson package from the teacher's calendar-thematic plan (КТЖ).
                Write in the same language as the topic and objectives. Use clear headings and practical detail.
                Include: lesson outcomes, a timed lesson flow, concise teaching notes/material, one active-learning activity,
                formative assessment questions with answer guidance, an independent assignment, and a rubric/checklist.
                Keep the package suitable for the stated course and lesson length; do not invent course-specific facts.
                Return editable plain text with Markdown headings. Do not claim the package is approved.
                """;
        GeminiClientService.GeminiReply reply = geminiClientService.generate(
                instructions, "Calendar-thematic lesson plan", context, "Prepare the lesson package.", 0.35, 1800);
        plan.setLessonMaterial(reply.answer());
        plan.setUpdatedAt(Instant.now());
        return toItem(lessonPlanRepository.save(plan));
    }

    @Transactional
    public LessonPlanItem approve(Teacher teacher, Long planId) {
        TeacherLessonPlan plan = requireOwnedPlan(teacher, planId);
        ensureDraft(plan);
        if (plan.getLessonMaterial() == null || plan.getLessonMaterial().isBlank()) {
            throw new IllegalStateException("Generate or add lesson material before approving it");
        }
        Instant now = Instant.now();
        plan.setReviewStatus(TeacherLessonPlan.ReviewStatus.APPROVED);
        plan.setApprovedAt(now);
        plan.setUpdatedAt(now);
        return toItem(lessonPlanRepository.save(plan));
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void sendDueReminders() {
        Instant now = Instant.now();
        List<TeacherLessonPlan> duePlans = lessonPlanRepository
                .findByReminderAtLessThanEqualAndReminderSentAtIsNull(now);
        for (TeacherLessonPlan plan : duePlans) {
            String deadline = plan.getTaskDeadline() == null ? "no deadline set" : plan.getTaskDeadline().toString();
            notificationService.notify(
                    plan.getTeacher().getEmail(),
                    Notification.NotificationType.SYSTEM,
                    "Lesson preparation reminder: " + plan.getTopic(),
                    "Lesson " + plan.getSequenceNumber() + " for " + plan.getSubjectOffering().getSubject().getCode()
                            + " is scheduled for " + plan.getLessonDate() + ". Task deadline: " + deadline + ".",
                    "/app/teacher/planning");
            plan.setReminderSentAt(now);
            plan.setUpdatedAt(now);
        }
    }

    private SubjectOffering requireOwnedOffering(Teacher teacher, Long sectionId) {
        SubjectOffering offering = subjectOfferingRepository.findByIdWithDetails(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        if (offering.getTeacher() == null || !offering.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("Section is not assigned to this teacher");
        }
        return offering;
    }

    private TeacherLessonPlan requireOwnedPlan(Teacher teacher, Long planId) {
        TeacherLessonPlan plan = lessonPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson plan not found"));
        if (!plan.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("Lesson plan is not owned by this teacher");
        }
        return plan;
    }

    private void validatePlan(int sequenceNumber, LocalDate lessonDate, String topic, String objectives,
                             Instant taskDeadline, Instant reminderAt) {
        if (sequenceNumber < 1) throw new IllegalArgumentException("Lesson number must be positive");
        if (lessonDate == null) throw new IllegalArgumentException("Lesson date is required");
        if (topic == null || topic.isBlank() || topic.length() > MAX_TOPIC_LENGTH) {
            throw new IllegalArgumentException("Topic is required and must be at most 255 characters");
        }
        if (objectives == null || objectives.isBlank() || objectives.length() > MAX_OBJECTIVES_LENGTH) {
            throw new IllegalArgumentException("Learning objectives are required and must be at most 5000 characters");
        }
        if (taskDeadline != null && reminderAt != null && reminderAt.isAfter(taskDeadline)) {
            throw new IllegalArgumentException("Reminder time must be before the task deadline");
        }
    }

    private void ensureDraft(TeacherLessonPlan plan) {
        if (plan.getReviewStatus() != TeacherLessonPlan.ReviewStatus.DRAFT) {
            throw new IllegalStateException("Approved lesson material cannot be edited");
        }
    }

    private LessonPlanItem toItem(TeacherLessonPlan plan) {
        SubjectOffering offering = plan.getSubjectOffering();
        return new LessonPlanItem(
                plan.getId(), offering.getId(), offering.getSubject().getCode(), offering.getSubject().getName(),
                plan.getSequenceNumber(), plan.getLessonDate(), plan.getTopic(), plan.getLearningObjectives(),
                plan.getLessonMaterial(), plan.getTaskDeadline(), plan.getReminderAt(), plan.getReminderSentAt(),
                plan.getReviewStatus().name(), plan.getCreatedAt(), plan.getUpdatedAt(), plan.getApprovedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record LessonPlanItem(
            Long id, Long sectionId, String subjectCode, String subjectName,
            int sequenceNumber, LocalDate lessonDate, String topic, String learningObjectives,
            String lessonMaterial, Instant taskDeadline, Instant reminderAt, Instant reminderSentAt,
            String reviewStatus, Instant createdAt, Instant updatedAt, Instant approvedAt) {
    }
}
