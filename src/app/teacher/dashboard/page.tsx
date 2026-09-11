import {
  activity,
  classes,
  reminders,
  schedule,
  stats,
  teacherName,
  teacherSubject,
  todos,
  type TodoType,
} from "@/lib/mock/teacher-dashboard";

const TODO_TYPE_LABEL: Record<TodoType, string> = {
  attendance: "Attendance",
  quiz: "Quiz",
  meeting: "Meeting",
  document: "Document",
  other: "Other",
};

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

export default function TeacherDashboardPage() {
  const firstName = teacherName.split(" ")[0];
  const today = todayLabel();

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {firstName}</h1>
        <p>
          {teacherSubject} · {today}
        </p>
      </div>

      <div className="stat-row">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat-tile">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="panel card" style={{ marginBottom: "var(--space-5)" }}>
        <h2>Today&apos;s schedule</h2>
        <div className="schedule-list">
          {schedule.map((slot) => (
            <div key={slot.id} className="schedule-row">
              <span className="schedule-time">{slot.time}</span>
              <span className="schedule-section">{slot.section}</span>
              <span className="schedule-room">{slot.room}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel card">
          <h2>
            To-do — <span className="panel-date">{today}</span>
          </h2>
          {todos.map((todo) => (
            <div key={todo.id} className="todo-row">
              <span className="todo-check" aria-hidden />
              <span className="todo-text">{todo.text}</span>
              <span className="todo-type">{TODO_TYPE_LABEL[todo.type]}</span>
            </div>
          ))}
        </div>

        <div className="panel card">
          <h2>
            Reminders — <span className="panel-date">{today}</span>
          </h2>
          {reminders.map((reminder) => (
            <div key={reminder.id} className={`feed-item weight-${reminder.weight}`}>
              {reminder.text}
            </div>
          ))}
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "var(--space-6)" }}>
        <h1 style={{ fontSize: "18px" }}>Your sections</h1>
      </div>
      <div className="class-grid">
        {classes.map((cls) => (
          <div key={cls.id} className="card class-card">
            <h3>{cls.name}</h3>
            <p>{cls.section}</p>
            <span className="class-count">{cls.students} students</span>
          </div>
        ))}
      </div>

      <div className="panel card">
        <h2>Recent activity</h2>
        {activity.map((item) => (
          <div key={item.id} className="feed-item">
            {item.text}
            <span className="feed-when">{item.when}</span>
          </div>
        ))}
      </div>
    </>
  );
}
