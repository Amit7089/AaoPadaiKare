
export default function FeatureCard({
  icon,
  title,
  description,
  color = "feature-purple",
}) {
  return (
    <article className="feature-card">
      <div className={`feature-icon ${color}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
