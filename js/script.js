// === URL 해시 리셋 (새로고침 시) ===
(() => window.history.replaceState(null, null, window.location.pathname))();

// === 모바일 전용 오버레이 토글 ===
(function () {
    const overlay = document.getElementById('mobile-overlay');

    function checkViewport() {
        overlay.style.display = (window.innerWidth < 767) ? 'flex' : 'none';
    }
    window.addEventListener('load', checkViewport);
    window.addEventListener('resize', checkViewport);
})();

// === 스크롤 인디케이터 표시/숨김 (섹션 감지) ===
(() => {
    const indicator = document.querySelector('.scroll-indicator');
    const hideAnchors = new Set(['main', 'about', 'contact']);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({
            target,
            isIntersecting
        }) => {
            const anchor = target.dataset.anchor;
            indicator.style.display = (isIntersecting && !hideAnchors.has(anchor)) ? 'flex' : 'none';
        });
    }, {
        threshold: 0.6
    });
    document.querySelectorAll('.section').forEach(sec => observer.observe(sec));
})();

// === Swiper 슬라이더 초기화 (프로젝트/리뷰) ===
(() => {
    document.querySelectorAll('.image-container, .review-container').forEach(container => {
        const swiperEl = container.querySelector('.mySwiper');
        const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
        new Swiper(swiperEl, {
            loop: slideCount > 2,
            spaceBetween: 0,
            slidesPerView: 1,
            navigation: {
                nextEl: container.querySelector('.swiper-button-next'),
                prevEl: container.querySelector('.swiper-button-prev')
            },
            speed: 0,
            allowTouchMove: false
        });
    });
})();

// === 랜덤 단어 펄스 효과 반복 ===
(() => {
    const pulse = () => {
        const items = document.querySelectorAll('.word');
        if (!items.length) return;
        const el = items[Math.floor(Math.random() * items.length)];
        el.classList.add('word-active');
        setTimeout(() => el.classList.remove('word-active'), 800);
    };
    setInterval(pulse, 2000);
})();

// === 타이핑 이펙트 (인삿말) ===
(() => {
    const el = document.getElementById('typing-effect');
    const texts = ['안녕하세요.\nUI 개발자 박다나입니다.'];
    let ti = 0,
        ci = 0,
        deleting = false,
        cursorI;
    const toggleCursor = show => {
        if (show) {
            cursorI = setInterval(() => el.classList.toggle('hide-cursor'), 600);
        } else {
            clearInterval(cursorI);
            el.classList.remove('hide-cursor');
        }
    };
    const type = () => {
        const text = texts[ti];
        el.innerText = text.substring(0, ci);
        if (!deleting && ci < text.length) {
            ci++;
            toggleCursor(false);
            setTimeout(type, 100);
        } else if (deleting && ci > 0) {
            ci--;
            toggleCursor(false);
            setTimeout(type, 80);
        } else {
            deleting = !deleting;
            toggleCursor(true);
            setTimeout(type, 2500);
        }
    };
    toggleCursor(true);
    type();
})();

// === 프로젝트 썸네일 백그라운드 지정 ===
(() => {
    document.querySelectorAll('.project-list .swiper-slide').forEach(slide => {
        const id = slide.dataset.name;
        const list = slide.closest('.project-list');
        if (!id || !list) return;
        const folder = [...list.classList].find(c => c !== 'project-list');
        if (folder) slide.style.backgroundImage = `url('images/works/${folder}/${id}.jpg')`;
    });
})();

// === 글리치 문자 효과 반복 ===
(() => {
    const els = document.querySelectorAll('.glitch-letter');
    const symbols = ['@', '#', '$', '%', '&', '*', '+', '?', '!', '^', '~'];
    const randSym = () => symbols[Math.floor(Math.random() * symbols.length)];
    setInterval(() => {
        els.forEach(el => {
            el.textContent = randSym();
            el.style.animationDuration = `${(Math.random() + 0.4).toFixed(2)}s`;
        });
    }, 500);
})();

// === Matter.js 물리엔진 & 풀페이지 인터랙션 ===
// 착지 트리거(about 도달 여부)
let triggered = false;

