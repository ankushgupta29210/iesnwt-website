document.addEventListener("DOMContentLoaded", function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isHome = document.body.classList.contains("home");

  // ---- Mobile nav toggle ----
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ---- Contact form (static site: opens mail client, shows local confirmation) ----
  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-success");
      if (note) {
        note.hidden = false;
      }
      form.reset();
    });
  }

  // ---- Header shrink-on-scroll (and transparent-to-white on homepage) ----
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Homepage hero: subtle parallax + mouse glow ----
  var heroBg = document.querySelector(".hero-bg");
  if (heroBg && !reduceMotion) {
    var parallaxTick = false;
    window.addEventListener(
      "scroll",
      function () {
        if (parallaxTick) return;
        parallaxTick = true;
        requestAnimationFrame(function () {
          var shift = Math.min(window.scrollY * 0.25, 90);
          heroBg.style.transform = "translateY(" + shift + "px)";
          parallaxTick = false;
        });
      },
      { passive: true }
    );
  }
  var heroForGlow = document.querySelector(".hero");
  var heroGlow = document.querySelector(".hero-glow");
  if (heroForGlow && heroGlow && !reduceMotion && matchMedia("(hover: hover)").matches) {
    heroForGlow.addEventListener("mousemove", function (e) {
      var rect = heroForGlow.getBoundingClientRect();
      heroGlow.style.setProperty("--spot-x", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      heroGlow.style.setProperty("--spot-y", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    });
  }

  // ---- Decorative underline under every .section-head ----
  document.querySelectorAll(".section-head").forEach(function (el) {
    var line = document.createElement("span");
    line.className = "section-line";
    line.setAttribute("aria-hidden", "true");
    el.appendChild(line);
  });

  // ---- Scroll-reveal (fade-up, plus directional left/right via [data-reveal]) ----
  var revealSelectors = [
    ".card", ".photo-card", ".testimonial-carousel", ".timeline li",
    ".section-head", ".info-list li", ".hero-trust .stat",
    ".contact-form, .contact-grid > div"
  ];
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll(revealSelectors.join(",")));
  var directionalTargets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  var counters = new Map();
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    var parent = el.parentElement;
    var n = counters.get(parent) || 0;
    el.style.setProperty("--stagger", Math.min(n, 8));
    counters.set(parent, n + 1);
  });
  directionalTargets.forEach(function (el) {
    el.classList.add(el.getAttribute("data-reveal") === "left" ? "reveal-left" : "reveal-right");
  });

  var allAnimated = revealTargets.concat(directionalTargets);

  if (allAnimated.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      allAnimated.forEach(function (el) { el.classList.add("in-view"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      allAnimated.forEach(function (el) { io.observe(el); });
    }
  }

  // ---- Count-up stat + decorative ring ----
  var counterEl = document.querySelector("[data-counter]");
  if (counterEl) {
    var target = parseInt(counterEl.getAttribute("data-counter"), 10) || 0;
    var run = function () {
      if (reduceMotion) {
        counterEl.textContent = target;
        return;
      }
      counterEl.textContent = "0";
      var start = null;
      var duration = 1200;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        counterEl.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var counterIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
            counterIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counterIo.observe(counterEl);
    } else {
      run();
    }
  }

  // ---- Button ripple (skipped entirely under reduced motion) ----
  if (!reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement("span");
        var size = Math.max(rect.width, rect.height);
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(ripple);
        ripple.addEventListener("animationend", function () { ripple.remove(); });
      });
    });
  }

  // ---- Gallery lightbox ----
  var galleryImgs = document.querySelectorAll(".gallery-masonry .photo-card img");
  if (galleryImgs.length) {
    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="" />';
    document.body.appendChild(lightbox);
    var lightboxImg = lightbox.querySelector("img");
    var closeBtn = lightbox.querySelector(".lightbox-close");

    var openLightbox = function (src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      lightbox.classList.add("is-open");
      document.body.classList.add("is-intro"); // reuse no-scroll lock
    };
    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("is-intro");
    };

    galleryImgs.forEach(function (img) {
      img.addEventListener("click", function () { openLightbox(img.src, img.alt); });
    });
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // ---- Testimonial carousel ----
  var carousel = document.querySelector(".testimonial-carousel");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".testimonial"));
    if (reduceMotion || slides.length < 2) {
      carousel.classList.add("no-carousel");
    } else {
      var dotsWrap = document.createElement("div");
      dotsWrap.className = "carousel-dots";
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
        if (i === 0) dot.classList.add("is-active");
        dot.addEventListener("click", function () { goTo(i); resetTimer(); });
        dotsWrap.appendChild(dot);
      });
      carousel.appendChild(dotsWrap);
      var dots = Array.prototype.slice.call(dotsWrap.children);

      var active = 0;
      var goTo = function (i) {
        slides[active].classList.remove("is-active");
        dots[active].classList.remove("is-active");
        active = i;
        slides[active].classList.add("is-active");
        dots[active].classList.add("is-active");
      };
      var timer;
      var tick = function () { goTo((active + 1) % slides.length); };
      var resetTimer = function () {
        clearInterval(timer);
        timer = setInterval(tick, parseInt(carousel.getAttribute("data-autoplay"), 10) || 6000);
      };
      resetTimer();
      carousel.addEventListener("mouseenter", function () { clearInterval(timer); });
      carousel.addEventListener("mouseleave", resetTimer);
      carousel.addEventListener("focusin", function () { clearInterval(timer); });
      carousel.addEventListener("focusout", resetTimer);
    }
  }

  // ---- Back to top (all pages) ----
  var toTop = document.createElement("button");
  toTop.className = "back-to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("is-visible", window.scrollY > 700);
  }, { passive: true });

  // ---- Subtle gradient divider above the footer (all pages) ----
  var footer = document.querySelector(".site-footer");
  if (footer && footer.parentNode) {
    var divider = document.createElement("div");
    divider.className = "section-divider";
    footer.parentNode.insertBefore(divider, footer);
  }

  // ---- One-time homepage load intro ----
  var showIntro = isHome && !reduceMotion && !sessionStorage.getItem("iesIntroShown");
  if (showIntro) {
    sessionStorage.setItem("iesIntroShown", "1");
    var loader = document.createElement("div");
    loader.className = "load-intro";
    loader.innerHTML =
      '<div class="load-mark">' +
        '<svg viewBox="0 0 100 100"><polygon class="load-diamond" points="50,6 94,50 50,94 6,50" fill="none" stroke="#ffc721" stroke-width="4"/></svg>' +
        '<span>Independent Electrical Services</span>' +
      '</div>' +
      '<div class="load-bar"><span></span></div>';
    document.body.prepend(loader);
    document.body.classList.add("is-intro");
    setTimeout(function () {
      loader.classList.add("is-done");
      setTimeout(function () {
        loader.remove();
        document.body.classList.remove("is-intro");
      }, 500);
    }, 750);
  }
});
