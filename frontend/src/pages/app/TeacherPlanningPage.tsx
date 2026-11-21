import { type FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  approveTeacherLessonMaterial,
  createTeacherLessonPlan,
  fetchTeacherLessonPlans,
  fetchTeacherSections,
  generateTeacherLessonMaterial,
  updateTeacherLessonPlan
} from "../../lib/api";
import type { TeacherLessonPlanInput, TeacherLessonPlanItem, TeacherSectionItem } from "../../types/teacher";

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toPlanInput(plan: TeacherLessonPlanItem): TeacherLessonPlanInput {
  return {
    sectionId: plan.sectionId,
    sequenceNumber: plan.sequenceNumber,
    lessonDate: plan.lessonDate,
    topic: plan.topic,
    learningObjectives: plan.learningObjectives,
    taskDeadline: plan.taskDeadline,
    reminderAt: plan.reminderAt
  };
}

function toInstant(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function displayDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Not set";
}

export default function TeacherPlanningPage() {
  const [sections, setSections] = useState<TeacherSectionItem[]>([]);
  const [plans, setPlans] = useState<TeacherLessonPlanItem[]>([]);
  const [sectionId, setSectionId] = useState<number | "">("");
  const [sequenceNumber, setSequenceNumber] = useState("1");
  const [lessonDate, setLessonDate] = useState("");
  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [materials, setMaterials] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reload() {
    const [sectionItems, planItems] = await Promise.all([fetchTeacherSections(), fetchTeacherLessonPlans()]);
    setSections(sectionItems);
    setSectionId((current) => current || sectionItems[0]?.id || "");
    setPlans(planItems);
    setMaterials(Object.fromEntries(planItems.map((plan) => [plan.id, plan.lessonMaterial || ""])));
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [sectionItems, planItems] = await Promise.all([fetchTeacherSections(), fetchTeacherLessonPlans()]);
        if (!active) return;
        setSections(sectionItems);
        setSectionId(sectionItems[0]?.id || "");
        setPlans(planItems);
        setMaterials(Object.fromEntries(planItems.map((plan) => [plan.id, plan.lessonMaterial || ""])));
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load lesson planning data");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createTeacherLessonPlan({
        sectionId: Number(sectionId),
        sequenceNumber: Number(sequenceNumber),
        lessonDate,
        topic: topic.trim(),
        learningObjectives: objectives.trim(),
        taskDeadline: toInstant(taskDeadline),
        reminderAt: toInstant(reminderAt)
      });
      setTopic("");
      setObjectives("");
      setTaskDeadline("");
      setReminderAt("");
      setSuccess("КТЖ lesson saved as a draft. Generate materials when ready.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the lesson plan");
    } finally {
      setSaving(false);
    }
  }

  async function runPlanAction(plan: TeacherLessonPlanItem, action: "generate" | "save" | "approve") {
    setBusyId(plan.id);
    setError(null);
    setSuccess(null);
    try {
      let updated: TeacherLessonPlanItem;
      if (action === "generate") {
        updated = await generateTeacherLessonMaterial(plan.id);
        setSuccess(`Materials generated for lesson ${plan.sequenceNumber}. Review and edit the draft below.`);
      } else if (action === "approve") {
        const savedDraft = await updateTeacherLessonPlan(plan.id, {
          ...toPlanInput(plan),
          lessonMaterial: materials[plan.id] || null
        });
        updated = await approveTeacherLessonMaterial(savedDraft.id);
        setSuccess(`Lesson ${plan.sequenceNumber} materials approved.`);
      } else {
        updated = await updateTeacherLessonPlan(plan.id, {
          ...toPlanInput(plan),
          lessonMaterial: materials[plan.id] || null
        });
        setSuccess(`Draft for lesson ${plan.sequenceNumber} saved.`);
      }
      setPlans((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMaterials((current) => ({ ...current, [updated.id]: updated.lessonMaterial || "" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update lesson material");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="screen app-screen">
      <header className="topbar">
        <div>
          <h2>КТЖ Lesson Planner</h2>
          <p className="muted">Turn a calendar-thematic plan topic into editable, reviewable lesson materials.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
      {loading ? <p>Loading lesson planning workspace...</p> : null}

      {!loading ? (
        <>
          <section className="card">
            <h3>Add lesson from КТЖ</h3>
            <p className="muted">Enter the plan topic, learning objectives, lesson date, and an optional task deadline/reminder.</p>
            <form className="form" onSubmit={handleCreate}>
              <label>
                Course section
                <select value={sectionId} onChange={(event) => setSectionId(event.target.value ? Number(event.target.value) : "")} required>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.subjectCode} — {section.subjectName}</option>
                  ))}
                </select>
              </label>
              <div className="inline-form">
                <label>Lesson number<input type="number" min="1" value={sequenceNumber} onChange={(event) => setSequenceNumber(event.target.value)} required /></label>
                <label>Lesson date<input type="date" value={lessonDate} onChange={(event) => setLessonDate(event.target.value)} required /></label>
                <label>Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={255} required /></label>
              </div>
              <label>Learning objectives<textarea value={objectives} onChange={(event) => setObjectives(event.target.value)} rows={3} maxLength={5000} required /></label>
              <div className="inline-form">
                <label>Task deadline<input type="datetime-local" value={taskDeadline} onChange={(event) => setTaskDeadline(event.target.value)} /></label>
                <label>Remind me at<input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} /></label>
              </div>
              <button type="submit" disabled={saving || !sections.length}>{saving ? "Saving..." : "Save КТЖ lesson"}</button>
            </form>
          </section>

          <section className="stack">
            <h3>Lesson materials and review</h3>
            {!plans.length ? <p className="muted">No lessons yet. Add one from your КТЖ plan above.</p> : null}
            {plans.map((plan) => (
              <article className="card" key={plan.id}>
                <div className="news-meta">
                  <strong>Lesson {plan.sequenceNumber}: {plan.topic}</strong>
                  <span className="badge">{plan.reviewStatus === "APPROVED" ? "Approved" : "Draft"}</span>
                </div>
                <p className="muted">{plan.subjectCode} — {plan.subjectName} · {plan.lessonDate}</p>
                <p><strong>Objectives:</strong> {plan.learningObjectives}</p>
                <p><strong>Task deadline:</strong> {displayDateTime(plan.taskDeadline)}</p>
                <p><strong>Reminder:</strong> {plan.reminderSentAt ? `Sent ${displayDateTime(plan.reminderSentAt)}` : displayDateTime(plan.reminderAt)}</p>
                {plan.reviewStatus === "DRAFT" ? (
                  <div className="stack">
                    <label>
                      Generated lesson package — edit before approval
                      <textarea
                        value={materials[plan.id] || ""}
                        onChange={(event) => setMaterials((current) => ({ ...current, [plan.id]: event.target.value }))}
                        rows={14}
                        placeholder="Generate a lesson package or paste your own draft here."
                      />
                    </label>
                    <div className="inline-form">
                      <button type="button" disabled={busyId === plan.id} onClick={() => void runPlanAction(plan, "generate")}>
                        {busyId === plan.id ? "Working..." : "Generate with AI"}
                      </button>
                      <button type="button" disabled={busyId === plan.id || !materials[plan.id]?.trim()} onClick={() => void runPlanAction(plan, "save")}>Save edits</button>
                      <button type="button" disabled={busyId === plan.id || !materials[plan.id]?.trim()} onClick={() => void runPlanAction(plan, "approve")}>Approve materials</button>
                    </div>
                  </div>
                ) : (
                  <pre className="lesson-material-content">{plan.lessonMaterial}</pre>
                )}
              </article>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
