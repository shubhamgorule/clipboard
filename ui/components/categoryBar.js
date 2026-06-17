/**
 * Horizontally scrollable category tabs.
 */
export function createCategoryBar({ categories = [], activeCategory, onSelect } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "cb-categoriesWrap";

  const scroller = document.createElement("div");
  scroller.className = "cb-categoriesScroller";

  const track = document.createElement("div");
  track.className = "cb-categories";

  for (const name of categories) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `cb-categoryChip ${activeCategory === name ? "cb-categoryChipActive" : ""}`;
    chip.addEventListener("click", () => onSelect?.(name));

    const label = document.createElement("p");
    label.className = "cb-categoryChipText";
    label.textContent = name;
    chip.appendChild(label);
    track.appendChild(chip);
  }

  scroller.appendChild(track);
  wrap.appendChild(scroller);

  function scrollActiveChipIntoView() {
    const active = track.querySelector(".cb-categoryChipActive");
    if (!active) return;
    const scrollerLeft = scroller.scrollLeft;
    const scrollerRight = scrollerLeft + scroller.clientWidth;
    const chipLeft = active.offsetLeft;
    const chipRight = chipLeft + active.offsetWidth;
    if (chipLeft < scrollerLeft) {
      scroller.scrollLeft = chipLeft;
    } else if (chipRight > scrollerRight) {
      scroller.scrollLeft = chipRight - scroller.clientWidth;
    }
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      scrollActiveChipIntoView();
    });
    observer.observe(scroller);
    observer.observe(track);
  }

  queueMicrotask(scrollActiveChipIntoView);

  return wrap;
}
