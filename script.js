// INTRO: 기존 본문 디자인은 건드리지 않고 진입 시에만 노출
const introScreen = document.querySelector("#intro-screen");
const introSkip = document.querySelector("#intro-skip");

function finishIntro() {
  if (!introScreen || introScreen.classList.contains("is-finished")) return;
  introScreen.classList.add("is-finished");
  document.body.classList.remove("intro-lock");
}

if (introScreen) {
  document.body.classList.add("intro-lock");
  // Hold the completed logo briefly after the face and Korean label appear.
  window.setTimeout(finishIntro, 2600);
  introSkip?.addEventListener("click", finishIntro);
}

const header = document.querySelector(".site-header");
const topButton = document.querySelector(".top-button");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = [...document.querySelectorAll(".global-nav a, .mobile-drawer-nav a")];
const mobileDrawer = document.querySelector("#mobile-drawer");
const mobileBackdrop = document.querySelector(".mobile-menu-backdrop");
const mobileDrawerClose = document.querySelector(".mobile-drawer-close");
const mobileDrawerLinks = [...document.querySelectorAll(".mobile-drawer a")];
const mobileNavMedia = window.matchMedia("(max-width: 820px)");
const sections = [...document.querySelectorAll("main section[id]")];

function updateHeader() {
  const hasScrolled = window.scrollY > 20;
  header.classList.toggle("scrolled", hasScrolled);
  topButton?.classList.toggle("is-visible", hasScrolled);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// 모바일 전용 사이드 메뉴. PC 헤더의 기존 네비게이션은 변경하지 않습니다.
function setMobileDrawerOpen(open, restoreFocus = false) {
  if (!mobileDrawer || !menuToggle || !mobileBackdrop) return;
  const shouldOpen = open && mobileNavMedia.matches;

  if (shouldOpen) mobileDrawer.removeAttribute("inert");
  mobileDrawer.classList.toggle("open", shouldOpen);
  mobileBackdrop.classList.toggle("open", shouldOpen);
  mobileDrawer.setAttribute("aria-hidden", String(!shouldOpen));
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
  menuToggle.setAttribute("aria-label", shouldOpen ? "메뉴 닫기" : "메뉴 열기");
  document.body.classList.toggle("mobile-drawer-open", shouldOpen);

  if (shouldOpen) {
    mobileDrawerClose?.focus({ preventScroll: true });
  } else {
    mobileDrawer.setAttribute("inert", "");
    if (restoreFocus && mobileNavMedia.matches) menuToggle.focus({ preventScroll: true });
  }
}

menuToggle?.addEventListener("click", () => {
  setMobileDrawerOpen(!mobileDrawer.classList.contains("open"));
});
mobileDrawerClose?.addEventListener("click", () => setMobileDrawerOpen(false, true));
mobileBackdrop?.addEventListener("click", () => setMobileDrawerOpen(false, true));
mobileDrawerLinks.forEach((link) => {
  link.addEventListener("click", () => setMobileDrawerOpen(false));
});

// 화면 회전 또는 PC 폭 복귀 시 모바일 메뉴가 남지 않도록 닫기
mobileNavMedia.addEventListener("change", () => setMobileDrawerOpen(false));

document.addEventListener("keydown", (event) => {
  if (!mobileDrawer?.classList.contains("open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    setMobileDrawerOpen(false, true);
  }
  if (event.key !== "Tab") return;
  const focusables = [...mobileDrawer.querySelectorAll('button:not([disabled]), a[href]')];
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// 현재 스크롤 위치에 맞는 메뉴 강조
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const currentId = entry.target.id;
      navLinks.forEach((link) => {
        const href = link.getAttribute("href").replace("#", "");
        link.classList.toggle("active", href === currentId);
      });
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0,
  }
);

sections.forEach((section) => sectionObserver.observe(section));

// 스크롤 등장 모션: 기존 효과 그대로, 아래/위 재진입 시마다 다시 실행
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

// PRODUCTS 대분류: 올리쥬 / 볼픽스 / 미쥬코
const familyToggles = [...document.querySelectorAll("[data-family-toggle]")];
const familyPanels = [...document.querySelectorAll("[data-family-panel]")];
const familyCloseButtons = [...document.querySelectorAll("[data-family-close]")];
const familyRibbonLinks = [...document.querySelectorAll("[data-open-family]")];

// 대표 카드는 모바일에서 가로 스와이프, 시리즈 패널은 그 아래에 유지합니다.
// PC에서는 기존 3열 배치와 펼침 영역을 그대로 사용합니다.
const familyGrid = document.querySelector(".product-family-grid");
const familyPanelContainer = familyGrid?.closest(".family-carousel")?.parentElement;
const mobileFamilyLayout = window.matchMedia("(max-width: 820px)");

function syncFamilyPanelPositions() {
  if (!familyPanelContainer) return;
  familyPanels.forEach((panel) => familyPanelContainer.appendChild(panel));
}

syncFamilyPanelPositions();

// 모바일은 손가락으로 자연스럽게 넘기는 CSS scroll-snap을 사용합니다.
// 키보드 좌우 화살표도 지원하고, 다른 제품군으로 넘기면 펼친 패널을 접습니다.
const familySlides = [...(familyGrid?.querySelectorAll(":scope > .product-family-card") || [])];

function getActiveFamilySlide() {
  if (!familyGrid || !familySlides.length) return 0;
  const firstLeft = familySlides[0].offsetLeft;
  const current = familyGrid.scrollLeft;
  let active = 0;
  let distance = Infinity;
  familySlides.forEach((card, index) => {
    const delta = Math.abs(card.offsetLeft - firstLeft - current);
    if (delta < distance) { distance = delta; active = index; }
  });
  return active;
}

let previousFamilySlide = 0;
function updateFamilySlide() {
  const active = getActiveFamilySlide();
  if (mobileFamilyLayout.matches && active !== previousFamilySlide) {
    const currentFamily = familyToggles[active]?.dataset.familyToggle;
    const openedPanel = familyPanels.find((panel) => panel.classList.contains("open"));
    if (openedPanel && openedPanel.dataset.familyPanel !== currentFamily) {
      setFamilyOpen(openedPanel.dataset.familyPanel, false);
    }
  }
  previousFamilySlide = active;
}

function goToFamilySlide(index) {
  if (!familyGrid || !mobileFamilyLayout.matches || !familySlides.length) return;
  const next = Math.max(0, Math.min(familySlides.length - 1, index));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  familyGrid.scrollTo({
    left: familySlides[next].offsetLeft - familySlides[0].offsetLeft,
    behavior: reducedMotion ? "instant" : "smooth"
  });
}

familyGrid?.addEventListener("scroll", updateFamilySlide, { passive: true });
familyGrid?.addEventListener("keydown", (event) => {
  if (event.target !== familyGrid || !mobileFamilyLayout.matches) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    goToFamilySlide(getActiveFamilySlide() + (event.key === "ArrowRight" ? 1 : -1));
  }
});
window.addEventListener("resize", updateFamilySlide, { passive: true });
updateFamilySlide();

function setFamilyOpen(family, open, scroll = false) {
  const targetPanel = document.querySelector(`[data-family-panel="${family}"]`);
  const targetToggle = document.querySelector(`[data-family-toggle="${family}"]`);
  if (!targetPanel || !targetToggle) return;

  // 한 번에 한 제품군만 펼쳐지도록 정리
  familyPanels.forEach((panel) => {
    const isTarget = panel === targetPanel;
    const shouldOpen = isTarget && open;
    panel.classList.toggle("open", shouldOpen);
    panel.setAttribute("aria-hidden", String(!shouldOpen));
  });

  familyToggles.forEach((toggle) => {
    const isTarget = toggle === targetToggle;
    const expanded = isTarget && open;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.innerHTML = expanded
      ? '제품 접기 <span aria-hidden="true">↑</span>'
      : '제품 보기 <span aria-hidden="true">↓</span>';
  });

  if (open && scroll) {
    window.setTimeout(() => {
      const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
      if (mobileFamilyLayout.matches) {
        // 모바일: 선택한 시리즈는 슬라이드 카드들 바로 아래에 나타납니다.
        // 기존과 같이 페이지 위치를 강제로 이동하지 않습니다.
        return;
      }

      // PC: 기존의 3개 대표 카드 아래로 스크롤하는 동작 유지
      if (!familyGrid) return;
      const extraScroll = 110;
      const targetY = window.scrollY + familyGrid.getBoundingClientRect().top - headerHeight + extraScroll;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth"
      });
    }, 180);
  }
}

familyToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const family = toggle.dataset.familyToggle;
    const panel = document.querySelector(`[data-family-panel="${family}"]`);
    if (!panel) return;
    const nextOpen = !panel.classList.contains("open");
    setFamilyOpen(family, nextOpen, nextOpen);
  });
});

familyCloseButtons.forEach((button) => {
  button.addEventListener("click", () => setFamilyOpen(button.dataset.familyClose, false));
});

familyRibbonLinks.forEach((link) => {
  link.addEventListener("click", () => setFamilyOpen(link.dataset.openFamily, true));
});

// 개별 제품 카드와 클리닉도 네이티브 터치 스크롤을 사용합니다.
// 버튼이나 페이지 점을 만들지 않고 작은 화살표만 표시합니다.
function installMobileCardSlider(track, name) {
  if (!track) return;
  const slides = [...track.children].filter((item) => item.matches(".product-card, .clinic-card"));
  if (slides.length < 2) return;

  track.setAttribute("role", "region");
  track.setAttribute("aria-roledescription", "carousel");
  track.setAttribute("aria-label", `${name} 카드 슬라이드 - 좌우로 밀어서 더 보기`);
  track.setAttribute("tabindex", "0");

  const hint = document.createElement("div");
  hint.className = "mobile-card-carousel-controls";
  hint.setAttribute("aria-hidden", "true");
  hint.innerHTML = '<span class="mobile-card-carousel-hint">옆으로 밀어서 더 보기</span>';
  track.insertAdjacentElement("afterend", hint);

  // 키보드 조작은 접근성을 위해 그대로 제공합니다.
  const isMobile = window.matchMedia("(max-width: 820px)");
  track.addEventListener("keydown", (event) => {
    if (event.target !== track || !isMobile.matches) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const firstLeft = slides[0].offsetLeft;
    let active = 0;
    let shortest = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - firstLeft - track.scrollLeft);
      if (distance < shortest) { shortest = distance; active = index; }
    });
    const next = Math.max(0, Math.min(slides.length - 1, active + (event.key === "ArrowRight" ? 1 : -1)));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: slides[next].offsetLeft - firstLeft,
      behavior: reducedMotion ? "instant" : "smooth"
    });
  });
}