// Matter.js 전역 (엔진/렌더러/월드/ground/크기/단어들)
const {
    Engine,
    Render,
    Bodies,
    Composite,
    Events,
    Body
} = Matter;
let engine, render, world, ground, W, H;
let wordObjects = [];

// --- 물리엔진 전체 초기화 ---
function initPhysics(first = false) {
    // 기존 렌더러, 애니메이션 루프, 월드, 단어 모두 정리
    if (!first) {
        if (render) Matter.Render.stop(render);
        if (window._physicsRAF) cancelAnimationFrame(window._physicsRAF);
        if (world) {
            Composite.clear(world, false); // Matter.js body 모두 제거
        }
        // skillBox DOM 싹 비우기 (.word 전부)
        const skillBox = document.querySelector('.skill-box');
        if (skillBox) {
            // 기존 남아 있는 .word div 전부 제거!
            while (skillBox.firstChild) skillBox.removeChild(skillBox.firstChild);
        }
        // 혹시 남은 .word DOM이 문서 전체에 있을 경우 전체 제거 (방어적)
        document.querySelectorAll('.word').forEach(el => el.remove());
        wordObjects = [];
    }
    W = window.innerWidth;
    H = window.innerHeight;
    engine = Engine.create();
    // engine.positionIterations = 12;
    // engine.velocityIterations = 10;
    engine.timing.timeScale = 1.5;
    engine.gravity.y = 1.5;
    world = engine.world;
    render = Render.create({
        element: document.body,
        engine,
        options: {
            width: W,
            height: H,
            wireframes: false,
            background: 'transparent'
        }
    });

    // 1차 바닥 생성(.main)
    createMainGround();
    // 단어 드롭
    dropWords();

    // 물리 루프(고정 60fps)
    Render.run(render);
    let lastTime = performance.now();
    const FIXED_STEP = 1000 / 50; // 16.666... ms (1/60초)
    const MAX_STEPS = 3; // 프레임 drop 시 최대 반복 횟수 제한 (무한루프 방지)
    engine.positionIterations = 8; // 8~10 (기본 6보다 살짝만)
    engine.velocityIterations = 6; // 6~8

    function physicsLoop() {
        const now = performance.now();
        let delta = now - lastTime;
        lastTime = now;
        // 최악의 경우 프레임당 너무 많이 반복 안 되게 제한
        let steps = 0;
        while (delta > FIXED_STEP && steps < MAX_STEPS) {
            Engine.update(engine, FIXED_STEP * engine.timing.timeScale);
            delta -= FIXED_STEP;
            steps++;
        }
        // 남은 시간도 처리
        if (delta > 0) {
            Engine.update(engine, delta * engine.timing.timeScale);
        }

        window._physicsRAF = requestAnimationFrame(physicsLoop);
    }
    physicsLoop();

    // 프레임별: DOM 위치 동기화, 화면 밖 제한
    Events.on(engine, 'afterUpdate', syncWordDOM);
    Events.on(engine, 'beforeUpdate', constrainWordBounds);
}

// --- 1차 바닥(.main 하단) 생성 ---
function createMainGround() {
    if (ground) Composite.remove(world, ground);
    const mainSection = document.querySelector('.section.main');
    const groundHeight = 40;
    // 바닥 윗면을 .main 하단에 딱 맞춤
    const y = mainSection.offsetTop + mainSection.offsetHeight + groundHeight / 2;
    ground = Bodies.rectangle(W / 2, y, W, groundHeight, {
        isStatic: true
    });
    Composite.add(world, ground);
}

// --- 2차 바닥(.about 하단 - barrier-line) 생성 ---
function triggerPhysicsLanding() {
    if (ground) Composite.remove(world, ground);
    const aboutSection = document.querySelector('.section.about');
    const barrierLine = document.querySelector('.barrier-line');
    const groundHeight = 80;
    const barrierHeight = barrierLine ? barrierLine.offsetHeight : 0;
    // 바닥 윗면을 .about 하단-barrier에 딱 맞춤
    const y = aboutSection.offsetTop + aboutSection.offsetHeight - barrierHeight + groundHeight / 2;
    ground = Bodies.rectangle(W / 2, y, W * 0.95, groundHeight, {
        isStatic: true
    });
    Composite.add(world, ground);
}

