// === 해시 제거 (새로고침 시 강제 1페이지) ===
window.history.replaceState(null, null, window.location.pathname);

// === 로딩 ===
window.addEventListener("load", function () {
    const loader = document.getElementById("loading-screen");

    // 풀페이지 스크롤 막기
    if (window.fullpage_api) {
        fullpage_api.setAllowScrolling(false);
        fullpage_api.setKeyboardScrolling(false);
    }

    if (loader) {
        setTimeout(() => {
            loader.style.opacity = 0;

            setTimeout(() => {
                loader.style.display = "none";

                // 맨 위로 이동
                fullpage_api.moveTo(1);

                // 로딩 끝나고 다시 허용
                setTimeout(() => {
                    document.body.classList.remove("loading");

                    // 풀페이지 다시 스크롤 허용
                    fullpage_api.setAllowScrolling(true);
                    fullpage_api.setKeyboardScrolling(true);
                }, 800);
            }, 500);
        }, 200);
    }
});

// === 풀페이지 ===
new fullpage('#fullpage', {
    autoScrolling: true,
    scrollHorizontally: false,
    scrollingSpeed: 700,
    resetSliders: true,
    normalScrollElements: '.scrollable-section',
    anchors: ['main', 'about', 'works', 'work-list', 'review', 'contact'],
    navigation: true,
    navigationPosition: 'right',
    onLeave: function (origin, destination, direction) {
        if (!triggered && destination.anchor === 'about') {
            triggered = true;
            triggerPhysicsLanding();
        }
    }
});

// === 메인 키입력 ===
document.addEventListener(
    "keydown",
    function () {
        // 현재 섹션이 첫 섹션일 때만 실행
        const activeSection = document.querySelector(".fp-section.active");
        const firstSection = document.querySelector(".fp-section:first-child");

        if (activeSection === firstSection && typeof fullpage_api !== "undefined") {
            fullpage_api.moveSectionDown();
        }
    }, {
        once: true
    }
);

// === scroll indicator ===
const scrollIndicator = document.querySelector('.scroll-indicator');
const sections = document.querySelectorAll('.section');

const hideSections = ['main', 'about', 'contact'];

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const sectionName = entry.target.getAttribute('data-anchor');

                if (hideSections.includes(sectionName)) {
                    scrollIndicator.style.display = 'none';
                } else {
                    scrollIndicator.style.display = 'flex';
                }
            }
        });
    }, {
        threshold: 0.6, // 화면의 60% 이상 보이면 활성화된 것으로 간주
    }
);

// 관찰 시작
sections.forEach((section) => observer.observe(section));


// === 스킬 물리엔진 ===
const {
    Engine,
    Render,
    Runner,
    Bodies,
    Composite,
    Events,
    Body
} = Matter;

const engine = Engine.create();
const world = engine.world;
engine.timing.timeScale = 2;
engine.gravity.y = 1;

const width = window.innerWidth;
const height = window.innerHeight;

const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
    },
});

Render.run(render);
const FIXED_TIME_STEP = 1000 / 60;
setInterval(() => {
  Engine.update(engine, FIXED_TIME_STEP);
}, FIXED_TIME_STEP);

// 초기 착지 바닥
const mainSection = document.querySelector(".section.main .inner");
const mainY = mainSection.offsetTop + mainSection.offsetHeight + 20;
let ground = Bodies.rectangle(width / 2, mainY, width, 40, {
    isStatic: true,
});
Composite.add(world, ground);

const skillBox = document.querySelector(".skill-box");

const words = [
    "HTML",
    "CSS",
    "JavaScript",
    "jQuery",
    "SCSS",
    "Webkit",
    "Photoshop",
    "XD",
    "Zeplin",
    "Figma",
    "SVN",
    "Git",
    "Sourcetree",
    "Github",
    "Bitbucket",
];

const wordObjects = [];

words.forEach((word) => {
    const div = document.createElement("div");
    div.className = "word";
    div.textContent = word;
    skillBox.appendChild(div);

    const visualHeight = div.offsetHeight; // box-shadow 아래쪽 길이만큼 추가
    const box = Bodies.rectangle(
        width / 2 + (Math.random() * 200 - 100),
        -Math.random() * 300,
        div.offsetWidth,
        visualHeight, // 보정된 높이 사용
        {
            restitution: 0.8,
            friction: 0.2,
            density: 0.005,
            angle: Math.random() * 0.2 - 0.1,
        }
    );

    box.inertia = Infinity;
    box.inverseInertia = 0;
    Composite.add(world, box);
    wordObjects.push({
        dom: div,
        body: box,
    });
});