document.querySelectorAll("[data-family-panel]").forEach((panel) => {
  const name = panel.querySelector(".allreju-subheading h3")?.textContent.trim() || "제품";
  installMobileCardSlider(panel.querySelector(".product-grid-sub"), name);
});
installMobileCardSlider(document.querySelector(".network-section .network-grid"), "올리쥬 클리닉");

// 제품 상세 모달
const modal = document.querySelector("#product-modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const modalOpenButtons = document.querySelectorAll(".modal-open");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");

const defaultDescriptions = {
  BASIC: "자연스러운 리프팅 목적의 기본 제품군입니다. 실제 제품 설명, 규격, 허가 정보와 임상 자료를 연결하세요.",
  COG: "고정력과 시술 목적을 고려한 코그 제품군입니다. 상세 페이지 제작 시 제품별 타입을 표 형태로 구성할 수 있습니다.",
  "BLUE LIFIX": "리프팅 방향과 고정 특성을 고려한 제품군입니다. 카탈로그와 제품 이미지 다운로드 영역을 추가할 수 있습니다.",
  "W LINE": "다양한 디자인과 시술 적용을 고려한 제품군입니다. 실제 확정 문구로 교체해서 사용하세요.",
  VOLFIX: "볼륨 디자인을 목적으로 구성된 제품군입니다. 적응증 표현은 의료기기 광고 규정 검토 후 확정하세요.",
  MIJUKO: "세밀한 시술 적용을 고려한 제품군입니다. 실제 제품 사양과 허가 범위 내 표현으로 수정하세요.",
  MIJUKO_SPECIAL: "SPECIAL MIJUKO 상세 정보를 입력하세요.",
  MIJUKO_ADVANCE: "ADVANCE MIJUKO 상세 정보를 입력하세요.",
  MIJUKO_BASIC: "BASIC MIJUKO 상세 정보를 입력하세요.",
  MIJUKO_MONO: "MONO MIJUKO 상세 정보를 입력하세요.",
};

