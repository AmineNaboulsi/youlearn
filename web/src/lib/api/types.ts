/**
 * Shapes returned by the YouLearn API.
 *
 * Hand-written rather than generated: the API is small, and a type that has to
 * be read and agreed with by a human is worth more here than one that silently
 * tracks whatever the backend happens to return today.
 */

export interface Paginated<T> {
  status: true;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface Envelope<T> {
  status: true;
  data: T;
}

export interface Tag {
  id: number;
  title: string;
  slug: string;
  course_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  course_count?: number;
}

export type ContentType = "text" | "video" | "document";

export interface Course {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  /** A remote http(s) cover URL, when the instructor supplied one. */
  img: string | null;
  /** Set instead of `img` when the cover was uploaded here. Serve via /api/media. */
  cover_public_id: string | null;
  description: string | null;
  content_type: ContentType;
  /** Only present on the single-course endpoint. */
  content?: string | null;
  price: string;
  is_published: 0 | 1;
  created_at: string;
  updated_at: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  instructor_id: number;
  instructor_name: string;
  /**
   * Set only when the instructor has published a profile. Null covers both
   * "no profile" and "profile unpublished" — the API does not distinguish them,
   * so neither does this.
   */
  instructor_profile_slug: string | null;
  enrollment_count: number;
  tags: Tag[];
}

export interface CourseDetail {
  status: true;
  data: Course;
  viewer?: {
    is_enrolled: boolean;
    can_manage: boolean;
    can_enroll: boolean;
  };
}

export interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  img: string | null;
  cover_public_id: string | null;
  content_type: ContentType;
  is_published: 0 | 1;
  category_name: string | null;
  instructor_name: string;
  enrolled_at: string;
}

export interface RosterRow {
  enrolled_at: string;
  course_id: number;
  course_title: string;
  learner_id: number;
  learner_name: string;
  learner_email: string;
  learner_active: 0 | 1;
}

export type Role = "admin" | "enseignant" | "etudiant";

export interface PlatformUser {
  id: number;
  keycloak_id: string;
  name: string;
  email: string;
  role: Role;
  is_active: 0 | 1;
  last_seen_at: string | null;
  created_at: string;
  enrollment_count: number;
  course_count: number;
}

export interface Me {
  id: number;
  subject: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  permissions: string[];
  member_since: string | null;
  last_seen_at: string | null;
  is_active: boolean;
  token_expires_at: string;
  teaching?: StatsSummary;
}

/* -----------------------------------------------------------------------------
 * Public instructor profile
 * -------------------------------------------------------------------------- */

