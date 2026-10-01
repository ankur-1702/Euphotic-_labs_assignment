import { useState } from "react";

export default function DishCard({
  dish,
  values,
  dirty,
  saving,
  onDraftChange,
  onSave,
  onDiscard,
  index,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const id = String(dish.dishId);
  const change = (patch) => onDraftChange(dish, { ...values, ...patch });

  return (
    <article
      className={`dish-card transition-colors duration-200 ${dirty ? "is-dirty" : ""}`}
      data-id={id}
      style={{ "--card-delay": `${index * 55}ms` }}
    >
      <div className={`image-wrap ${imageFailed ? "image-broken" : ""}`}>
        {imageFailed ? (
          <div className="image-placeholder">
            <span>✳</span>
            <small>Image unavailable</small>
          </div>
        ) : (
          <img
            src={dish.imageUrl}
            alt={values.dishName || "Dish"}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <span
          className={`status-pill ${values.isPublished ? "published" : "unpublished"}`}
        >
          <i />
          {values.isPublished ? "Published" : "Draft"}
        </span>
        <span className="dish-number">#{id.padStart(2, "0")}</span>
      </div>
      <div className="card-content">
        <div className="card-title-row">
          <div>
            <p className="card-kicker">DISH NAME</p>
            <h2>{values.dishName || "Untitled dish"}</h2>
          </div>
          <button
            className="more-button"
            title={`Dish ${id} options`}
            aria-label="Dish options"
          >
            ···
          </button>
        </div>
        <label className="field-label" htmlFor={`name-${id}`}>
          Name
        </label>
        <input
          className="name-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91aa75]"
          id={`name-${id}`}
          maxLength={100}
          value={values.dishName}
          disabled={saving}
          placeholder="Give this dish a name"
          onChange={(event) => change({ dishName: event.target.value })}
        />
        <div className="card-meta">
          <span>
            VERSION <strong>v{dish.version}</strong>
          </span>
          <span>
            ID <strong>{id}</strong>
          </span>
        </div>
        <div className="publish-row">
          <div>
            <strong>Published on menu</strong>
            <span>Visible to your customers</span>
          </div>
          <label className="switch" aria-label="Toggle published status">
            <input
              type="checkbox"
              checked={values.isPublished}
              disabled={saving}
              onChange={(event) =>
                change({ isPublished: event.target.checked })
              }
            />
            <span className="slider" />
          </label>
        </div>
        <div className="card-actions">
          {dirty ? (
            <span className="unsaved-label">
              <i /> Unsaved changes
            </span>
          ) : (
            <span className="saved-label">✓ Up to date</span>
          )}
          <div className="action-buttons">
            <button
              className="button text-button"
              disabled={!dirty || saving}
              onClick={() => onDiscard(dish.dishId)}
            >
              Discard
            </button>
            <button
              className="button save-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#638354] focus-visible:ring-offset-2 active:scale-[0.98]"
              disabled={!dirty || saving}
              onClick={() => onSave(dish)}
            >
              {saving ? (
                <>
                  <span className="spinner" /> Saving
                </>
              ) : dirty ? (
                "Save changes"
              ) : (
                "Saved"
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