// --- 단어 박스(.word) 물리 드롭 ---
function dropWords() {
    const skillBox = document.querySelector('.skill-box');
    if (!skillBox) return;
    const words = [
        'HTML', 'CSS', 'JavaScript', 'jQuery', 'SCSS', 'Webkit', 'Photoshop',
        'XD', 'Zeplin', 'Figma', 'SVN', 'Git', 'Sourcetree', 'Github', 'Bitbucket'
    ];
    wordObjects = [];
    words.forEach(text => {
        const dom = document.createElement('div');
        dom.className = 'word';
        dom.textContent = text;
        skillBox.appendChild(dom);
        requestAnimationFrame(() => {
            const b = Bodies.rectangle(
                W / 2 + (Math.random() * 200 - 100),
                -20 - Math.random() * 30,
                dom.offsetWidth,
                dom.offsetHeight, {
                    restitution: 0.8,
                    friction: 0.2,
                    frictionStatic: 1.0,
                    density: 0.05,
                    angle: Math.random() * 0.2 - 0.1,
                    inertia: Infinity,
                    inverseInertia: 0
                }
            );
            Composite.add(world, b);
            wordObjects.push({
                dom,
                body: b
            });
            bindClick(dom, b);
        });
    });
}

// --- 매 프레임: DOM 위치 & 회전 동기화 ---
function syncWordDOM() {
    wordObjects.forEach(({
        dom,
        body
    }) => {
        dom.style.left = (body.position.x - dom.offsetWidth / 2) + 'px';
        dom.style.top = (body.position.y - dom.offsetHeight / 2) + 'px';
        const deg = body.angle * 180 / Math.PI;
        dom.style.transform = `rotate(${Math.max(-60, Math.min(60, deg))}deg)`;
    });
}

// --- 매 프레임: 단어 바디 화면 밖 제한 ---
function constrainWordBounds() {
    wordObjects.forEach(o => {
        const b = o.body;
        const hw = (b.bounds.max.x - b.bounds.min.x) / 2;
        let x = b.position.x;
        if (x - hw < 0) x = hw;
        if (x + hw > W) x = W - hw;
        Body.setPosition(b, {
            x,
            y: b.position.y
        });
    });
}

// --- 단어 클릭: 바운스+폭죽+삭제 ---
function bindClick(dom, body) {
    if (dom.dataset.bound) return;
    dom.dataset.bound = 'true';
    dom.addEventListener('click', () => {
        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 8,
            y: -30
        });
        setTimeout(() => {
            const sec = dom.closest('.section'),
                r = sec.getBoundingClientRect();
            const fx = r.left + body.position.x + window.scrollX,
                fy = r.top + body.position.y + window.scrollY;
            createFirework(fx, fy);
            dom.remove();
            Composite.remove(world, body);
        }, 400);
    });
}

// --- fullPage.js: 페이지 이동 시 2차착지 트리거 ---
const fullpage_api = new fullpage('#fullpage', {
    autoScrolling: true,
    scrollHorizontally: false,
    scrollingSpeed: 700,
    resetSliders: true,
    normalScrollElements: '.scrollable-section',
    anchors: ['main', 'about', 'works', 'work-list', 'review', 'contact'],
    navigation: true,
    navigationPosition: 'right',
    onLeave: (origin, dest) => {
        if (!triggered && dest.anchor === 'about') {
            triggered = true;
            triggerPhysicsLanding();
        }
    }
});

// --- 로딩 완료: 엔진+풀페이지+물리 초기화 ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    if (fullpage_api) {
        fullpage_api.setAllowScrolling(false);
        fullpage_api.setKeyboardScrolling(false);
    }
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = 0;
            setTimeout(() => loader.style.display = 'none', 300);
        }
        fullpage_api.moveTo(1);
        fullpage_api.setAllowScrolling(true);
        fullpage_api.setKeyboardScrolling(true);
        initPhysics(true);
        document.body.classList.remove('loading');
    }, 1000);
});

