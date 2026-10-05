import { AnimeAPI } from "./api.js";
import { UI } from "./ui.js";
import "./player.js";

let currentPage = 1;
let currentQuery = "";
let hasNextPage = false;
let searchTimer = null;
let searchController = null;
let requestController = null;

const title = document.querySelector("#section-title");
const label = document.querySelector("#result-label");
const loadMore = document.querySelector("#load-more");
const searchInput = document.querySelector("#search-input");
const searchForm = document.querySelector("#search-form");

async function loadCatalog({ page = 1, append = false } = {}) {
  if (requestController) requestController.abort();
  requestController = new AbortController();

  loadMore.disabled = true;
  UI.notice.textContent = "";

  if (!append) UI.loading();

  try {
    const response = currentQuery
      ? await AnimeAPI.search(currentQuery, page, requestController.signal)
      : await AnimeAPI.top(page, requestController.signal);

    UI.renderAnime(response.data || [], append);
    currentPage = page;
    hasNextPage = Boolean(response.pagination?.has_next_page);
    loadMore.hidden = !hasNextPage;
    title.textContent = currentQuery ? `Results for “${currentQuery}”` : "Top Anime";
    label.textContent = currentQuery ? "SEARCH" : "EXPLORE";
  } catch (error) {
    if (error.name !== "AbortError") {
      UI.notice.textContent = "Catalog could not be loaded. Please try again.";
      UI.grid.innerHTML = "";
      UI.toast("Anime service is temporarily unavailable.");
    }
  } finally {
    loadMore.disabled = false;
  }
}

function runSearch(query) {
  currentQuery = query.trim();
  currentPage = 1;
  loadCatalog({ page: 1 });
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  if (searchController) searchController.abort();

  const query = searchInput.value.trim();

  searchTimer = setTimeout(() => {
    if (query.length < 2) {
      currentQuery = "";
      loadCatalog({ page: 1 });
      return;
    }
    runSearch(query);
  }, 450);
});

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  clearTimeout(searchTimer);
  runSearch(searchInput.value);
});

loadMore.addEventListener("click", () => {
  if (hasNextPage) loadCatalog({ page: currentPage + 1, append: true });
});

loadCatalog();
