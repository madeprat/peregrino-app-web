
(() => {
  const search = document.getElementById("manualSearch");
  const chapters = [...document.querySelectorAll(".manual-chapter")];
  const empty = document.getElementById("manualEmpty");
  if (!search || !chapters.length) return;

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  search.addEventListener("input", () => {
    const query = normalize(search.value.trim());
    let visible = 0;

    chapters.forEach((chapter) => {
      const haystack = normalize(
        `${chapter.dataset.search || ""} ${chapter.textContent || ""}`
      );
      const show = !query || haystack.includes(query);
      chapter.hidden = !show;
      if (show) {
        visible += 1;
        if (query) chapter.open = true;
      }
    });

    empty.classList.toggle("show", visible === 0);
  });
})();
