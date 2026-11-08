const search = document.querySelector("#search");
const cards = [...document.querySelectorAll(".site-card")];
const filters = [...document.querySelectorAll("[data-filter]")];
let category = "All";
function update() {
  const term = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const card of cards) {
    const visible = (category === "All" || card.dataset.category === category) && card.dataset.search.includes(term);
    card.hidden = !visible;
    if (visible) count++;
  }
  document.querySelector("#result-count").textContent = `Showing ${count} ${count === 1 ? "entry" : "entries"}`;
  document.querySelector("#empty").hidden = count > 0;
}
search.addEventListener("input", update);
for (const button of filters) button.addEventListener("click", () => {
  category = button.dataset.filter;
  for (const filter of filters) filter.setAttribute("aria-pressed", String(filter === button));
  update();
});
