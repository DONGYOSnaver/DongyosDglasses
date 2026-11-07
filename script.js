// 내비게이션 구분선
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
});

// 스크롤 등장 애니메이션
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 0.08 + "s";
  revealObserver.observe(el);
});

// 숫자 카운트 업
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll(".stat").forEach((c) => counterObserver.observe(c));

// 기본 선택 컬러 변수 생성 (미드나이트)
window.selectedColor = "미드나이트";

// 컬러 선택
const device = document.getElementById("device");
const colorName = document.getElementById("colorName");
const swatches = document.querySelectorAll(".swatch");
swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    swatches.forEach((s) => s.classList.remove("active"));
    swatch.classList.add("active");
    const { from, to, name } = swatch.dataset;
    device.style.background = `linear-gradient(135deg, ${from}, ${to})`;
    colorName.textContent = name;
    
    // 선택한 컬러 이름을 전역 변수에 업데이트
    window.selectedColor = name;
  });
});

/* ===== 메뉴창 (로그인 시에만 보이는 삼선 메뉴) ===== */
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
const menuUser = document.getElementById("menuUser");

function openMenu() {
  menuPanel.classList.add("open");
  menuBtn.setAttribute("aria-expanded", "true");
  menuBtn.setAttribute("aria-label", "메뉴 닫기");
}

function closeMenu() {
  menuPanel.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "메뉴 열기");
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#menuBtn")) {
    menuPanel.classList.contains("open") ? closeMenu() : openMenu();
  } else {
    closeMenu();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

document.addEventListener("authchange", (e) => {
  const user = e.detail.user;
  menuUser.textContent = user ? user.split("@")[0] + "님" : "";
  if (!user) closeMenu();
});
