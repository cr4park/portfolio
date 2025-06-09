// === Remove URL hash on page reload ===
(() => window.history.replaceState(null, null, window.location.pathname))();


// === Mobile Overay ===
(function () {
    const overlay = document.getElementById('mobile-overlay');

    function checkViewport() {
        if (window.innerWidth < 767) {
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }
    window.addEventListener('load', checkViewport);
    window.addEventListener('resize', checkViewport);
})();

// === Scroll Indicator ===
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

// === Swiper Initialization ===
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

// === Pulse Random Word ===
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

// === Typing Effect ===
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

// === Project Image Backgrounds ===
(() => {
    document.querySelectorAll('.project-list .swiper-slide').forEach(slide => {
        const id = slide.dataset.name;
        const list = slide.closest('.project-list');
        if (!id || !list) return;
        const folder = [...list.classList].find(c => c !== 'project-list');
        if (folder) slide.style.backgroundImage = `url('images/works/${folder}/${id}.jpg')`;
    });
})();

// === Glitch Letter Effects ===
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

// === Loading & fullPage.js + Secondary Landing ===
let triggered = false;
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
        dropWords();
        document.body.classList.remove('loading');
    }, 1000);
});

// === 1Skill Physics Engine & Click Events ===
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
engine.timing.timeScale = 1.5;
engine.gravity.y = 1.5;
world = engine.world;
let W = window.innerWidth,
    H = window.innerHeight;
const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: W,
        height: H,
        wireframes: false,
        background: 'transparent'
    }
});
const FIXED_DT = 1000 / 60;
setInterval(() => {
  Engine.update(engine, FIXED_DT);
}, FIXED_DT);
// initial ground for 1st drop
let ground;
(function () {
    const m = document.querySelector('.section.main .inner');
    const y = m.offsetTop + m.offsetHeight + 20;
    ground = Bodies.rectangle(W / 2, y, W, 40, {
        isStatic: true
    });
    Composite.add(world, ground);
})();

const skillBox = document.querySelector('.skill-box');
const words = ['HTML', 'CSS', 'JavaScript', 'jQuery', 'SCSS', 'Webkit', 'Photoshop', 'XD', 'Zeplin', 'Figma', 'SVN', 'Git', 'Sourcetree', 'Github', 'Bitbucket'];
const wordObjects = [];

function dropWords() {
    words.forEach(text => {
        const dom = document.createElement('div');
        dom.className = 'word';
        dom.textContent = text;
        skillBox.appendChild(dom);
        requestAnimationFrame(() => {
            const b = Bodies.rectangle(W / 2 + (Math.random() * 200 - 100), -20 - Math.random() * 30, dom.offsetWidth, dom.offsetHeight, {
                restitution: 0.8,
                friction: 0.2,
                density: 0.005,
                angle: Math.random() * 0.2 - 0.1
            });
            b.inertia = Infinity;
            b.inverseInertia = 0;
            Composite.add(world, b);
            wordObjects.push({
                dom,
                body: b
            });
            bindClick(dom, b);
        });
    });
}
Events.on(engine, 'afterUpdate', () => {
    wordObjects.forEach(({
        dom,
        body
    }) => {
        dom.style.left = (body.position.x - dom.offsetWidth / 2) + 'px';
        dom.style.top = (body.position.y - dom.offsetHeight / 2) + 'px';
        let d = body.angle * 180 / Math.PI;
        dom.style.transform = `rotate(${Math.max(-60,Math.min(60,d))}deg)`;
    });
});
Events.on(engine, 'beforeUpdate', () => {
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
});

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

// === 2nd Landing Trigger ===
function triggerPhysicsLanding() {
    Composite.remove(world, ground);
    const grid = document.querySelector('.word-grid');
    const y = grid.getBoundingClientRect().top + window.scrollY + 15;
    ground = Bodies.rectangle(W / 2, y, W * 0.95, 80, {
        isStatic: true
    });
    Composite.add(world, ground);
}

// === Contact Section Fireworks ===
let fwInt;
(new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            if (!fwInt) fwInt = setInterval(() => {
                const x = Math.random() * W,
                    y = Math.random() * (H / 2);
                createFirework(x, y);
            }, 2000);
        } else {
            clearInterval(fwInt);
            fwInt = null;
        }
    });
}, {
    threshold: 0.4
})).observe(document.querySelector('.section.contact'));

function createFirework(x, y) {
  const container = document.createElement("div");
  container.className = "firework-container";
  Object.assign(container.style, {
    position: "absolute",
    left: `${x}px`,
    top:  `${y}px`,
    width:  "0",
    height: "0",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: "9999"
  });
  document.body.appendChild(container);

  const particleCount = 30;
  const colors        = ["#00f0b5", "#b2fff4", "#03796d"];
  const maxRadius     = 300;

  for (let i = 0; i < particleCount; i++) {
    // 1) 원형 분포 계산
    const angle  = Math.random() * Math.PI * 2;
    const radius = Math.random() * maxRadius;
    const dx     = Math.cos(angle) * radius;
    const dy     = Math.sin(angle) * radius;
    const color  = colors[Math.floor(Math.random() * colors.length)];

    // 2) 파티클 + 십자팔 생성
    const particle = document.createElement("div");
    particle.className = "firework-particle";
    Object.assign(particle.style, {
      position: "absolute",
      left: "0px",
      top:  "0px",
      width:  "8px",
      height: "8px",
      display: "block",
      background: "transparent"
    });
    [[-8,0],[8,0],[0,-8],[0,8]].forEach(([ty, tx])=>{
      const arm = document.createElement("div");
      Object.assign(arm.style, {
        position: "absolute",
        width:  "8px",
        height: "8px",
        background: color,
        top:    `${ty}px`,
        left:   `${tx}px`
      });
      particle.appendChild(arm);
    });
    container.appendChild(particle);

    // 3) 3단계+scale 애니메이션
    particle.animate([
      // 1단계: 중앙, 원크기 0.5
      { transform: "translate(0,0) scale(0.5)", offset: 0   },
      // 2단계: 약간 퍼짐, 원크기 1.2
      { transform: `translate(${dx*0.5}px, ${dy*0.5}px) scale(1.2)`, offset: 0.3 },
      // 3단계: 최종 퍼짐, 원크기 1.0
      { transform: `translate(${dx}px, ${dy}px) scale(1)`, offset: 0.6 },
      // 4단계: 살짝 축소
      { transform: `translate(${dx}px, ${dy}px) scale(0.8)`, offset: 1   }
    ], {
      duration: 600 + Math.random() * 300, // 600~900ms
      delay:    Math.random() * 150,       // 0~150ms
      easing:   "steps(4, end)",
      fill:     "forwards"
    });
  }

  // 1초 뒤에 컨테이너 제거
  setTimeout(() => container.remove(), 1000);
}
