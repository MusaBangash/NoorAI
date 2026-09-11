import { activity, classes, reminders, stats, teacherName, todos } from "@/lib/mock/teacher-dashboard";

export default function TeacherDashboardPage() {
  const firstName = teacherName.split(" ")[0];

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {firstName}</h1>
        <p>Here&apos;s what needs your attention today.</p>
      </div>

      <div className="stat-row">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat-tile">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="panel card">
          <h2>To-do</h2>
          {todos.map((todo) => (
            <div key={todo.id} className="todo-row">
              <span className="todo-check" aria-hidden />
              {todo.text}
            </div>
          ))}
        </div>

        <div className="panel card">
          <h2>Reminders</h2>
          {reminders.map((reminder) => (
            <div key={reminder.id} className={`feed-item weight-${reminder.weight}`}>
              {reminder.text}
            </div>
          ))}
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "var(--space-6)" }}>
        <h1 style={{ fontSize: "18px" }}>Your classes</h1>
      </div>
      <div className="class-grid">
        {classes.map((cls) => (
          <div key={cls.id} className="card class-card">
            <h3>{cls.name}</h3>
            <p>{cls.subject}</p>
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