Events.on(engine, "afterUpdate", () => {
    wordObjects.forEach(({
        dom,
        body
    }) => {
        dom.style.left = body.position.x - dom.offsetWidth / 2 + "px";
        dom.style.top = body.position.y - dom.offsetHeight / 2 + "px";

        let angleDeg = body.angle * (180 / Math.PI);
        angleDeg = Math.max(-60, Math.min(60, angleDeg));
        dom.style.transform = `rotate(${angleDeg}deg)`;
    });
});

Events.on(engine, "beforeUpdate", () => {
    const clampRange = width * 0.3;
    const minX = width / 2 - clampRange;
    const maxX = width / 2 + clampRange;
    const minY = 0;
    const maxY = height * 3;

    wordObjects.forEach(({
        body
    }) => {
        const halfW = (body.bounds.max.x - body.bounds.min.x) / 2;
        const halfH = (body.bounds.max.y - body.bounds.min.y) / 2;
        let x = body.position.x;
        let y = body.position.y;
        let clamped = false;

        if (x < minX + halfW) {
            x = minX + halfW;
            clamped = true;
        }
        if (x > maxX - halfW) {
            x = maxX - halfW;
            clamped = true;
        }
        if (y < minY + halfH) {
            y = minY + halfH;
            clamped = true;
        }
        if (y > maxY - halfH) {
            y = maxY - halfH;
            clamped = true;
        }

        if (clamped)
            Body.setPosition(body, {
                x,
                y,
            });
    });
});

function createFirework(x, y) {
    const container = document.createElement("div");
    container.className = "firework-container";
    container.style.position = "absolute";
    container.style.left = `${x - 300}px`;
    container.style.top = `${y - 300}px`;
    container.style.width = "600px";
    container.style.height = "600px";
    container.style.pointerEvents = "none";
    container.style.zIndex = 9999;
    document.body.appendChild(container);

    const particleCount = 30;
    const colors = ["#00f0b5", "#b2fff4", "#03796d"];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "firework-particle";
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.position = "absolute";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.background = "transparent";
        particle.style.display = "block";

        const directions = [{
                top: "-8px",
                left: "0px",
            },
            {
                top: "8px",
                left: "0px",
            },
            {
                top: "0px",
                left: "-8px",
            },
            {
                top: "0px",
                left: "8px",
            },
        ];

        directions.forEach(({
            top,
            left
        }) => {
            const arm = document.createElement("div");
            arm.style.position = "absolute";
            arm.style.width = "8px";
            arm.style.height = "8px";
            arm.style.background = color;
            arm.style.top = top;
            arm.style.left = left;
            particle.appendChild(arm);
        });

        container.appendChild(particle);

        particle.animate(
            [{
                    transform: "scale(1)",
                    offset: 0,
                },
                {
                    transform: "scale(1.5)",
                    offset: 0.2,
                },
                {
                    transform: "scale(0.6)",
                    offset: 0.4,
                },
                {
                    transform: "scale(1.8)",
                    offset: 0.6,
                },
                {
                    transform: "scale(1)",
                    offset: 0.8,
                },
                {
                    transform: "scale(1.3)",
                    offset: 1,
                },
            ], {
                duration: 500 + Math.random() * 300,
                delay: Math.random() * 150,
                easing: "steps(4, end)",
                fill: "forwards",
            }
        );
    }
    setTimeout(() => container.remove(), 400);
}

function addClickEventsOnce() {
    wordObjects.forEach(({
        dom,
        body
    }) => {
        if (!dom.dataset.bound) {
            dom.dataset.bound = "true";
            dom.addEventListener("click", () => {
                Body.setVelocity(body, {
                    x: (Math.random() - 0.5) * 8,
                    y: -30,
                });
                setTimeout(() => {
                    const {
                        x,
                        y
                    } = body.position;

                    // Matter.js가 있는 섹션 DOM 기준 offset 잡기
                    const section = dom.closest('.section');
                    const sectionRect = section.getBoundingClientRect(); // 뷰포트 기준 위치
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

                    const domX = sectionRect.left + x + scrollLeft;
                    const domY = sectionRect.top + y + scrollTop;

                    createFirework(domX, domY);

                    dom.remove();
                    Composite.remove(world, body);
                }, 400);

            });
        }
    });
}
addClickEventsOnce();

const aboutSection = document.querySelector(".section.about");
let triggered = false;

