const CHEVRON_SVG = `<svg class="cb-categoryPickerChevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CHECK_SVG = `<svg class="cb-categoryPickerCheck" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let activePicker = null;

function closeActivePicker() {
  activePicker?.cbClose?.();
}

function bindGlobalDismiss() {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("keydown", onDocumentKeyDown, true);
}

function unbindGlobalDismiss() {
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  document.removeEventListener("keydown", onDocumentKeyDown, true);
}

function isOutsidePicker(picker, menu, target) {
  if (!picker || !target) return true;
  if (picker.contains(target)) return false;
  if (menu?.contains(target)) return false;
  return true;
}

function onDocumentPointerDown(event) {
  if (!activePicker) return;
  if (isOutsidePicker(activePicker, activePicker._menu, event.target)) {
    closeActivePicker();
  }
}

function onDocumentKeyDown(event) {
  if (event.key === "Escape") {
    closeActivePicker();
  }
}

function renderOptions(menu, options, value, onSelect, { showAddCategoryOption = false, onAddCategory } = {}) {
  menu.replaceChildren();
  for (const option of options) {
    const isSelected = option === value;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cb-categoryPickerOption${isSelected ? " cb-categoryPickerOption--selected" : ""}`;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(isSelected));

    const label = document.createElement("span");
    label.className = "cb-categoryPickerOptionLabel";
    label.textContent = option;

    const check = document.createElement("span");
    check.className = "cb-categoryPickerOptionCheck";
    check.innerHTML = CHECK_SVG;
    check.hidden = !isSelected;

    btn.appendChild(label);
    btn.appendChild(check);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onSelect(option);
      closeActivePicker();
    });
    menu.appendChild(btn);
  }

  if (showAddCategoryOption) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "cb-categoryPickerOption cb-categoryPickerOption--add";
    addBtn.setAttribute("role", "option");

    const label = document.createElement("span");
    label.className = "cb-categoryPickerOptionLabel";
    label.textContent = "Add category";

    addBtn.appendChild(label);
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeActivePicker();
      onAddCategory?.();
    });
    menu.appendChild(addBtn);
  }
}

function positionMenu(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  const menuWidth = menu.offsetWidth || 196;
  const menuHeight = menu.offsetHeight || 0;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp = menuHeight > 0 && spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

  const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
  menu.style.position = "fixed";
  menu.style.left = `${left}px`;
  menu.style.right = "auto";
  menu.style.zIndex = "100";

  if (openUp) {
    menu.style.top = "auto";
    menu.style.bottom = `${window.innerHeight - rect.top + 6}px`;
  } else {
    menu.style.bottom = "auto";
    menu.style.top = `${rect.bottom + 6}px`;
  }
}

function resetMenuPosition(menu) {
  menu.style.position = "";
  menu.style.left = "";
  menu.style.right = "";
  menu.style.top = "";
  menu.style.bottom = "";
  menu.style.zIndex = "";
}

/**
 * ChatGPT-style model picker for choosing a clip label/category.
 */
export function createCategoryPicker({
  value,
  options = [],
  onChange,
  showAddCategoryOption = false,
  onAddCategory
} = {}) {
  const root = document.createElement("div");
  root.className = "cb-categoryPicker";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cb-categoryPickerTrigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const triggerLabel = document.createElement("span");
  triggerLabel.className = "cb-categoryPickerLabel";
  triggerLabel.textContent = value ?? options[0] ?? "";

  trigger.appendChild(triggerLabel);
  trigger.insertAdjacentHTML("beforeend", CHEVRON_SVG);

  const menu = document.createElement("div");
  menu.className = "cb-categoryPickerMenu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  root._menu = menu;

  let currentValue = value ?? options[0] ?? "";
  let isOpen = false;

  const pickerExtras = () => ({ showAddCategoryOption, onAddCategory });

  function setValue(next) {
    currentValue = next;
    triggerLabel.textContent = next;
    renderOptions(menu, options, currentValue, (selected) => {
      currentValue = selected;
      triggerLabel.textContent = selected;
      onChange?.(selected);
    }, pickerExtras());
  }

  function openMenu() {
    if (isOpen) return;
    closeActivePicker();
    isOpen = true;
    activePicker = root;
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    renderOptions(menu, options, currentValue, (selected) => {
      setValue(selected);
      onChange?.(selected);
    }, pickerExtras());
    document.body.appendChild(menu);
    requestAnimationFrame(() => positionMenu(trigger, menu));
    bindGlobalDismiss();
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    resetMenuPosition(menu);
    root.appendChild(menu);
    if (activePicker === root) activePicker = null;
    unbindGlobalDismiss();
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen) closeMenu();
    else openMenu();
  });

  root.cbSetValue = setValue;
  root.cbClose = closeMenu;
  root.cbSetOptions = (nextOptions) => {
    options = nextOptions;
    if (!options.includes(currentValue)) {
      setValue(nextOptions[0] ?? "");
    } else {
      renderOptions(menu, options, currentValue, (selected) => {
        setValue(selected);
        onChange?.(selected);
      }, pickerExtras());
    }
  };

  setValue(currentValue);
  root.appendChild(trigger);
  root.appendChild(menu);
  return root;
}
