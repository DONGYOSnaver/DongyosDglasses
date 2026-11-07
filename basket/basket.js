/* ===== 장바구니 창 (basket.html 불러오기 & 모달 동작 제어) ===== */
(function () {
  var BASKET_HTML_PATH = "basket/basket.html";

  // 색상 이름별 Hex 코드 매핑
  var COLOR_MAP = {
    "미드나이트": "#2b2d42",
    "스타라이트": "#e8dcc8",
    "블루": "#0a84ff",
    "핑크": "#ff6b9d"
  };

  var overlay, modal, itemsContainer, totalPriceEl, checkoutBtn, addBtn, errorEl, toastEl, toastTimer;
  var ready = false;

  /* ---------- 장바구니 창 열기 / 닫기 ---------- */
  function openBasket() {
    if (!ready) return;
    modal.classList.remove("done");
    if (errorEl) errorEl.textContent = "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeBasket() {
    if (!ready) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- 토스트 메시지 출력 ---------- */
  function showToast() {
    if (!toastEl) toastEl = document.getElementById("toast");
    if (!toastEl) return;

    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2200);
  }

  /* ---------- 장바구니 항목 동적 추가 함수 ---------- */
  function appendNewItem(titleHTML, price, colorName) {
    var itemHTML = `
      <div class="basket-item" data-color="${colorName}" data-price="${price}">
        <div class="basket-item-info">
          <strong class="basket-item-title">${titleHTML}</strong>
          <span class="basket-item-sub">14.2형 / D2 Pro / 32GB / 2TB SSD</span>
        </div>
        <div class="basket-item-controls">
          <div class="basket-qty">
            <button type="button" class="qty-btn minus">-</button>
            <span class="qty-num">1</span>
            <button type="button" class="qty-btn plus">+</button>
          </div>
          <span class="basket-item-price">₩${price.toLocaleString()}</span>
          <button type="button" class="basket-item-del" aria-label="삭제">✕</button>
        </div>
      </div>
    `;
    itemsContainer.insertAdjacentHTML("beforeend", itemHTML);
  }

  /* ---------- 선택한 색상의 상품을 장바구니에 담기 (중복 처리 적용) ---------- */
  function addProductToBasket() {
    if (!itemsContainer) return;

    if (errorEl) errorEl.textContent = "";

    // '장바구니가 비어 있습니다' 문구가 있으면 삭제
    var emptyEl = itemsContainer.querySelector(".basket-empty");
    if (emptyEl) {
      emptyEl.remove();
    }

    // 현재 선택된 색상 정보 추출 (기본값: 미드나이트)
    var currentColor = window.selectedColor || "미드나이트";
    var colorHex = COLOR_MAP[currentColor] || "#2b2d42";
    var titleHTML = `Dglasses (${currentColor} <span class="item-color-dot" style="background: ${colorHex}"></span>)`;

    // 이미 동일한 색상의 상품이 장바구니에 있는지 검색
    var existingItem = itemsContainer.querySelector(`.basket-item[data-color="${currentColor}"]`);

    if (existingItem) {
      // 1) 같은 색상이 이미 존재한다면: 수량만 +1 증가
      var qtyEl = existingItem.querySelector(".qty-num");
      var currentQty = Number(qtyEl.textContent) || 1;
      var newQty = currentQty + 1;
      qtyEl.textContent = newQty;

      // 해당 항목 금액 업데이트 (단가 × 수량)
      var priceUnit = Number(existingItem.dataset.price) || 1000000;
      var itemPriceEl = existingItem.querySelector(".basket-item-price");
      if (itemPriceEl) {
        itemPriceEl.textContent = "₩" + (priceUnit * newQty).toLocaleString();
      }
    } else {
      // 2) 장바구니에 없는 새로운 색상이면: 새 항목으로 추가
      appendNewItem(titleHTML, 1000000, currentColor);
    }

    updateCartTotal();
  }

  /* ---------- 총액 계산 ---------- */
  function updateCartTotal() {
    var items = document.querySelectorAll(".basket-item");
    var total = 0;

    if (items.length === 0) {
      if (itemsContainer) {
        itemsContainer.innerHTML = '<div class="basket-empty">장바구니가 비어 있습니다.</div>';
      }
    } else {
      items.forEach(function (item) {
        var priceUnit = Number(item.dataset.price) || 0;
        var qtyNumEl = item.querySelector(".qty-num");
        var qty = qtyNumEl ? Number(qtyNumEl.textContent) : 1;
        total += priceUnit * qty;
      });
    }

    if (totalPriceEl) {
      totalPriceEl.textContent = "₩" + total.toLocaleString();
    }
  }

  /* ---------- 초기화 및 이벤트 연결 ---------- */
  function init() {
    overlay = document.getElementById("basketOverlay");
    modal = document.getElementById("basketModal");
    itemsContainer = document.getElementById("basketItems");
    totalPriceEl = document.getElementById("basketTotalPrice");
    checkoutBtn = document.getElementById("basketCheckoutBtn");
    addBtn = document.getElementById("basketAddBtn");
    errorEl = document.getElementById("basketError");
    toastEl = document.getElementById("toast");
    ready = true;

    document.getElementById("basketClose").addEventListener("click", closeBasket);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeBasket();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeBasket();
    });

    // '상품 추가하기' 버튼 클릭 시 -> 장바구니 창을 닫고 #colors 섹션으로 이동
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        closeBasket();

        var colorsSection = document.getElementById("colors");
        if (colorsSection) {
          colorsSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // 수량 변경 / 아이템 삭제 (이벤트 위임)
    if (itemsContainer) {
      itemsContainer.addEventListener("click", function (e) {
        var item = e.target.closest(".basket-item");
        if (!item) return;

        var priceUnit = Number(item.dataset.price) || 1000000;
        var qtyEl = item.querySelector(".qty-num");
        var qty = Number(qtyEl.textContent);

        if (e.target.classList.contains("plus")) {
          qty++;
          qtyEl.textContent = qty;
        } else if (e.target.classList.contains("minus")) {
          if (qty > 1) {
            qty--;
            qtyEl.textContent = qty;
          }
        } else if (e.target.classList.contains("basket-item-del")) {
          item.remove();
        }

        var itemPriceEl = item.querySelector(".basket-item-price");
        if (itemPriceEl) {
          itemPriceEl.textContent = "₩" + (priceUnit * qty).toLocaleString();
        }

        updateCartTotal();
      });
    }

    // 결제하기 버튼
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function () {
        var items = document.querySelectorAll(".basket-item");

        if (items.length === 0) {
          if (errorEl) errorEl.textContent = "장바구니에 담긴 상품이 없습니다.";
          return;
        }

        if (errorEl) errorEl.textContent = "";
        modal.classList.add("done");
        setTimeout(function () {
          closeBasket();
        }, 1600);
      });
    }
  }

  // 클릭 이벤트 연동
  document.addEventListener("click", function (e) {
    var isMenuCart = e.target.closest("#menuCart");
    var isBuyBtn = e.target.closest("#buyBtn");

    if (isMenuCart) {
      e.preventDefault();
      openBasket();
      return;
    }

    if (isBuyBtn) {
      if (!localStorage.getItem("dongyos_user")) return;

      e.preventDefault();
      addProductToBasket();
      showToast();
    }
  });

  fetch(BASKET_HTML_PATH)
    .then(function (res) {
      if (!res.ok) throw new Error(BASKET_HTML_PATH + "을(를) 불러오지 못했습니다.");
      return res.text();
    })
    .then(function (html) {
      document.body.insertAdjacentHTML("beforeend", html);
      init();
    })
    .catch(function (err) {
      console.error(err);
    });
})();