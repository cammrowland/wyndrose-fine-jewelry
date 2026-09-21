/* =========================================================================
   Wyndrose Fine Jewelry
   Vanilla JS: password gate, sticky nav, mobile overlay, scroll reveals,
   scroll-spy. No dependencies, no build step.
   ========================================================================= */

/* Speculative-redesign gate. Plain text on purpose: a polite barrier,
   not real security. */
const SITE_PASSWORD = "mydemo";

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Password gate
     --------------------------------------------------------------------- */
  const gate = document.getElementById("gate");
  const gateForm = document.getElementById("gate-form");
  const gateInput = document.getElementById("gate-input");

  function unlock() {
    try { sessionStorage.setItem("fn-unlocked", "1"); } catch (e) { /* private mode */ }
    root.classList.add("is-unlocked");
    if (!gate) return;
    gate.classList.add("gate--closing");
    window.setTimeout(function () {
      if (gate.parentNode) gate.parentNode.removeChild(gate);
    }, reduceMotion ? 0 : 500);
  }

  if (root.classList.contains("is-unlocked")) {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
  } else if (gateForm && gateInput) {
    window.setTimeout(function () { gateInput.focus(); }, 120);

    gateForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (gateInput.value === SITE_PASSWORD) {
        unlock();
      } else {
        gateInput.classList.remove("is-wrong");
        void gateInput.offsetWidth; /* restart the shake */
        gateInput.classList.add("is-wrong");
        gateInput.value = "";
        gateInput.focus();
      }
    });

    gateInput.addEventListener("animationend", function () {
      gateInput.classList.remove("is-wrong");
    });
  }

  /* ---------------------------------------------------------------------
     Sticky header: background blur-in past 40px
     --------------------------------------------------------------------- */
  const header = document.getElementById("header");
  let ticking = false;

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Mobile navigation overlay
     --------------------------------------------------------------------- */
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobile-nav");

  function setMenu(open) {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.toggle("is-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    if (header) header.classList.toggle("is-menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      setMenu(!mobileNav.classList.contains("is-open"));
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
        setMenu(false);
        hamburger.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && mobileNav.classList.contains("is-open")) {
        setMenu(false);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveals: 12px up + fade, 80ms stagger between siblings in a row
     --------------------------------------------------------------------- */
  const revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealItems.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    const groups = new Map();
    revealItems.forEach(function (el) {
      const parent = el.parentNode;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = groups.get(el.parentNode) || [el];
        const index = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(index, 6) * 80 + "ms";
        el.classList.add("is-in");
        revealObserver.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Scroll-spy: gold underline on the nav item for the section in view
     --------------------------------------------------------------------- */
  const navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  const sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const visible = new Set();

    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });

      let activeId = null;
      for (let i = 0; i < sections.length; i++) {
        if (visible.has(sections[i].id)) { activeId = sections[i].id; break; }
      }

      navLinks.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + activeId);
      });
    }, { rootMargin: "-30% 0px -45% 0px", threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }
})();
