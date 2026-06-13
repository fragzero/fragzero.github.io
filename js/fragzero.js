(function () {
  "use strict";

  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
  var intro = document.getElementById("intro");
  var introTitle = document.getElementById("introTitle");
  var nav = document.getElementById("mainNav");
  var progress = document.getElementById("scrollProgress");
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.querySelector(".nav__menu");
  var sectionDotsEl = document.getElementById("sectionDots");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".snap-section"));
  var wheelEnabled = false;
  var scrollLocked = false;
  var SCROLL_LOCK_MS = 850;
  var WHEEL_THRESHOLD = 25;

  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function canUseWheelSections() {
    return wheelEnabled && !isReducedMotion() && !isMobileLayout();
  }

  function sectionRange(index) {
    var sec = sections[index];
    if (!sec) return { top: 0, maxScroll: 0 };
    var top = sec.offsetTop;
    var maxScroll = Math.max(top, top + sec.offsetHeight - window.innerHeight);
    return { top: top, maxScroll: maxScroll };
  }

  function getCurrentSectionIndex() {
    var probe = window.scrollY + window.innerHeight * 0.35;
    var index = 0;
    sections.forEach(function (sec, i) {
      if (probe >= sec.offsetTop - 4) index = i;
    });
    return index;
  }

  function setActiveSection(index) {
    if (!sectionDotsEl) return;
    sectionDotsEl.querySelectorAll(".section-dots__btn").forEach(function (btn, i) {
      btn.classList.toggle("active", i === index);
    });
  }

  function animateScrollTo(top) {
    scrollLocked = true;
    document.body.classList.add("is-section-scrolling");
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.setTimeout(function () {
      scrollLocked = false;
      document.body.classList.remove("is-section-scrolling");
      setActiveSection(getCurrentSectionIndex());
    }, SCROLL_LOCK_MS);
  }

  function scrollToSection(index, align) {
    if (!sections.length) return;
    var target = Math.max(0, Math.min(sections.length - 1, index));
    var range = sectionRange(target);
    var top = align === "end" ? range.maxScroll : range.top;
    animateScrollTo(top);
  }

  function buildSectionDots() {
    if (!sectionDotsEl || !sections.length) return;
    sectionDotsEl.innerHTML = "";
    sections.forEach(function (sec, i) {
      var item = document.createElement("li");
      item.className = "section-dots__item";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "section-dots__btn" + (i === 0 ? " active" : "");
      btn.setAttribute("aria-label", sec.getAttribute("data-section-label") || "Section " + (i + 1));
      btn.addEventListener("click", function () {
        scrollToSection(i);
      });
      item.appendChild(btn);
      sectionDotsEl.appendChild(item);
    });
  }

  function handleWheelStep(direction) {
    if (!canUseWheelSections() || scrollLocked || document.body.classList.contains("intro-active")) {
      return;
    }

    var index = getCurrentSectionIndex();
    var range = sectionRange(index);
    var y = window.scrollY;

    if (direction > 0) {
      if (y + 20 < range.maxScroll) {
        animateScrollTo(Math.min(range.maxScroll, y + window.innerHeight * 0.92));
      } else if (index < sections.length - 1) {
        scrollToSection(index + 1);
      }
    } else {
      if (y > range.top + 20) {
        animateScrollTo(Math.max(range.top, y - window.innerHeight * 0.92));
      } else if (index > 0) {
        scrollToSection(index - 1, "end");
      }
    }
  }

  function initWheelSections() {
    if (!sections.length) return;

    if (isReducedMotion() || isMobileLayout()) {
      document.documentElement.classList.add("snap-fallback");
      return;
    }

    buildSectionDots();
    document.documentElement.classList.add("wheel-sections");
    document.body.classList.add("wheel-sections");
    wheelEnabled = true;

    if (sectionDotsEl && nav) {
      window.setTimeout(function () {
        sectionDotsEl.classList.add("visible");
      }, 1200);
    }

    window.addEventListener("wheel", function (e) {
      if (!canUseWheelSections() || document.body.classList.contains("intro-active")) return;
      if (scrollLocked) {
        e.preventDefault();
        return;
      }
      if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      e.preventDefault();
      handleWheelStep(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener("keydown", function (e) {
      if (!canUseWheelSections() || document.body.classList.contains("intro-active")) return;
      if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleWheelStep(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handleWheelStep(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToSection(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToSection(sections.length - 1, "end");
      }
    });

    window.addEventListener("resize", function () {
      setActiveSection(getCurrentSectionIndex());
    });
  }

  function finishIntro() {
    document.body.classList.remove("intro-active");
    if (intro) intro.classList.add("done");
    if (nav) nav.classList.add("visible");
    initWheelSections();
    setActiveSection(getCurrentSectionIndex());
  }

  function scrambleText(el, finalText, duration, callback) {
    if (!el) {
      if (callback) callback();
      return;
    }
    var start = performance.now();
    var len = finalText.length;

    function frame(now) {
      var t = Math.min((now - start) / duration, 1);
      var reveal = Math.floor(t * len);
      var out = "";
      for (var i = 0; i < len; i++) {
        if (i < reveal) {
          out += finalText[i];
        } else if (finalText[i] === " ") {
          out += " ";
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = out;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = finalText;
        if (callback) callback();
      }
    }
    requestAnimationFrame(frame);
  }

  if (intro && introTitle) {
    document.body.classList.add("intro-active");
    var target = introTitle.getAttribute("data-text") || introTitle.textContent;
    scrambleText(introTitle, target, 1400, function () {
      setTimeout(finishIntro, 600);
    });
  } else {
    finishIntro();
  }

  function onScroll() {
    var scrollY = window.scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", scrollY > 40);
    }
    if (progress) {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = docHeight > 0 ? (scrollY / docHeight) * 100 + "%" : "0%";
    }
    if (wheelEnabled && !scrollLocked) {
      setActiveSection(getCurrentSectionIndex());
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    menu.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      if (target.classList.contains("snap-section")) {
        var index = sections.indexOf(target);
        if (index !== -1) {
          scrollToSection(index);
          return;
        }
      }

      animateScrollTo(target.offsetTop);
    });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  function createParticleField(canvas, options) {
    if (!canvas) return null;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    var opts = options || {};
    var count = opts.count || 80;
    var color = opts.color || "158, 196, 217";
    var speed = opts.speed || 0.3;
    var particles = [];
    var animId = null;
    var mouse = { x: -1000, y: -1000 };

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function init() {
      particles = [];
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2
        });
      }
    }

    function draw() {
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= dx * 0.02;
          p.y -= dy * 0.02;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + color + ", " + p.alpha + ")";
        ctx.fill();
      });

      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var a = particles[i];
          var b = particles[j];
          var ddx = a.x - b.x;
          var ddy = a.y - b.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(" + color + ", " + (0.06 * (1 - d / 100)) + ")";
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    window.addEventListener("resize", function () {
      resize();
      init();
    });

    if (opts.interactive) {
      canvas.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      canvas.addEventListener("mouseleave", function () {
        mouse.x = -1000;
        mouse.y = -1000;
      });
    }

    return {
      destroy: function () {
        if (animId) cancelAnimationFrame(animId);
      }
    };
  }

  createParticleField(document.getElementById("heroCanvas"), {
    count: 100,
    speed: 0.25,
    interactive: true
  });

  createParticleField(document.getElementById("footerCanvas"), {
    count: 60,
    speed: 0.4,
    interactive: true
  });
})();
