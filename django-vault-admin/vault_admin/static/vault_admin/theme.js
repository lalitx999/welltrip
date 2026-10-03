(() => {
  "use strict";
  const sidebar = document.getElementById("vault-sidebar");
  if (!sidebar) return;
  const button = document.querySelector(".vault-menu");
  const backdrop = document.querySelector(".vault-backdrop");
  const setOpen = (open) => {
    document.body.classList.toggle("vault-nav-open", open);
    button?.setAttribute("aria-expanded", String(open));
    if (backdrop) backdrop.hidden = !open;
  };
  button?.addEventListener("click", () => setOpen(!document.body.classList.contains("vault-nav-open")));
  backdrop?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("vault-nav-open")) {
      setOpen(false); button?.focus();
    }
  });
  const path = window.location.pathname;
  sidebar.querySelectorAll("a[href]").forEach((link) => {
    const target = new URL(link.href).pathname;
    if (path === target || (link.classList.contains("vault-nav-link") && path.startsWith(target))) {
      link.classList.add("is-active"); link.setAttribute("aria-current", "page");
    }
  });
  document.getElementById("vault-filter")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLocaleLowerCase();
    let visible = 0;
    sidebar.querySelectorAll(".vault-nav-group").forEach((group) => {
      let matches = 0;
      group.querySelectorAll(".vault-nav-link").forEach((link) => {
        link.hidden = !`${group.querySelector("h2").textContent} ${link.textContent}`.toLocaleLowerCase().includes(query);
        if (!link.hidden) matches++;
      });
      group.hidden = matches === 0; visible += matches;
    });
    document.getElementById("vault-no-results").hidden = visible > 0;
  });
})();