// 초기 스크롤 처리
function triggerPhysicsLanding() {
    const wordGrid = document.querySelector(".word-grid");
    const wordGridY = wordGrid.getBoundingClientRect().top + window.scrollY;

    Composite.remove(world, ground);
    engine.gravity.y = 1;

    const newGround = Bodies.rectangle(
        width / 2,
        wordGridY + 15,
        width * 0.95,
        80, {
            isStatic: true
        }
    );
    Composite.add(world, newGround);

    const wallThickness = 50;
    const padding = width * 0.2;
    const leftWall = Bodies.rectangle(
        width / 2 - padding,
        wordGridY + 15,
        wallThickness,
        200, {
            isStatic: true
        }
    );
    const rightWall = Bodies.rectangle(
        width / 2 + padding,
        wordGridY + 15,
        wallThickness,
        200, {
            isStatic: true
        }
    );
    Composite.add(world, [leftWall, rightWall]);

    render.canvas.height = wordGridY + 400;
    addClickEventsOnce();
}

// === word 클릭 유도 ===
function pulseRandomWord() {
    const words = document.querySelectorAll('.word');
    if (words.length === 0) return;

    const randomIndex = Math.floor(Math.random() * words.length);
    const chosen = words[randomIndex];

    chosen.classList.add('word-active');

    setTimeout(() => {
        chosen.classList.remove('word-active');
    }, 800); // 효과 지속 시간
}

setInterval(pulseRandomWord, 2000); // 2초마다 한 번씩 랜덤 강조

// === 타이핑 효과 ===
const textElement = document.getElementById("typing-effect");
const texts = ["안녕하세요.\nUI 개발자 박다나입니다."];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let cursorVisible = true;
let cursorInterval;

function toggleCursor(show) {
    const cursor = textElement;
    if (show) {
        cursorInterval = setInterval(() => {
            cursor.classList.toggle("hide-cursor");
        }, 600);
    } else {
        clearInterval(cursorInterval);
        cursor.classList.remove("hide-cursor");
    }
}

function type() {
    const currentText = texts[textIndex];
    const visibleText = currentText.substring(0, charIndex);
    textElement.innerText = visibleText;

    if (!isDeleting && charIndex < currentText.length) {
        toggleCursor(false);
        charIndex++;
        setTimeout(type, 100);
    } else if (isDeleting && charIndex > 0) {
        toggleCursor(false);
        charIndex--;
        setTimeout(type, 80);
    } else {
        isDeleting = !isDeleting;
        toggleCursor(true);
        setTimeout(type, 2500);
    }
}

type();
toggleCursor(true);

// === 프로젝트 이미지 백그라운드 자동 적용 ===
document.querySelectorAll(".swiper-slide").forEach((el) => {
    const id = el.dataset.name;
    const parent = el.closest(".project-list");
    if (id && parent) {
        // 'project-list'를 제외한 클래스명만 추출
        const folder = [...parent.classList].find(c => c !== "project-list");

        if (folder) {
            el.style.backgroundImage = `url('images/works/${folder}/${id}.png')`;
        }
    }
});

// === 글리치 문자 랜덤 생성 ===
const glitchEls = document.querySelectorAll(".glitch-letter"); // 여러 개 선택

const symbols = ["@", "#", "$", "%", "&", "*", "+", "?", "!", "^", "~"];

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function setRandomFlickerSpeed(el) {
    const speed = (Math.random() * 1 + 0.4).toFixed(2);
    el.style.animationDuration = `${speed}s`;
}

// 각 요소에 대해 랜덤 심볼 + 속도 설정 반복
setInterval(() => {
    glitchEls.forEach(el => {
        el.textContent = getRandomSymbol();
    });
}, 400);

setInterval(() => {
    glitchEls.forEach(el => {
        setRandomFlickerSpeed(el);
    });
}, 500);

// === swiper ===
document.querySelectorAll('.image-container, .review-container').forEach((container, index) => {
    const swiperEl = container.querySelector('.mySwiper');
    const nextBtn = container.querySelector('.swiper-button-next');
    const prevBtn = container.querySelector('.swiper-button-prev');
    const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;

    new Swiper(swiperEl, {
        loop: slideCount > 2,
        spaceBetween: 0,
        slidesPerView: 1,
        navigation: {
            nextEl: nextBtn,
            prevEl: prevBtn
        },
        speed: 0,
        allowTouchMove: false
    });
});

// === 하단 폭죽 ===
let fireworksInterval = null;

const contactFireworkObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // 시작
                if (!fireworksInterval) {
                    fireworksInterval = setInterval(() => {
                        const x = Math.random() * window.innerWidth;
                        const y = Math.random() * (window.innerHeight / 2);
                        createFirework(x, y);
                    }, 2000);
                }
            } else {
                // 종료
                clearInterval(fireworksInterval);
                fireworksInterval = null;
            }
        });
    }, {
        threshold: 0.1
    }
);

const contactSection = document.querySelector('.section.contact');
if (contactSection) {
    contactFireworkObserver.observe(contactSection);
}