import { type FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  createAdminNews,
  fetchAdminDormBuildings,
  fetchAdminDormRooms,
  fetchAdminFoodItems,
  fetchAdminGradeChangeRequests,
  fetchAdminStudents,
  reviewAdminGradeChangeRequest,
  uploadAdminDormBuildingImage,
  uploadAdminDormRoomImage,
  uploadAdminFoodItemImage,
  updateAdminStudentStatus
} from "../../lib/api";
import type {
  AdminDormBuildingImageItem,
  AdminDormRoomImageItem,
  AdminFoodItemImageItem,
  AdminGradeChangeItem,
  AdminSimpleStudentItem
} from "../../types/admin";

const studentStatuses = ["ACTIVE", "ON_LEAVE", "GRADUATED"] as const;

export default function AdminModerationPage() {
  const [students, setStudents] = useState<AdminSimpleStudentItem[]>([]);
  const [gradeChanges, setGradeChanges] = useState<AdminGradeChangeItem[]>([]);
  const [foodItems, setFoodItems] = useState<AdminFoodItemImageItem[]>([]);
  const [dormBuildings, setDormBuildings] = useState<AdminDormBuildingImageItem[]>([]);
  const [dormRooms, setDormRooms] = useState<AdminDormRoomImageItem[]>([]);
  const [studentId, setStudentId] = useState<number | "">("");
  const [studentStatus, setStudentStatus] = useState<(typeof studentStatuses)[number]>("ACTIVE");
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<number | "">("");
  const [selectedDormBuildingId, setSelectedDormBuildingId] = useState<number | "">("");
  const [selectedDormRoomId, setSelectedDormRoomId] = useState<number | "">("");
  const [foodImage, setFoodImage] = useState<File | null>(null);
  const [dormBuildingImage, setDormBuildingImage] = useState<File | null>(null);
  const [dormRoomImage, setDormRoomImage] = useState<File | null>(null);
  const [foodImageInputKey, setFoodImageInputKey] = useState(0);
  const [dormBuildingImageInputKey, setDormBuildingImageInputKey] = useState(0);
  const [dormRoomImageInputKey, setDormRoomImageInputKey] = useState(0);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCategory, setNewsCategory] = useState("GENERAL");
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [newsImageInputKey, setNewsImageInputKey] = useState(0);
  const [reviewComment, setReviewComment] = useState("Reviewed by registrar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, gradeChangesPage, foodItemsData, dormBuildingsData, dormRoomsData] = await Promise.all([
        fetchAdminStudents(),
        fetchAdminGradeChangeRequests(0, 100),
        fetchAdminFoodItems(),
        fetchAdminDormBuildings(),
        fetchAdminDormRooms()
      ]);
      setStudents(studentsData);
      setGradeChanges(gradeChangesPage.items);
      setFoodItems(foodItemsData);
      setDormBuildings(dormBuildingsData);
      setDormRooms(dormRoomsData);
      const firstStudentId = studentsData[0]?.id ?? "";
      setStudentId(firstStudentId);
      const firstStudent = studentsData.find((item) => item.id === firstStudentId);
      if (firstStudent && (studentStatuses as readonly string[]).includes(firstStudent.status)) {
        setStudentStatus(firstStudent.status as (typeof studentStatuses)[number]);
      }
      setSelectedFoodItemId((current) => current || (foodItemsData[0]?.id ?? ""));
      setSelectedDormBuildingId((current) => current || (dormBuildingsData[0]?.id ?? ""));
      setSelectedDormRoomId((current) => current || (dormRoomsData[0]?.id ?? ""));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load moderation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleUpdateStudentStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentId) return;
    setError(null);
    setSuccess(null);
    try {
      await updateAdminStudentStatus(Number(studentId), studentStatus);
      setSuccess("Student status updated");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update student status");
    }
  }

  async function handleCreateNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createAdminNews(newsTitle.trim(), newsContent.trim(), newsCategory.trim(), newsImage);
      setSuccess("News post created");
      setNewsTitle("");
      setNewsContent("");
      setNewsCategory("GENERAL");
      setNewsImage(null);
      setNewsImageInputKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create news");
    }
  }

  async function handleUploadFoodImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFoodItemId || !foodImage) return;
    setError(null);
    setSuccess(null);
    try {
      await uploadAdminFoodItemImage(Number(selectedFoodItemId), foodImage);
      setFoodImage(null);
      setFoodImageInputKey((value) => value + 1);
      setSuccess("Food photo updated");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload food photo");
    }
  }

  async function handleUploadDormBuildingImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDormBuildingId || !dormBuildingImage) return;
    setError(null);
    setSuccess(null);
    try {
      await uploadAdminDormBuildingImage(Number(selectedDormBuildingId), dormBuildingImage);
      setDormBuildingImage(null);
      setDormBuildingImageInputKey((value) => value + 1);
      setSuccess("Dorm building photo updated");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload dorm building photo");
    }
  }

  async function handleUploadDormRoomImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDormRoomId || !dormRoomImage) return;
    setError(null);
    setSuccess(null);
    try {
      await uploadAdminDormRoomImage(Number(selectedDormRoomId), dormRoomImage);
      setDormRoomImage(null);
      setDormRoomImageInputKey((value) => value + 1);
      setSuccess("Dorm room photo updated");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload dorm room photo");
    }
  }

  async function reviewGradeChange(requestId: number, approve: boolean) {
    setError(null);
    setSuccess(null);
    try {
      await reviewAdminGradeChangeRequest(requestId, approve, reviewComment);
      setSuccess(`Grade change request ${approve ? "approved" : "rejected"}`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to review grade change");
    }
  }

  const selectedFoodItem = foodItems.find((item) => item.id === selectedFoodItemId) ?? null;
  const selectedDormBuilding = dormBuildings.find((item) => item.id === selectedDormBuildingId) ?? null;
  const selectedDormRoom = dormRooms.find((item) => item.id === selectedDormRoomId) ?? null;

  return (
    <div className="screen app-screen">
      <header className="topbar">
        <h2>Admin Moderation & Content</h2>
      </header>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      {!loading ? (
        <>
          <section className="card">
            <h3>Update Student Status</h3>
            <form className="inline-form" onSubmit={handleUpdateStudentStatus}>
              <label>
                Student
                <select
                  value={studentId}
                  onChange={(event) => {
                    const nextStudentId = event.target.value ? Number(event.target.value) : "";
                    setStudentId(nextStudentId);
                    const selected = students.find((item) => item.id === nextStudentId);
                    if (selected && (studentStatuses as readonly string[]).includes(selected.status)) {
                      setStudentStatus(selected.status as (typeof studentStatuses)[number]);
                    }
                  }}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.id} - {student.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={studentStatus} onChange={(event) => setStudentStatus(event.target.value as (typeof studentStatuses)[number])}>
                  {studentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={!studentId}>
                Update Status
              </button>
            </form>
          </section>

          <section className="card">
            <h3>Grade Change Review</h3>
            <label>
              Review Comment
              <input value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
            </label>
            {gradeChanges.length === 0 ? <p className="muted">No pending requests.</p> : null}
            {gradeChanges.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Teacher</th>
                      <th>Student</th>
                      <th>Section</th>
                      <th>Old</th>
                      <th>New</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeChanges.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.teacherId}</td>
                        <td>{item.studentId}</td>
                        <td>{item.sectionId}</td>
                        <td>{item.oldValue ?? "-"}</td>
                        <td>{item.newValue ?? "-"}</td>
                        <td>{item.reason}</td>
                        <td>{item.status}</td>
                        <td className="actions">
                          <button type="button" onClick={() => reviewGradeChange(item.id, true)}>
                            Approve
                          </button>
                          <button type="button" onClick={() => reviewGradeChange(item.id, false)}>
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="card">
            <h3>Campus Life Images</h3>
            <div className="service-card-grid service-card-grid-compact">
              <form className="form" onSubmit={handleUploadFoodImage}>
                <h4>Food item photo</h4>
                <label>
                  Food item
                  <select value={selectedFoodItemId} onChange={(event) => setSelectedFoodItemId(event.target.value ? Number(event.target.value) : "")}>
                    {foodItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {(item.categoryName || "Food")} - {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedFoodItem?.imageUrl ? (
                  <img className="admin-image-preview" src={selectedFoodItem.imageUrl} alt={selectedFoodItem.name} />
                ) : (
                  <div className="service-media-placeholder admin-image-preview-placeholder">No photo yet</div>
                )}
                <label>
                  Upload image
                  <input
                    key={foodImageInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setFoodImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button type="submit" disabled={!selectedFoodItemId || !foodImage}>
                  Upload Food Photo
                </button>
              </form>

              <form className="form" onSubmit={handleUploadDormBuildingImage}>
                <h4>Dorm building photo</h4>
                <label>
                  Building
                  <select value={selectedDormBuildingId} onChange={(event) => setSelectedDormBuildingId(event.target.value ? Number(event.target.value) : "")}>
                    {dormBuildings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedDormBuilding?.imageUrl ? (
                  <img className="admin-image-preview" src={selectedDormBuilding.imageUrl} alt={selectedDormBuilding.name} />
                ) : (
                  <div className="service-media-placeholder admin-image-preview-placeholder">No photo yet</div>
                )}
                <label>
                  Upload image
                  <input
                    key={dormBuildingImageInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setDormBuildingImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button type="submit" disabled={!selectedDormBuildingId || !dormBuildingImage}>
                  Upload Building Photo
                </button>
              </form>

              <form className="form" onSubmit={handleUploadDormRoomImage}>
                <h4>Dorm room photo</h4>
                <label>
                  Room
                  <select value={selectedDormRoomId} onChange={(event) => setSelectedDormRoomId(event.target.value ? Number(event.target.value) : "")}>
                    {dormRooms.map((item) => (
                      <option key={item.id} value={item.id}>
                        {(item.dormBuildingName || "Dorm")} - Room {item.roomNumber}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedDormRoom?.imageUrl || selectedDormRoom?.buildingImageUrl ? (
                  <img
                    className="admin-image-preview"
                    src={selectedDormRoom.imageUrl || selectedDormRoom.buildingImageUrl || ""}
                    alt={`Room ${selectedDormRoom?.roomNumber || ""}`}
                  />
                ) : (
                  <div className="service-media-placeholder admin-image-preview-placeholder">No photo yet</div>
                )}
                <label>
                  Upload image
                  <input
                    key={dormRoomImageInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setDormRoomImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button type="submit" disabled={!selectedDormRoomId || !dormRoomImage}>
                  Upload Room Photo
                </button>
              </form>
            </div>
          </section>

          <section className="card">
            <h3>Create News</h3>
            <form className="form" onSubmit={handleCreateNews}>
              <label>
                Title
                <input value={newsTitle} onChange={(event) => setNewsTitle(event.target.value)} required />
              </label>
              <label>
                Content
                <textarea value={newsContent} onChange={(event) => setNewsContent(event.target.value)} rows={4} required />
              </label>
              <label>
                Category
                <input value={newsCategory} onChange={(event) => setNewsCategory(event.target.value)} />
              </label>
              <label>
                Photo
                <input
                  key={newsImageInputKey}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => setNewsImage(event.target.files?.[0] ?? null)}
                />
              </label>
              <button type="submit">Create News</button>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}

