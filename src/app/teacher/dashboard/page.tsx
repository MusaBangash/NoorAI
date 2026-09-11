import {
  activity,
  classes,
  reminders,
  schedule,
  stats,
  teacherName,
  todos,
  type TodoType,
} from "@/lib/mock/teacher-dashboard";
import {
  IconActivity,
  IconBell,
  IconCheckCircle,
  IconChecklist,
  IconClock,
  IconGrid,
  IconPencil,
  IconUsers,
} from "@/components/shell/Icons";

const TODO_TYPE_LABEL: Record<TodoType, string> = {
  attendance: "Attendance",
  quiz: "Quiz",
  meeting: "Meeting",
  document: "Document",
  other: "Other",
};

const STAT_ICON = [IconGrid, IconUsers, IconCheckCircle, IconPencil];

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

function subjectsLabel() {
  const subjects = Array.from(new Set(classes.map((c) => c.subject)));
  return subjects.length > 1 ? `${subjects.length} subjects` : subjects[0];
}

export default function TeacherDashboardPage() {
  const firstName = teacherName.split(" ")[0];
  const today = todayLabel();

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {firstName}</h1>
        <p>
          {subjectsLabel()} · {today}
        </p>
      </div>

      <div className="stat-row dash-block">
        {stats.map((stat, i) => {
          const Icon = STAT_ICON[i];
          return (
            <div key={stat.label} className="card stat-tile">
              <div className="stat-icon">
                <Icon />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel card dash-block">
        <div className="panel-title">
          <span className="panel-title-icon">
            <IconClock />
          </span>
          <h2>Today&apos;s schedule</h2>
        </div>
        <div className="schedule-list panel-body">
          {schedule.map((slot) => (
            <div key={slot.id} className="schedule-row">
              <span className="schedule-time">{slot.time}</span>
              <span className="schedule-section">
                {slot.subject} — {slot.section}
              </span>
              <span className="schedule-room">{slot.room}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-grid dash-block">
        <div className="panel card">
          <div className="panel-title">
            <span className="panel-title-icon">
              <IconChecklist />
            </span>
            <h2>
              To-do — <span className="panel-date">{today}</span>
            </h2>
          </div>
          <div className="panel-body">
            {todos.map((todo) => (
              <div key={todo.id} className="todo-row">
                <span className="todo-check" aria-hidden />
                <span className="todo-text">{todo.text}</span>
                <span className={`todo-type todo-type-${todo.type}`}>{TODO_TYPE_LABEL[todo.type]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel card">
          <div className="panel-title">
            <span className="panel-title-icon">
              <IconBell />
            </span>
            <h2>
              Reminders — <span className="panel-date">{today}</span>
            </h2>
          </div>
          <div className="panel-body">
            {reminders.map((reminder) => (
              <div key={reminder.id} className={`feed-item weight-${reminder.weight}`}>
                {reminder.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="section-title">Your sections</h2>
      {Array.from(new Set(classes.map((c) => c.subject))).map((subjectName) => (
        <div key={subjectName} className="subject-group dash-block">
          <h3 className="subject-group-title">{subjectName}</h3>
          <div className="class-grid">
            {classes
              .filter((cls) => cls.subject === subjectName)
              .map((cls) => (
                <div key={cls.id} className="card class-card">
                  <h4>{cls.section}</h4>
                  <span className="class-count">{cls.students} students</span>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="panel card">
        <div className="panel-title">
          <span className="panel-title-icon">
            <IconActivity />
          </span>
          <h2>Recent activity</h2>
        </div>
        <div className="panel-body">
          {activity.map((item) => (
            <div key={item.id} className="feed-item">
              {item.text}
              <span className="feed-when">{item.when}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
