/* Гострий кут — дрібна інтерактивність. Без залежностей. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Мобільне меню ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  var desktop = window.matchMedia("(min-width: 1040px)");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden").textContent = open ? "Закрити меню" : "Меню";
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  desktop.addEventListener("change", function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Шапка: лінія під час прокручування ---------- */
  var header = document.querySelector(".header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Чи відчинено зараз (за київським часом) ---------- */
  var DAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  var DAY_NAMES = ["", "у понеділок", "у вівторок", "у середу", "у четвер", "у п'ятницю", "у суботу", "у неділю"];

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function kyivNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Kyiv",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      return { day: DAYS[map.weekday], minutes: Number(map.hour) * 60 + Number(map.minute) };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay() || 7, minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function scheduleFor(day, rows) {
    for (var i = 0; i < rows.length; i++) {
      var days = rows[i].getAttribute("data-days").split(" ").map(Number);
      if (days.indexOf(day) !== -1) {
        return { row: rows[i], open: rows[i].getAttribute("data-open"), close: rows[i].getAttribute("data-close") };
      }
    }
    return null;
  }

  function updateStatus() {
    var statusEl = document.getElementById("open-status");
    var rows = Array.prototype.slice.call(document.querySelectorAll(".hours tr[data-days]"));
    if (!statusEl || !rows.length) return;

    var now = kyivNow();
    var today = scheduleFor(now.day, rows);

    rows.forEach(function (r) { r.classList.remove("is-today"); });
    if (today) today.row.classList.add("is-today");

    var text;
    var isOpen = false;

    if (today && now.minutes >= toMinutes(today.open) && now.minutes < toMinutes(today.close)) {
      isOpen = true;
      text = "Зараз відчинено · до " + today.close;
    } else if (today && now.minutes < toMinutes(today.open)) {
      text = "Зараз зачинено · відкриємося сьогодні о " + today.open;
    } else {
      var next = now.day % 7 + 1;
      var tomorrow = scheduleFor(next, rows);
      text = tomorrow
        ? "Зараз зачинено · відкриємося завтра о " + tomorrow.open
        : "Зараз зачинено";
    }

    statusEl.textContent = text;
    statusEl.classList.toggle("is-open", isOpen);
  }

  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Активний пункт меню ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__list a"));
  if ("IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var link = byId[entry.target.id];
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Плавна поява блоків ---------- */
  var revealTargets = document.querySelectorAll(
    ".section__head, .price-group, .master, .gallery__item, .review, .visit__card, .contact-btn"
  );

  if ("IntersectionObserver" in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    revealTargets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      revealer.observe(el);
    });
  }

  /* ---------- Мобільна панель ховається біля блоку контактів ---------- */
  var bar = document.querySelector(".mobile-bar");
  var contacts = document.getElementById("contacts");
  if (bar && contacts && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-hidden", entries[0].isIntersecting);
    }).observe(contacts);
  }

  /* ---------- Рік у підвалі ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
