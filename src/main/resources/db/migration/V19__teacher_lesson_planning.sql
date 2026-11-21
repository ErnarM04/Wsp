CREATE TABLE teacher_lesson_plans (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id),
    subject_offering_id BIGINT NOT NULL REFERENCES subject_offerings(id),
    sequence_number INTEGER NOT NULL,
    lesson_date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    learning_objectives TEXT NOT NULL,
    lesson_material TEXT,
    task_deadline TIMESTAMPTZ,
    reminder_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    review_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_teacher_lesson_plans_teacher_date
    ON teacher_lesson_plans(teacher_id, lesson_date);

CREATE INDEX idx_teacher_lesson_plans_reminder
    ON teacher_lesson_plans(reminder_at, reminder_sent_at);
