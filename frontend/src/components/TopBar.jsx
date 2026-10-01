export default function TopBar() {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>Dishes</strong>
      </div>
      <div className="top-actions">
        <span className="live-indicator">
          <i /> Live sync on
        </span>
        <button className="icon-button" aria-label="Notifications">
          ♧<b />
        </button>
        <div className="top-avatar">AS</div>
      </div>
    </header>
  );
}
