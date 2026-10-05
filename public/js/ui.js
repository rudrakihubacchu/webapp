export const UI = {
  grid: document.querySelector("#anime-grid"),
  notice: document.querySelector("#notice"),
  dialog: document.querySelector("#anime-dialog"),
  episodeList: document.querySelector("#episode-list"),

  toast(message) {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  },

  loading() {
    this.grid.innerHTML = Array.from({ length: 12 }, () =>
      '<div class="skeleton" aria-hidden="true"></div>'
    ).join("");
  },

  renderAnime(items, append = false) {
    if (!append) this.grid.replaceChildren();

    if (!items?.length && !append) {
      this.grid.innerHTML = '<p class="muted">No anime found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((anime, index) => {
      const card = document.createElement("article");
      card.className = "card";
      card.style.animationDelay = `${Math.min(index * 30, 300)}ms`;

      const posterWrap = document.createElement("div");
      posterWrap.className = "poster-wrap";

      const image = document.createElement("img");
      image.className = "poster";
      image.loading = index < 4 ? "eager" : "lazy";
      image.decoding = "async";
      image.alt = anime.title || "Anime poster";
      image.src =
        anime.images?.webp?.large_image_url ||
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        "";
      image.onerror = () => {
        image.removeAttribute("src");
        image.alt = "Poster unavailable";
        posterWrap.classList.add("poster-fallback");
      };

      const score = document.createElement("span");
      score.className = "poster-score";
      score.textContent = `★ ${anime.score ?? "N/A"}`;

      posterWrap.append(image, score);

      const content = document.createElement("div");
      content.className = "card-content";

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = anime.title || "Untitled";

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${anime.type || "Anime"} · ${anime.episodes ?? "Unknown"} episodes`;

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const detailsButton = document.createElement("button");
      detailsButton.type = "button";
      detailsButton.textContent = "Details";
      detailsButton.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("anime:open", { detail: anime }));
      });

      actions.append(detailsButton);
      content.append(title, meta, actions);
      card.append(posterWrap, content);
      fragment.append(card);
    });

    this.grid.append(fragment);
  },

  renderEpisodes(episodes, append = false) {
    if (!append) this.episodeList.replaceChildren();

    for (const episode of episodes) {
      const item = document.createElement("div");
      item.className = "episode-item";

      const number = document.createElement("strong");
      number.textContent = `Episode ${episode.mal_id ?? "?"}`;

      const title = document.createElement("span");
      title.textContent = episode.title || "Title unavailable";

      item.append(number, title);
      this.episodeList.append(item);
    }
  }
};