/** Which blocks a profile renders. Off means the data is not sent at all. */
export interface ProfileSections {
  about: boolean;
  courses: boolean;
  stats: boolean;
  links: boolean;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileStats {
  published_courses: number;
  learners: number;
  lessons: number;
  duration_seconds: number;
}

/** A course as it appears on a profile: enough for a card, no more. */
export interface ProfileCourse {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  img: string | null;
  cover_public_id: string | null;
  content_type: ContentType;
  category_name: string | null;
  enrollment_count: number;
}

export type ProfileTheme = "light" | "dark";

/**
 * A profile as the world sees it.
 *
 * The nullable fields are not "optional data" — they are the sections their
 * owner switched off. The API omits the content rather than flagging it, so
 * there is nothing here for a client to accidentally reveal.
 */
export interface InstructorProfile {
  slug: string | null;
  name: string;
  role: Role;
  headline: string | null;
  avatar_public_id: string | null;
  member_since: string | null;
  theme: ProfileTheme;
  sections: ProfileSections;
  bio: string | null;
  location: string | null;
  links: ProfileLink[];
  stats: ProfileStats | null;
  courses: ProfileCourse[];
  course_total?: number;
}

/** The same profile plus the two fields only its owner is shown. */
export interface MyProfile extends InstructorProfile {
  is_public: boolean;
  suggested_slug: string;
}

export interface StatsSummary {
  courses: number;
  published_courses: number;
  enrollments: number;
  learners: number;
  enrollments_last_30_days: number;
}

export interface DashboardStats {
  scope: "platform" | "own";
  summary: StatsSummary;
  daily: Array<{ date: string; count: number }>;
  top_courses: Array<{
    id: number;
    title: string;
    slug: string;
    is_published: 0 | 1;
    enrollment_count: number;
  }>;
  people?: {
    admin: number;
    enseignant: number;
    etudiant: number;
    suspended: number;
  };
}

export interface UserSession {
  id: string;
  ip_address: string | null;
  started_at: string | null;
  last_seen_at: string | null;
  clients: string[];
  is_current: boolean;
  remember_me: boolean;
}

export interface ExportQuota {
  used: number;
  remaining: number;
  resets_in: number;
}

export interface ExportDataset {
  dataset: string;
  label: string;
  description: string;
  max_rows: number;
  per_window: number;
  window_hours: number;
  has_pii: boolean;
  may_unmask: boolean;
  scope: "platform" | "own";
  quota: ExportQuota;
}

export interface ExportCatalogue {
  datasets: ExportDataset[];
  global_quota: ExportQuota;
  absolute_max_rows: number;
}

export type ExportOutcome = "allowed" | "denied" | "rate_limited" | "truncated";

export interface ExportAuditEntry {
  id: number;
  actor_email: string;
  actor_role: Role;
  dataset: string;
  outcome: ExportOutcome;
  row_count: number;
  filters: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  requested_at: string;
}

/* -----------------------------------------------------------------------------
 * Curriculum, media and watch tracking
 * -------------------------------------------------------------------------- */

export type LessonKind = "video" | "text";

export interface LessonProgress {
  last_position_seconds: number;
  furthest_seconds: number;
  watched_seconds: number;
  completed: boolean;
}

/**
 * A lesson as it appears in the curriculum.
 *
 * `video_url` and `text_content` are absent — not null, absent — when the
 * viewer may not open the lesson. The API withholds them rather than sending
 * them with a `locked` flag, so there is nothing here for a client to reveal.
 */
export interface CurriculumLesson {
  id: number;
  title: string;
  summary: string | null;
  kind: LessonKind;
  duration_seconds: number;
  is_preview: boolean;
  position: number;
  locked: boolean;
  has_video: boolean;
  video_url?: string | null;
  video_mime?: string | null;
  text_content?: string | null;
  progress?: LessonProgress;
}

export interface CurriculumSection {
  id: number;
  title: string;
  summary: string | null;
  position: number;
  lessons: CurriculumLesson[];
  lesson_count: number;
  duration_seconds: number;
}

export interface CourseProgress {
  lessons: number;
  completed: number;
  watched_seconds: number;
  percent: number;
  next_lesson_id: number | null;
}

export interface Curriculum {
  sections: CurriculumSection[];
  lesson_count: number;
  duration_seconds: number;
  unlocked: boolean;
  can_manage: boolean;
  progress?: CourseProgress;
}

export interface LessonDetail {
  id: number;
  course_id: number;
  course_title: string;
  section_id: number;
  title: string;
  summary: string | null;
  kind: LessonKind;
  duration_seconds: number;
  is_preview: boolean;
  text_content: string | null;
  video_url: string | null;
  video_mime: string | null;
  previous_lesson_id: number | null;
  next_lesson_id: number | null;
  can_manage: boolean;
  progress?: LessonProgress;
}

export interface UploadedAsset {
  id: number;
  public_id: string;
  kind: "image" | "video";
  original_name: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number | null;
  url: string;
}

export interface UploadTicket {
  upload_id: string;
  chunk_size: number;
  received_bytes: number;
  accepted_types: string[];
  max_bytes: number;
}

export interface LessonAnalytics {
  id: number;
  title: string;
  kind: LessonKind;
  is_preview: boolean;
  section_title: string;
  duration_seconds: number;
  viewers: number;
  completions: number;
  avg_watched_seconds: number;
  total_watched_seconds: number;
  avg_completion_percent: number;
  last_activity_at: string | null;
}

export interface CourseAnalytics {
  summary: {
    active_learners: number;
    total_watched_seconds: number;
    completions: number;
    /** Distinct people whose progress moved in the last five minutes. */
    watching_now: number;
  };
  lessons: LessonAnalytics[];
  totals: { lessons: number; duration_seconds: number };
  generated_at: string;
}

export interface LearnerProgressRow {
  user_id: number;
  name: string;
  email: string;
  enrolled_at: string;
  watched_seconds: number;
  completed: number;
  lessons: number;
  percent: number;
  last_activity_at: string | null;
}
