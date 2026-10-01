const workspaceLinks = [
  ["⌂", "Overview", "#overview"],
  ["▦", "Dishes", "#dishes", true],
  ["▤", "Orders", "#orders"],
  ["♙", "Customers", "#customers"],
];

function NavigationGroup({ label, links, dishCount }) {
  return (
    <>
      <p className="nav-label">{label}</p>
      <nav aria-label={label.toLowerCase()}>
        {links.map(([icon, name, href, active]) => (
          <a
            className={`nav-item ${active ? "active" : ""}`}
            href={href}
            key={name}
          >
            <span className="nav-icon">{icon}</span>
            {name}
            {active && <span className="nav-count">{dishCount}</span>}
          </a>
        ))}
      </nav>
    </>
  );
}

export default function Sidebar({ dishCount }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Nosh home">
        <span className="brand-mark">n</span>
        <span>
          nosh<span className="brand-dot">.</span>
        </span>
      </a>
      <div className="workspace">
        <div className="workspace-icon">K</div>
        <div>
          <strong>Kitchen studio</strong>
          <span>Workspace</span>
        </div>
        <span className="chevron">⌄</span>
      </div>
      <NavigationGroup
        label="WORKSPACE"
        links={workspaceLinks}
        dishCount={dishCount}
      />
      <div className="preferences">
        <NavigationGroup
          label="PREFERENCES"
          links={[
            ["⚙", "Settings", "#settings"],
            ["?", "Help center", "#help"],
          ]}
        />
      </div>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>Need a hand?</strong>
          <p>Our team is always happy to help.</p>
          <a href="mailto:hello@nosh.app">
            Get support <span>↗</span>
          </a>
        </div>
        <div className="profile">
          <div className="avatar">AS</div>
          <div className="profile-copy">
            <strong>Ankur</strong>
            <span>Restaurant owner</span>
          </div>
          <span className="profile-menu">···</span>
        </div>
      </div>
    </aside>
  );
}