const basicMonoGroups = [
  { usp: "7-0", gauge: "31G N", needle: ["12mm"], thread: ["10mm"] },
  { usp: "6-0", gauge: "30G", needle: ["25mm", "38mm"], thread: ["30mm", "50mm"] },
  { usp: "6-0", gauge: "29G", needle: ["38mm", "60mm"], thread: ["50mm", "90mm"] },
  { usp: "5-0", gauge: "27G", needle: ["50mm", "60mm"], thread: ["70mm", "90mm"] },
  { usp: "5-0", gauge: "26G", needle: ["90mm"], thread: ["150mm"] },
];

const basicSkinCoilGroups = [
  { usp: "6-0", gauge: "29G", needle: ["38mm"], thread: ["50mm"] },
];

const cogScrewRows = [
  ["5-0", "26G", "38mm", "140mm"],
  ["", "", "60mm ", "190mm"],
];

const cogRejuRows = [
  ["3-0", "23G", "50mm", "60mm"],
  ["", "", "70mm", "80mm"],
];

const cogHRows = [
  ["2-0", "21G L", "60mm", "120mm"],
  ["", "", "90mm", "180mm"],
  ["", "", "100mm", "170mm[Multi]"],
  ["2-0", "20G L", "70mm", "150mm"],
  ["0(1-0)", "19G L", "100mm", "170mm[Multi]"],
  ["", "", "", "200mm[Bi]"],
];


const blueLifixARows = [
  ["2", "19G L", "60mm", "130mm"],
  ["", "19G L", "70mm", "150mm"],
  ["", "19G L", "100mm", "200mm"],
  ["", "19G W", "100mm", "170mm"],
];

const blueLifixBRows = [
  ["2", "18G L", "70mm", "150mm"],
  ["", "18G L", "100mm", "200mm"],
  ["", "18G W", "100mm", "170mm"],
];

const blueLifixCRows = [
  ["2", "18G L", "100mm", "170mm"],
];

const blueLifixDRows = [
  ["2", "18G L", "100mm", "170mm"],
];


const wLineARows = [
  ["0", "21G Blunt N", "110mm", "320mm", "10EA/Box", "1EA x 10Pouches"],
];

const wLineBRows = [
  ["0", "18G(내침+외침) 가이드 캐뉼러", "160mm", "440mm", "10EA/Box", "1EA x 10Pouches"],
];


const volfixIRows = [
  ["6-0", "30G W", "25mm", "30mm"],
  ["", "", "38mm", "50mm"],
];

const volfixMultiRows = [
  ["6-0", "23G L", "50mm", "50mm"],
];

const volfixCoilSpringRows = [
  ["5-0", "27G L", "50mm", "220mm"],
  ["", "25G L", "60mm", "300mm"],
  ["4-0", "23G L", "60mm", "340mm"],
  ["", "21G L", "60mm", "395mm"],
];

const volfixBraidedMeshRows = [
  ["5-0", "19G A", "38mm", "40mm"],
  ["", "", "50mm", "70mm"],
  ["", "", "60mm", "85mm"],
  ["", "19G L", "80mm", "130mm"],
];


const mijukoSpecialRows = [
  ["1", "19G HL", "38mm", "40mm"],
  ["", "19G L", "60mm", "90mm"],
  ["2", "19G L", "50mm", "80mm"],
];

const mijukoAdvanceRows = [
  ["1", "19G HL", "38mm", "44mm"],
  ["", "", "", "50mm"],
  ["2", "", "38mm", "44mm"],
  ["", "", "", "50mm"],
];

const mijukoBasicPlusRows = [
  ["2-0", "21G L", "38mm", "44mm"],
  ["", "", "38mm", "50mm"],
  ["", "", "60mm", "90mm"],
];

