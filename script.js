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

  // --- Supabase ---------------------------------------------------------
  // The publishable key is meant to be public. Row-level security keeps
  // bookings and enquiries private; the site can only call the three functions below.
  const SUPABASE_URL = "https://vwyxrlfbpsimshvdnfid.supabase.co";
  const SUPABASE_KEY = "sb_publishable_LHiIdV8LAG969Nzi_iYJmA_Xbp4YRqT";

  function rpc(name, args) {
    return fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) {
          const known = data && data.code === "22023" && data.message;
          throw new Error(known ? data.message : "Something went wrong. Please try again or call us.");
        }
        return data;
      });
    }, function () {
      throw new Error("No connection. Check your internet and try again.");
    });
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.setAttribute("aria-busy", String(busy));
    button.disabled = busy;
  }

  // --- Tabs -------------------------------------------------------------
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".ride-grid");

  function openTab(target) {
    tabs.forEach(function (item) {
      const active = item.dataset.tab === target;
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
    document.querySelectorAll('[data-panel="' + target + '"] .reveal, [data-panel="' + target + '"]').forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      openTab(tab.dataset.tab);
    });
  });

  document.querySelectorAll("[data-open-tab]").forEach(function (link) {
    link.addEventListener("click", function () {
      openTab(link.dataset.openTab);
    });
  });

  // --- Booking form -----------------------------------------------------
  const FALLBACK_RIDER = { name: "Khajuraho Tuk Tuk rider", phone: "+919893413847" };

  const form = document.getElementById("ride-form");
  const pickup = document.getElementById("pickup");
  const dropoff = document.getElementById("dropoff");
  const dropoffField = document.getElementById("dropoff-field");
  const swapBtn = document.getElementById("swap-btn");
  const scheduleToggle = document.getElementById("schedule-toggle");
  const scheduleRow = document.getElementById("schedule-row");
  const rideTime = document.getElementById("ride-time");
  const quoteBtn = document.getElementById("quote-btn");
  const quotePanel = document.getElementById("quote-panel");
  const quoteRoute = document.getElementById("quote-route");
  const quoteDetail = document.getElementById("quote-detail");
  const confirmBtn = document.getElementById("confirm-btn");
  const bookingDone = document.getElementById("booking-done");
  const riderList = document.getElementById("rider-list");
  const tripBanner = document.getElementById("trip-banner");
  const tripBannerName = document.getElementById("trip-banner-name");
  const tripClear = document.getElementById("trip-clear");

  const TRIP_NAMES = {
    "city-ride": "City ride",
    "western-temples-visit": "Western Temples visit",
    "temple-circuit": "Full temple circuit",
    "light-and-sound-show": "Light & Sound Show",
    "raneh-falls": "Raneh Falls & Ken Gharial",
    "panna-national-park": "Panna National Park gate",
    "pandav-falls": "Pandav Falls"
  };

  let trip = "city-ride";
  let panelKey = "";

  const places = pickup
    ? Array.prototype.slice.call(pickup.querySelectorAll("option[value]:not([value=''])")).map(function (o) {
        return { slug: o.value, name: o.textContent };
      })
    : [];

  function placeName(slug) {
    const match = places.filter(function (p) { return p.slug === slug; })[0];
    return match ? match.name : "";
  }

  function fillDropoff() {
    if (!dropoff || !pickup) return;
    const keep = dropoff.value;
    dropoff.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.disabled = true;
    first.textContent = "Where to?";
    dropoff.appendChild(first);
    places.forEach(function (place) {
      if (place.slug === pickup.value) return;
      const option = document.createElement("option");
      option.value = place.slug;
      option.textContent = place.name;
      dropoff.appendChild(option);
    });
    dropoff.value = Array.prototype.some.call(dropoff.options, function (o) { return o.value === keep; }) ? keep : "";
  }

  function resetPanels() {
    panelKey = "";
    if (quotePanel) quotePanel.setAttribute("hidden", "");
    if (quoteBtn) quoteBtn.hidden = false;
    if (bookingDone) bookingDone.setAttribute("hidden", "");
  }

  function setTrip(slug) {
    trip = slug;
    const needsDropoff = slug === "city-ride";
    if (dropoffField) dropoffField.hidden = !needsDropoff;
    if (swapBtn) swapBtn.hidden = !needsDropoff;
    if (tripBanner) {
      tripBanner.hidden = needsDropoff;
      if (tripBannerName) tripBannerName.textContent = TRIP_NAMES[slug] || "Tour";
    }
    resetPanels();
  }

  fillDropoff();
  setTrip("city-ride");

  if (pickup) {
    pickup.addEventListener("change", function () { fillDropoff(); resetPanels(); });
  }
  if (dropoff) {
    dropoff.addEventListener("change", resetPanels);
  }

  if (swapBtn && pickup && dropoff) {
    swapBtn.addEventListener("click", function () {
      const a = pickup.value;
      const b = dropoff.value;
      pickup.value = b || "";
      fillDropoff();
      dropoff.value = a || "";
      resetPanels();
    });
  }

  if (tripClear) {
    tripClear.addEventListener("click", function () { setTrip("city-ride"); });
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function localInputValue(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  if (scheduleToggle && scheduleRow) {
    scheduleToggle.addEventListener("click", function () {
      const opening = scheduleRow.hasAttribute("hidden");
      scheduleRow.toggleAttribute("hidden", !opening);
      scheduleToggle.setAttribute("aria-expanded", String(opening));
      scheduleToggle.querySelector("span").textContent = opening ? "Later" : "Now";
      if (opening && rideTime) {
        const soon = new Date(Date.now() + 15 * 60000);
        rideTime.min = localInputValue(soon);
        if (!rideTime.value) rideTime.value = localInputValue(soon);
        rideTime.focus();
      } else if (rideTime) {
        rideTime.value = "";
      }
      resetPanels();
    });
  }

  if (rideTime) {
    rideTime.addEventListener("change", resetPanels);
  }

  // The time box shows the visitor's own clock. Khajuraho is on India time (UTC+05:30),
  // so build the timestamp from the typed wall-clock time with that offset.
  function scheduledAt() {
    if (!scheduleRow || scheduleRow.hasAttribute("hidden") || !rideTime || !rideTime.value) return null;
    return rideTime.value + ":00+05:30";
  }

  function currentKey() {
    return [trip, pickup && pickup.value, trip === "city-ride" && dropoff ? dropoff.value : "", scheduledAt() || ""].join("|");
  }

  function validateRoute() {
    if (!pickup || !pickup.value) {
      showToast("Choose where we should pick you up");
      pickup && pickup.focus();
      return false;
    }
    if (trip === "city-ride" && (!dropoff || !dropoff.value)) {
      showToast("Choose where you are going");
      dropoff && dropoff.focus();
      return false;
    }
    if (scheduleRow && !scheduleRow.hasAttribute("hidden") && rideTime && !rideTime.value) {
      showToast("Pick a pickup time, or switch back to Now");
      rideTime.focus();
      return false;
    }
    return true;
  }

  function routeText() {
    return trip === "city-ride"
      ? placeName(pickup.value) + " → " + placeName(dropoff.value)
      : (TRIP_NAMES[trip] || "Tour") + " from " + placeName(pickup.value);
  }

  function formatPhone(phone) {
    const digits = String(phone).replace(/\D/g, "");
    const local = digits.length === 12 && digits.indexOf("91") === 0 ? digits.slice(2) : digits;
    return local.length === 10 ? local.slice(0, 5) + " " + local.slice(5) : "+" + digits;
  }

  function renderRiders(riders, details) {
    riderList.innerHTML = "";
    riders.forEach(function (rider) {
      const digits = String(rider.phone).replace(/\D/g, "");
      const message = "Hi, I'm " + details.name + ". Request " + details.code + ": " + details.route +
        (details.budget ? ". My budget is ₹" + details.budget : "") +
        ". Please call me on " + details.phone + " to agree the price.";

      const item = document.createElement("li");
      item.className = "rider-item";

      const info = document.createElement("div");
      info.className = "rider-info";
      const name = document.createElement("strong");
      name.textContent = rider.name;
      const number = document.createElement("span");
      number.textContent = formatPhone(rider.phone) + (rider.vehicle_number ? " · " + rider.vehicle_number : "");
      info.appendChild(name);
      info.appendChild(number);

      const actions = document.createElement("div");
      actions.className = "rider-actions";
      const call = document.createElement("a");
      call.className = "btn btn-dark btn-sm";
      call.href = "tel:+" + digits;
      call.textContent = "Call";
      const wa = document.createElement("a");
      wa.className = "btn btn-outline btn-sm";
      wa.href = "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.textContent = "WhatsApp";
      actions.appendChild(call);
      actions.appendChild(wa);

      item.appendChild(info);
      item.appendChild(actions);
      riderList.appendChild(item);
    });
  }

  // Step 1: check the route, then ask for the customer's contact details.
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateRoute()) return;

      panelKey = currentKey();
      quoteRoute.textContent = routeText();
      quoteDetail.textContent = scheduledAt() ? "Later" : "As soon as possible";
      quotePanel.removeAttribute("hidden");
      quoteBtn.hidden = true;
      const name = document.getElementById("rider-name");
      if (name && !name.value) name.focus({ preventScroll: true });
    });
  }

  // Step 2: save the request and show the riders who are available.
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      const name = document.getElementById("rider-name");
      const phone = document.getElementById("rider-phone");
      const riders = document.getElementById("passengers");
      const note = document.getElementById("pickup-note");
      const budget = document.getElementById("budget");

      if (panelKey !== currentKey()) {
        showToast("Your trip changed. Tap Find riders again.");
        resetPanels();
        return;
      }
      if (!name.value.trim() || name.value.trim().length < 2) {
        showToast("Add your name");
        name.focus();
        return;
      }
      if (phone.value.replace(/\D/g, "").length < 10) {
        showToast("Add a phone number a rider can call or WhatsApp");
        phone.focus();
        return;
      }
      const budgetValue = budget.value.trim() ? Number(budget.value) : null;
      if (budgetValue !== null && (!(budgetValue >= 10) || budgetValue > 20000)) {
        showToast("Budget should be between ₹10 and ₹20,000, or leave it empty");
        budget.focus();
        return;
      }

      const route = routeText();
      setBusy(confirmBtn, true);
      rpc("request_ride", {
        p_trip: trip,
        p_pickup: pickup.value,
        p_dropoff: trip === "city-ride" ? dropoff.value : null,
        p_rider_name: name.value,
        p_rider_phone: phone.value,
        p_passengers: Number(riders.value),
        p_scheduled_at: scheduledAt(),
        p_pickup_note: note.value || null,
        p_budget: budgetValue
      }).then(function (rows) {
        const b = rows && rows[0];
        if (!b) throw new Error("We couldn't save your request. Please try again.");
        return rpc("get_available_riders", {}).catch(function () { return []; }).then(function (list) {
          return { booking: b, riders: list && list.length ? list : [FALLBACK_RIDER] };
        });
      }).then(function (result) {
        const b = result.booking;
        document.getElementById("done-code").textContent = b.booking_code;
        document.getElementById("done-text").textContent =
          "These riders are available. Call or WhatsApp one now, or wait and a rider will call " +
          formatPhone(b.rider_phone) + " to agree the price.";
        renderRiders(result.riders, {
          name: name.value.trim(),
          phone: b.rider_phone,
          code: b.booking_code,
          route: route,
          budget: budgetValue
        });
        quotePanel.setAttribute("hidden", "");
        bookingDone.removeAttribute("hidden");
        bookingDone.scrollIntoView({ behavior: "smooth", block: "nearest" });
        panelKey = "";
      }).catch(function (error) {
        showToast(error.message);
      }).then(function () {
        setBusy(confirmBtn, false);
      });
    });
  }

  const bookAnother = document.getElementById("book-another");
  if (bookAnother) {
    bookAnother.addEventListener("click", function () {
      resetPanels();
      document.getElementById("book").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // "Find a rider" buttons on the ride and tour cards fill the form above.
  document.querySelectorAll(".choose-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      setTrip(button.dataset.trip);
      if (button.dataset.dropoff && pickup && dropoff) {
        pickup.value = "khajuraho-town";
        fillDropoff();
        dropoff.value = button.dataset.dropoff;
      }
      document.querySelectorAll(".ride-card.is-selected").forEach(function (card) {
        card.classList.remove("is-selected");
      });
      const card = button.closest(".ride-card");
      if (card) card.classList.add("is-selected");
      document.getElementById("book").scrollIntoView({ behavior: "smooth", block: "start" });
      showToast((TRIP_NAMES[button.dataset.trip] || "Ride") + ": choose your pickup, then tap Find riders");
      if (pickup && !pickup.value) {
        setTimeout(function () { pickup.focus({ preventScroll: true }); }, 500);
      }
    });
  });

  // Quick-pick chips under the form.
  document.querySelectorAll(".quick-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      if (chip.dataset.trip) {
        setTrip(chip.dataset.trip);
        showToast((TRIP_NAMES[chip.dataset.trip] || "Trip") + ": choose your pickup, then tap Find riders");
        if (pickup && !pickup.value) pickup.focus();
        return;
      }
      setTrip("city-ride");
      if (pickup && dropoff) {
        if (!pickup.value || pickup.value === chip.dataset.drop) pickup.value = "khajuraho-town";
        fillDropoff();
        dropoff.value = chip.dataset.drop;
        resetPanels();
        if (quoteBtn) quoteBtn.focus();
      }
    });
  });

  // --- Partner form -----------------------------------------------------
  const partnerForm = document.getElementById("partner-form");
  const partnerRole = document.getElementById("partner-role");
  const partnerTitle = document.getElementById("partner-form-title");

  function setPartnerRole(role) {
    if (partnerRole) partnerRole.value = role;
    if (partnerTitle) partnerTitle.textContent = role === "hotel" ? "Partner with us" : "Apply to drive";
  }

  document.querySelectorAll(".partner-open").forEach(function (button) {
    button.addEventListener("click", function () {
      setPartnerRole(button.dataset.role);
      partnerForm.removeAttribute("hidden");
      partnerForm.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("partner-name").focus({ preventScroll: true });
    });
  });

  if (partnerRole) {
    partnerRole.addEventListener("change", function () { setPartnerRole(partnerRole.value); });
  }

  if (partnerForm) {
    partnerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const name = document.getElementById("partner-name");
      const phone = document.getElementById("partner-phone");
      const message = document.getElementById("partner-message");
      const submit = partnerForm.querySelector('button[type="submit"]');

      if (!name.value.trim() || name.value.trim().length < 2) {
        showToast("Add your name");
        name.focus();
        return;
      }
      if (phone.value.replace(/\D/g, "").length < 10) {
        showToast("Add a phone number we can call");
        phone.focus();
        return;
      }

      setBusy(submit, true);
      rpc("submit_partner_enquiry", {
        p_role: partnerRole.value,
        p_name: name.value,
        p_phone: phone.value,
        p_message: message.value || null
      }).then(function () {
        showToast("Thanks " + name.value.trim().split(" ")[0] + ". We'll call you soon.");
        partnerForm.reset();
        partnerForm.setAttribute("hidden", "");
      }).catch(function (error) {
        showToast(error.message);
      }).then(function () {
        setBusy(submit, false);
      });
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