// --- 창 리사이즈 시: 섹션 따라 바닥/트리거 동기화 ---
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        let currentAnchor = null;
        try {
            currentAnchor = fullpage_api.getActiveSection().anchor;
        } catch (e) {}
        initPhysics();
        if (currentAnchor === 'main') {
            createMainGround();
            triggered = false;
        } else {
            triggerPhysicsLanding();
            triggered = true;
        }
    }, 200);
});

// --- contact 섹션 진입/이탈 시 자동 폭죽 이펙트 ---
let fwInt;
(new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            if (!fwInt) fwInt = setInterval(() => {
                const inner = document.querySelector('.section.contact h2');
                if (!inner) return;
                const rect = inner.getBoundingClientRect();
                const margin = 100;
                const x = rect.left + window.scrollX - margin + Math.random() * (rect.width + margin * 2);
                // y: .inner 상단 - margin ~ .inner 하단까지만
                const minY = rect.top + window.scrollY - margin;
                const maxY = rect.top + window.scrollY + rect.height;
                const y = minY + Math.random() * (maxY - minY);

                createFirework(x, y);
            }, 2000);
        } else {
            clearInterval(fwInt);
            fwInt = null;
        }
    });
}, {
    threshold: 0.4
}))
.observe(document.querySelector('.section.contact'));

// --- 폭죽 파티클 생성/애니메이션 ---
function createFirework(x, y) {
    // 1. x, y 위치에 있는 가장 가까운 .section 찾기
    // (클릭 이벤트는 word.closest('.section')과 동일!)
    let section = null;
    const sections = document.querySelectorAll('.section');
    for (let s of sections) {
        const rect = s.getBoundingClientRect();
        const left = rect.left + window.scrollX;
        const top = rect.top + window.scrollY;
        if (x >= left && x <= left + rect.width &&
            y >= top && y <= top + rect.height) {
            section = s;
            break;
        }
    }
    if (!section) section = document.body;
    section.style.position = 'relative'; // 반드시 relative!

    // 2. section 내부 상대좌표로 환산
    const rect = section.getBoundingClientRect();
    const relX = x - rect.left - window.scrollX;
    const relY = y - rect.top - window.scrollY;

    // 3. container를 section 내부에 생성
    const container = document.createElement("div");
    container.className = "firework-container";
    Object.assign(container.style, {
        position: "absolute",
        left: `${relX}px`,
        top: `${relY}px`,
        width: "0",
        height: "0",
        overflow: "visible",
        pointerEvents: "none",
        zIndex: "-1"
    });
    section.appendChild(container);

    // --- 이하 파티클/arms 기존 코드 그대로 ---
    const particleCount = 30;
    const colors = ["#00f0b5", "#b2fff4", "#03796d"];
    const maxRadius = 300;

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * maxRadius;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const particle = document.createElement("div");
        particle.className = "firework-particle";
        Object.assign(particle.style, {
            position: "absolute",
            left: "0px",
            top: "0px",
            width: "8px",
            height: "8px",
            display: "block",
            background: "transparent",
        });
        [
            [-8, 0],
            [8, 0],
            [0, -8],
            [0, 8]
        ].forEach(([ty, tx]) => {
            const arm = document.createElement("div");
            Object.assign(arm.style, {
                position: "absolute",
                width: "8px",
                height: "8px",
                background: color,
                top: `${ty}px`,
                left: `${tx}px`,
                boxShadow: `
      0 0 2px ${color},
      0 0 5px ${color},
      0 0 10px ${color},
      0 0 15px ${color}
    `
            });
            particle.appendChild(arm);
        });
        container.appendChild(particle);

        particle.animate([{
                transform: "translate(0,0) scale(0.5)",
                offset: 0
            },
            {
                transform: `translate(${dx*0.5}px, ${dy*0.5}px) scale(1.2)`,
                offset: 0.3
            },
            {
                transform: `translate(${dx}px, ${dy}px) scale(1)`,
                offset: 0.6
            },
            {
                transform: `translate(${dx}px, ${dy}px) scale(0.8)`,
                offset: 1
            }
        ], {
            duration: 600 + Math.random() * 300,
            delay: Math.random() * 150,
            easing: "steps(4, end)",
            fill: "forwards"
        });
    }
    setTimeout(() => container.remove(), 1000);
}