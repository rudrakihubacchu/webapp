import { AnimeAPI } from "./api.js";
import { UI } from "./ui.js";

const PAGE_SIZE = 100;
let currentAnimeId = null;
let currentEpisodePage = 1;
let episodeHasNextPage = false;
let episodeController = null;

export async function openAnime(anime) {
  currentAnimeId = anime.mal_id;
  currentEpisodePage = 1;
  episodeHasNextPage = false;

  document.querySelector("#dialog-title").textContent = anime.title || "Anime details";
  document.querySelector("#dialog-synopsis").textContent =
    anime.synopsis || "Synopsis unavailable.";
  document.querySelector("#dialog-meta").textContent =
    `${anime.type || "Anime"} · ${anime.year || "Year unknown"} · Score ${anime.score ?? "N/A"}`;

  const image = document.querySelector("#dialog-image");
  image.src =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.image_url ||
    "";
  image.alt = anime.title || "Anime poster";

  document.querySelector("#episode-count").textContent =
    anime.episodes ? `${anime.episodes} listed` : "Episode count may be unknown";
  document.querySelector("#episode-notice").textContent = "Loading episode information…";
  document.querySelector("#episodes-more").hidden = true;
  UI.episodeList.replaceChildren();

  UI.dialog.showModal();
  await loadEpisodePage(1, false);
}

async function loadEpisodePage(page, append) {
  if (!currentAnimeId) return;

  if (episodeController) episodeController.abort();
  episodeController = new AbortController();

  const notice = document.querySelector("#episode-notice");
  const moreButton = document.querySelector("#episodes-more");

  moreButton.disabled = true;

  try {
    const result = await AnimeAPI.episodes(
      currentAnimeId,
      page,
      episodeController.signal
    );
    const episodes = result.data || [];

    UI.renderEpisodes(episodes, append);
    episodeHasNextPage = Boolean(result.pagination?.has_next_page);
    currentEpisodePage = page;

    notice.textContent = episodes.length
      ? "Episode listings are provided by Jikan and may be incomplete for some titles."
      : "No episode listings are currently available for this anime.";

    moreButton.hidden = !episodeHasNextPage;
  } catch (error) {
    if (error.name !== "AbortError") {
      notice.textContent = "Could not load episodes. Please try again shortly.";
      UI.toast("Episode information is temporarily unavailable.");
    }
  } finally {
    moreButton.disabled = false;
  }
}

document.querySelector("#episodes-more").addEventListener("click", () => {
  if (episodeHasNextPage) loadEpisodePage(currentEpisodePage + 1, true);
});

document.querySelector("#close-dialog").addEventListener("click", () => {
  UI.dialog.close();
});

UI.dialog.addEventListener("click", event => {
  if (event.target === UI.dialog) UI.dialog.close();
});

document.addEventListener("anime:open", event => openAnime(event.detail));