const mijukoBasicRows = [
  ["3-0", "23G L", "38mm", "44mm"],
  ["", "", "38mm", "50mm"],
  ["", "", "50mm", "70mm"],
];

const mijukoMonoRows = [
  ["2", "19G L", "38mm", "36mm"],
  ["0", "21G L", "60mm", "80mm"],
];

// 각 카드별 서로 다른 규격 배열을 연결합니다.
const mijukoLineups = {
  MIJUKO_SPECIAL: { title: "SPECIAL MIJUKO", rows: mijukoSpecialRows, image: "images/mijuko-special-thread.png" },
  MIJUKO_ADVANCE: { title: "ADVANCE MIJUKO", rows: mijukoAdvanceRows, image: "images/mijuko-advance-thread.png" },
  MIJUKO_BASIC: {
    title: "MIJUKO",
    sections: [
      { title: "BASIC+", badgeKey: "MIJUKO_BASIC_PLUS", rows: mijukoBasicPlusRows, image: "images/mijuko-basic-plus-thread.png" },
      { title: "BASIC", badgeKey: "MIJUKO_BASIC", rows: mijukoBasicRows, image: "images/mijuko-basic-thread.png" },
    ],
  },
  MIJUKO_MONO: { title: "MONO MIJUKO", rows: mijukoMonoRows, image: "images/mijuko-mono-thread.png" },
};

const volfixLineups = {
  VOLFIX_I: { title: "I VOLFIX", rows: volfixIRows, icon: "images/volfix-i-icon.png", image: "images/volfix-i-thread.png" },
  VOLFIX_MULTI: {
    title: "MULTI VOLFIX",
    rows: volfixMultiRows,
    icon: "images/volfix-multi-icon.png",
    image: "images/volfix-multi-thread.png",
  },
  VOLFIX_COIL_SPRING: {
    title: "COIL SPRING VOLFIX",
    rows: volfixCoilSpringRows,
    icon: "images/volfix-coil-spring-icon.png",
    image: "images/volfix-coil-spring-thread.png",
  },
  VOLFIX_BRAIDED_MESH: {
    title: "BRAIDED MESH VOLFIX B",
    rows: volfixBraidedMeshRows,
    icon: "images/volfix-braided-mesh-icon.png",
    image: "images/volfix-braided-mesh-thread.png",
  },
};

// BASIC처럼, 같은 USP/게이지의 연속 규격은 한 행에 길이만 위아래로 표시합니다.
// USP나 게이지가 빈 값이면 바로 앞 규격의 값을 이어받습니다.
function toGroupedSpecRows(rows) {
  const groups = [];
  let currentUsp = "";
  let currentGauge = "";

  rows.forEach(([usp, gauge, needle, thread, packageBox, packageUnits]) => {
    if (usp) currentUsp = usp;
    if (gauge) currentGauge = gauge;
    const last = groups[groups.length - 1];

    if (last && last.usp === currentUsp && last.gauge === currentGauge &&
      last.packageBox === packageBox && last.packageUnits === packageUnits) {
      last.needle.push(needle);
      last.thread.push(thread);
    } else {
      groups.push({
        usp: currentUsp,
        gauge: currentGauge,
        needle: [needle],
        thread: [thread],
        packageBox,
        packageUnits,
      });
    }
  });
  return groups;
}

