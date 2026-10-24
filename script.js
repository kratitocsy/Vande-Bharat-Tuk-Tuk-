(function () {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("nav");
  const toast = document.getElementById("toast");
  const year = document.getElementById("year");
  let toastTimer;

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3600);
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      const open = body.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        body.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.classList.contains("nav-open")) {
        body.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) {
        body.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".ride-grid");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.dataset.tab;
      tabs.forEach(function (item) {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach(function (panel) {
        const active = panel.dataset.panel === target;
        panel.classList.toggle("is-active", active);
        if (active) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    });
  });

  const pickup = document.getElementById("pickup");
  const dropoff = document.getElementById("dropoff");
  const swapBtn = document.getElementById("swap-btn");

  if (swapBtn && pickup && dropoff) {
    swapBtn.addEventListener("click", function () {
      const temp = pickup.value;
      pickup.value = dropoff.value;
      dropoff.value = temp;
      pickup.focus();
    });
  }

  const scheduleToggle = document.getElementById("schedule-toggle");
  const scheduleRow = document.getElementById("schedule-row");
  const rideTime = document.getElementById("ride-time");

  if (scheduleToggle && scheduleRow) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const pad = function (value) {
      return String(value).padStart(2, "0");
    };
    if (rideTime) {
      rideTime.min =
        now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
        "T" + pad(now.getHours()) + ":" + pad(now.getMinutes());
    }

    scheduleToggle.addEventListener("click", function () {
      const isHidden = scheduleRow.hasAttribute("hidden");
      if (isHidden) {
        scheduleRow.removeAttribute("hidden");
        scheduleToggle.querySelector("span").textContent = "Later";
        if (rideTime && !rideTime.value) {
          rideTime.value =
            now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
            "T" + pad(now.getHours()) + ":" + pad(now.getMinutes());
        }
        if (rideTime) rideTime.focus();
      } else {
        scheduleRow.setAttribute("hidden", "");
        scheduleToggle.querySelector("span").textContent = "Now";
      }
    });
  }

  const rideForm = document.getElementById("ride-form");

  if (rideForm) {
    rideForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const from = pickup ? pickup.value.trim() : "";
      const to = dropoff ? dropoff.value.trim() : "";
      const ridesSection = document.getElementById("rides");

      if (!from || !to) {
        showToast("Add a pickup and drop-off to see prices");
        if (!from && pickup) {
          pickup.focus();
        } else if (dropoff) {
          dropoff.focus();
        }
        return;
      }

      const distance = 2 + ((from.length * 7 + to.length * 13) % 170) / 10;
      const fare = Math.round((49 + distance * 12) / 5) * 5;
      showToast("Tuk Tuk from " + from + " to " + to + " · ₹" + fare + " · 3 min away");

      if (ridesSection) {
        ridesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  document.querySelectorAll(".choose-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".ride-card.is-selected").forEach(function (card) {
        card.classList.remove("is-selected");
      });
      const card = button.closest(".ride-card");
      if (card) card.classList.add("is-selected");
      const ride = button.dataset.ride || "your ride";
      showToast(ride + " selected. Ready when you are.");
      button.textContent = "Selected";
      document.querySelectorAll(".choose-btn").forEach(function (other) {
        if (other !== button) other.textContent = "Choose";
      });
    });
  });

  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const email = document.getElementById("email");
      if (!email) return;
      const value = email.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!valid) {
        showToast("Enter a valid email address to get the app link");
        email.focus();
        return;
      }
      showToast("App link sent to " + value);
      signupForm.reset();
    });
  }

  document.querySelectorAll("[data-toast]").forEach(function (element) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      showToast(element.dataset.toast);
    });
  });

  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && reveals.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    reveals.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }
})();
