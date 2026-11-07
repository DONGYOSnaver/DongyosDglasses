/* ===== 로그인 창 / 로그인 상태 / 구입 확인 ===== */
(function () {
  // 허용된 계정 정보
  var VALID_ACCOUNTS = [
    { email: "hello@dongyos.com",  pw: "hello@1234" },
    { email: "dongyo@dongyos.com", pw: "hello@1234" }
  ];

  // login.html 경로 (index.html 기준)
  var LOGIN_HTML_PATH = "login/login.html";

  // 로그인 상태 저장 키 (localStorage)
  var AUTH_KEY = "dongyos_user";

  var overlay, modal, form, emailEl, pwEl, errEl;
  var lastFocus = null;
  var ready = false;

  /* ---------- 로그인 상태 관리 ---------- */
  function getUser() {
    try {
      return localStorage.getItem(AUTH_KEY);
    } catch (e) {
      return null;
    }
  }

  function setUser(email) {
    try {
      localStorage.setItem(AUTH_KEY, email);
    } catch (e) {}
  }

  function clearUser() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {}
  }

  // 로그인 상태를 화면에 반영
  function renderAuthLink() {
    var user = getUser();

    // 네비게이션의 로그인 / 로그아웃 문구
    var link = document.getElementById("authLink");
    if (link) link.textContent = user ? "로그아웃" : "로그인";

    // body에 logged-in 클래스 → CSS가 메뉴 버튼(삼선)을 보여줌
    document.body.classList.toggle("logged-in", !!user);

    // 로그인 상태가 바뀌었다고 알림 → script.js의 메뉴창이 이름 표시/닫기를 처리
    document.dispatchEvent(new CustomEvent("authchange", { detail: { user: user } }));

    // 로그인되면 구입하기 경고문 제거
    if (user) hideBuyWarning();
  }

  function logout() {
    clearUser();
    renderAuthLink();
  }

  // 메뉴창의 로그아웃 버튼 (메뉴창 열기/닫기는 script.js에서 처리)
  document.addEventListener("click", function (e) {
    if (e.target.closest("#menuLogout")) logout();
  });

  /* ---------- 구입하기: 로그인 확인 ---------- */
  function showBuyWarning() {
    var warn = document.getElementById("buyWarning");
    if (!warn) return;
    warn.textContent = "로그인을 먼저 하십시오";
    warn.classList.add("show");
  }

  function hideBuyWarning() {
    var warn = document.getElementById("buyWarning");
    if (!warn) return;
    warn.classList.remove("show");
    warn.textContent = "";
  }

  // 로그인 안 된 상태에서 구입하기를 누르면 경고문만 띄우고,
  // script.js의 기존 구입(장바구니 토스트) 동작은 실행되지 않도록 막음
  document.addEventListener(
    "click",
    function (e) {
      if (!e.target.closest("#buyBtn")) return;
      if (getUser()) return; // 로그인 상태면 기존 동작 그대로
      e.preventDefault();
      e.stopImmediatePropagation();
      showBuyWarning();
    },
    true
  );

  /* ---------- 로그인 창 열기 / 닫기 ---------- */
  function openLogin() {
    if (!ready) return;
    lastFocus = document.activeElement;
    modal.classList.remove("done");
    errEl.textContent = "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      emailEl.focus();
    }, 100);
  }

  function closeLogin() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function init() {
    overlay = document.getElementById("loginOverlay");
    modal = document.getElementById("loginModal");
    form = document.getElementById("loginForm");
    emailEl = document.getElementById("loginEmail");
    pwEl = document.getElementById("loginPw");
    errEl = document.getElementById("loginError");
    ready = true;

    document.getElementById("loginClose").addEventListener("click", closeLogin);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLogin();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeLogin();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = emailEl.value.trim();
      var pw = pwEl.value;

      // 허용된 계정 중 이메일/비밀번호가 모두 일치하는 것이 있을 때만 로그인 성공
      var isValid = VALID_ACCOUNTS.some(function (acc) {
        return acc.email === email && acc.pw === pw;
      });

      if (isValid) {
        errEl.textContent = "";
        setUser(email);      // 로그인 상태 저장
        renderAuthLink();    // 네비게이션 → "로그아웃", 삼선 메뉴 표시, 구입 경고문 제거
        document.getElementById("loginWelcome").textContent =
          email.split("@")[0] + "님, 환영합니다!";
        modal.classList.add("done");
        setTimeout(function () {
          closeLogin();
          form.reset();
        }, 1600);
      } else {
        // 그 외 모든 입력은 경고문 표시
        errEl.textContent = "회원가입을 하십시오.";
        pwEl.value = "";
        emailEl.focus();
      }
    });
  }

  // 로그인 열기 버튼 (.js-open-login) — 이벤트 위임으로 처리
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-open-login");
    if (!btn) return;
    e.preventDefault();

    // 네비게이션 링크이면서 이미 로그인된 상태 → 로그아웃
    if (btn.id === "authLink" && getUser()) {
      logout();
      return;
    }
    openLogin();
  });

  // 페이지 로드 시 저장된 상태에 맞춰 문구/메뉴 표시 (새로고침해도 유지)
  renderAuthLink();

  // login/login.html 을 불러와서 body 끝에 삽입
  fetch(LOGIN_HTML_PATH)
    .then(function (res) {
      if (!res.ok) throw new Error(LOGIN_HTML_PATH + " 을(를) 불러오지 못했습니다. (" + res.status + ")");
      return res.text();
    })
    .then(function (html) {
      document.body.insertAdjacentHTML("beforeend", html);
      init();
    })
    .catch(function (err) {
      console.error(err);
      console.error("로컬 서버(예: VS Code Live Server)로 실행했는지 확인하세요.");
    });
})();