function renderGroupedSpecTable(groups, tableClass = "", withPackage = false) {

  return `
    <div class="spec-table-wrap">
      <table class="spec-table spec-table-grouped ${tableClass}">
        <thead>
          <tr>
            <th><span>USP</span> <span>Size</span></th>
            <th><span>Needle</span> <span>Gauge</span></th>
            <th><span>Needle</span> <span>Length</span></th>
            <th><span>Thread</span> <span>Length</span></th>
            ${withPackage ? `<th>Package</th>` : ""}
          </tr>
        </thead>

        <tbody>
          ${groups.map((group, index) => {

    const isFirst =
      index === 0 ||
      groups[index - 1].usp !== group.usp;

    let rowspan = 1;

    if (isFirst) {
      while (
        index + rowspan < groups.length &&
        groups[index + rowspan].usp === group.usp
      ) {
        rowspan++;
      }
    }

    return `
              <tr>
                ${isFirst ? `
                  <td rowspan="${rowspan}" class="usp-merged">
                    ${group.usp}
                  </td>
                ` : ""}

                <td>${group.gauge}</td>

                <td class="spec-length-cell">
                  <div class="stacked-values">
                    ${group.needle
        .filter(v => v.trim() !== "")
        .map(v => `<span>${v}</span>`)
        .join("")}
                  </div>
                </td>

                <td class="spec-length-cell">
                  <div class="stacked-values">
                    ${group.thread
        .filter(v => v.trim() !== "")
        .map(v => `<span>${v}</span>`)
        .join("")}
                  </div>
                </td>

                ${withPackage ? `
                  <td>
                    <strong>${group.packageBox || ""}</strong>
                    [ ${group.packageUnits || ""} ]
                  </td>
                ` : ""}
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 제품 상세 모달 상단 제목(검정) / 세부 타입명(금색) 구분
// 볼픽스·미쥬코 배지는 각 모달 아래 HTML에 직접 입력합니다.
const modalHeadings = {
  VOLFIX_I: { title: "VOLFIX", subtitle: "I" },
  VOLFIX_MULTI: { title: "VOLFIX", subtitle: "MULTI" },
  VOLFIX_COIL_SPRING: { title: "VOLFIX", subtitle: "COIL SPRING" },
  VOLFIX_BRAIDED_MESH: { title: "VOLFIX", subtitle: "BRAIDED MESH" },
  MIJUKO_SPECIAL: { title: "MIJUKO", subtitle: "SPECIAL" },
  MIJUKO_ADVANCE: { title: "MIJUKO", subtitle: "ADVANCE" },
  MIJUKO_MONO: { title: "MIJUKO", subtitle: "MONO" },
};

function getModalMarkup(productName) {
  if (productName === "BASIC") {
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>MONO</h3>
            <p>얇은 모노필라멘트 실을 모노 형태로 니들에 고정한 타입</p>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 10EA x 10Pouches = 100EA</span>
            <span class="spec-badge">Needle</span>
          </div>
        </div>
        <div class="spec-visuals">
          <img src="images/basic-mono-icon.png" alt="MONO 단면 이미지" class="spec-icon" />
          <img src="images/basic-mono-thread.png" alt="MONO 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(basicMonoGroups, "basic-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>SCREW</h3>
            <p>얇은 모노필라멘트 스크류 형태로 니들에 고정한 타입</p>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 10EA x 10Pouches = 100EA</span>
            <span class="spec-badge">Needle</span>
          </div>
        </div>
        <div class="spec-visuals">
          <img src="images/basic-skincoil-icon.png" alt="SKIN COIL 단면 이미지" class="spec-icon" />
          <img src="images/basic-skincoil-thread.png" alt="SKIN COIL 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(basicSkinCoilGroups, "basic-table")}
      </div>
    `;
  }

  if (productName === "COG") {
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>SCREW</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">Needle</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/cog-screw-thread.png" alt="SCREW COG 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(cogScrewRows), "cog-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>REJU</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">Needle</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/cog-reju-thread.png" alt="REJU COG 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(cogRejuRows), "cog-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>HOOK</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/cog-h-thread.png" alt="H COG 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(cogHRows), "cog-table")}
      </div>
    `;
  }

  if (productName === "BLUE LIFIX") {
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>[A] 비대칭</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">W Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/bluelifix-a-thread.png" alt="BLUE LIFIX A 비대칭 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(blueLifixARows), "blue-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>[B] 대칭</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">W Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/bluelifix-b-thread.png" alt="BLUE LIFIX B 대칭 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(blueLifixBRows), "blue-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>[C] 엠보스</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">W Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/bluelifix-c-thread.png" alt="BLUE LIFIX C 엠보스 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(blueLifixCRows), "blue-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>[D] 엠보스</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">W Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/bluelifix-d-thread.png" alt="BLUE LIFIX D 엠보스 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(blueLifixDRows), "blue-table")}
      </div>
    `;
  }

  if (productName === "W LINE") {
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>32 TYPE</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 1EA x 10Pouches = 10EA</span>
            <span class="spec-badge">Blunt Needle</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/wline-a-thread.png" alt="W LINE TYPE 01 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(wLineARows), "wline-table")}
      </div>

      <div class="spec-divider"></div>

      <div class="spec-section">
        <div class="spec-head">
          <div>
            <h3>44 TYPE</h3>
          </div>
          <div class="spec-badges">
            <span class="spec-badge">1Box = 1EA x 10Pouches = 10EA</span>
            <span class="spec-badge spec-badge-thread-only">Thread Only</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="images/wline-b-thread.png" alt="W LINE TYPE 02 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(wLineBRows), "wline-table")}
      </div>
    `;
  }

  // 제품별 배지 문구는 각 조건문의 spec-badges 안에서 직접 수정하세요.
  // VOLFIX_I 배지: 위/아래의 다른 제품과 완전히 독립된 HTML입니다.
  if (productName === "VOLFIX_I") {
    const lineup = volfixLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>I</h3></div>
          <!-- VOLFIX_I: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 10EA x 10Pouches = 100EA</span>
            <span class="spec-badge">W Cannula</span>
          </div>
        </div>
        ${lineup.image ? `
          <div class="spec-visuals${lineup.icon ? "" : " cog-single-visual"}">
            ${lineup.icon ? `<img src="${lineup.icon}" alt="${lineup.title} 확대 이미지" class="spec-icon" />` : ""}
            <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
          </div>
        ` : ""}
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "volfix-table")}
      </div>
    `;
  }

  // VOLFIX_MULTI 배지: 위/아래의 다른 제품과 완전히 독립된 HTML입니다.
  if (productName === "VOLFIX_MULTI") {
    const lineup = volfixLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>MULTI</h3></div>
          <!-- VOLFIX_MULTI: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        ${lineup.image ? `
          <div class="spec-visuals${lineup.icon ? "" : " cog-single-visual"}">
            ${lineup.icon ? `<img src="${lineup.icon}" alt="${lineup.title} 확대 이미지" class="spec-icon" />` : ""}
            <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
          </div>
        ` : ""}
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "volfix-table")}
      </div>
    `;
  }

  // VOLFIX_COIL_SPRING 배지: 위/아래의 다른 제품과 완전히 독립된 HTML입니다.
  if (productName === "VOLFIX_COIL_SPRING") {
    const lineup = volfixLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>COIL SPRING</h3></div>
          <!-- VOLFIX_COIL_SPRING: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        ${lineup.image ? `
          <div class="spec-visuals${lineup.icon ? "" : " cog-single-visual"}">
            ${lineup.icon ? `<img src="${lineup.icon}" alt="${lineup.title} 확대 이미지" class="spec-icon" />` : ""}
            <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
          </div>
        ` : ""}
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "volfix-table")}
      </div>
    `;
  }

  // VOLFIX_BRAIDED_MESH 배지: 위/아래의 다른 제품과 완전히 독립된 HTML입니다.
  if (productName === "VOLFIX_BRAIDED_MESH") {
    const lineup = volfixLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>BRAIDED MESH</h3></div>
          <!-- VOLFIX_BRAIDED_MESH: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 5EA x 10Pouches = 50EA</span>
            <span class="spec-badge">A Blunt Cannula</span>
            <span class="spec-badge spec-badge-undyed-pdo">Undyed WHITE PDO</span>
          </div>
        </div>
        ${lineup.image ? `
          <div class="spec-visuals${lineup.icon ? "" : " cog-single-visual"}">
            ${lineup.icon ? `<img src="${lineup.icon}" alt="${lineup.title} 확대 이미지" class="spec-icon" />` : ""}
            <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
          </div>
        ` : ""}
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "volfix-table")}
      </div>
    `;
  }

  // MIJUKO_SPECIAL 배지 직접 입력
  if (productName === "MIJUKO_SPECIAL") {
    const lineup = mijukoLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>SPECIAL</h3></div>
          <!-- MIJUKO_SPECIAL: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">HL Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "mijuko-table")}
      </div>
    `;
  }

  // MIJUKO_ADVANCE 배지 직접 입력
  if (productName === "MIJUKO_ADVANCE") {
    const lineup = mijukoLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>ADVANCE</h3></div>
          <!-- MIJUKO_ADVANCE: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">HL Cannula</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "mijuko-table")}
      </div>
    `;
  }

  // MIJUKO BASIC은 BASIC+와 BASIC이 같은 모달에 있으나 배지는 각각 따로 입력합니다.
  if (productName === "MIJUKO_BASIC") {
    const [basicPlus, basic] = mijukoLineups.MIJUKO_BASIC.sections;
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>BASIC+</h3></div>
          <!-- MIJUKO BASIC+ 배지: BASIC과 별개 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="${basicPlus.image}" alt="BASIC+ 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(basicPlus.rows), "mijuko-table")}
      </div>
      <div class="spec-divider"></div>
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>BASIC</h3></div>
          <!-- MIJUKO BASIC 배지: BASIC+와 별개 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="${basic.image}" alt="BASIC 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(basic.rows), "mijuko-table")}
      </div>
    `;
  }

  // MIJUKO_MONO 배지 직접 입력
  if (productName === "MIJUKO_MONO") {
    const lineup = mijukoLineups[productName];
    return `
      <div class="spec-section">
        <div class="spec-head">
          <div><h3>MONO</h3></div>
          <!-- MIJUKO_MONO: 아래 두 span에 이 제품의 실제 포장 수량과 구성 종류를 개별 입력 -->
          <div class="spec-badges">
            <span class="spec-badge">1Box = 4EA x 10Pouches = 40EA</span>
            <span class="spec-badge">L Cannula</span>
          </div>
        </div>
        <div class="spec-visuals cog-single-visual">
          <img src="${lineup.image}" alt="${lineup.title} 실과 니들 이미지" class="spec-thread" />
        </div>
        ${renderGroupedSpecTable(toGroupedSpecRows(lineup.rows), "mijuko-table")}
      </div>
    `;
  }

  return `<p class="modal-text">${defaultDescriptions[productName] || defaultDescriptions.BASIC}</p>`;
}

function openModal(productName) {
  modalTitle.textContent = modalHeadings[productName]?.title || volfixLineups[productName]?.title || mijukoLineups[productName]?.title || productName;
  modalContent.innerHTML = getModalMarkup(productName);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close").focus();
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

modalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.product));
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("active")) {
    closeModal();
  }
});

// 문의 폼: Formspree 연동 (문의 내용은 선택 입력)
const contactForm = document.querySelector("#contact-form");
const formMessage = document.querySelector("#form-message");

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  const requiredTextFields = [...contactForm.querySelectorAll(
    'input[required]:not([type="checkbox"]), select[required], textarea[required]'
  )];
  let isSubmitting = false;

  // 필수 입력값(공백 제외), 이메일 형식, 필수 동의까지 모두 확인합니다.
  function isContactFormReady() {
    return requiredTextFields.every((field) => field.value.trim() !== "")
      && contactForm.checkValidity();
  }

  function updateContactSubmitButton() {
    submitButton.disabled = isSubmitting || !isContactFormReady();
  }

  // 텍스트 입력, 드롭다운 변경, 체크박스, 자동완성 값을 즉시 반영합니다.
  contactForm.addEventListener("input", updateContactSubmitButton);
  contactForm.addEventListener("change", updateContactSubmitButton);
  window.addEventListener("pageshow", updateContactSubmitButton);
  updateContactSubmitButton();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!isContactFormReady()) {
      formMessage.textContent = "필수 항목을 모두 입력하고 개인정보 수집에 동의해주세요.";
      contactForm.reportValidity();
      updateContactSubmitButton();
      return;
    }

    isSubmitting = true;
    updateContactSubmitButton();
    submitButton.textContent = "전송 중...";
    formMessage.textContent = "";

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Formspree error: ${response.status}`);
      }

      formMessage.textContent = "문의가 정상적으로 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.";
      contactForm.reset();
    } catch (error) {
      console.error(error);
      formMessage.textContent = "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
    } finally {
      isSubmitting = false;
      submitButton.textContent = originalButtonText;
      updateContactSubmitButton();
    }
  });
}

// TOP 버튼
topButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


// Copyright 연도는 방문 시점의 현재 연도로 자동 표시합니다.
const copyrightYear = document.getElementById("copyright-year");
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();
