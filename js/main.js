/* ==========================================================================
   main.js
     - 스크롤 등장 애니메이션
     - 네비게이션 현재 섹션 하이라이트
     - 모바일 햄버거 메뉴
     - PROJECTS 탭 전환
     - 맨 위로 버튼
     - HERO 구름 패럴랙스
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------------
     HERO 인트로

     1) 하늘만 잠시 보여준 뒤
     2) 타이틀 → 3) 문구 박스(+타이핑) → 4) 헤더·스크롤 순으로
     흐릿한 상태에서 초점이 맞듯 등장시킨다.
     ------------------------------------------------------------------------ */

  var HANGUL = {
    CHO: 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''),
    JONG: ('' + ',ㄱ,ㄲ,ㄳ,ㄴ,ㄵ,ㄶ,ㄷ,ㄹ,ㄺ,ㄻ,ㄼ,ㄽ,ㄾ,ㄿ,ㅀ,ㅁ,ㅂ,ㅄ,ㅅ,ㅆ,ㅇ,ㅈ,ㅊ,ㅋ,ㅌ,ㅍ,ㅎ').split(',')
  };

  /*
    한 글자를 조합 단계로 쪼갠다.
      '김' → ['ㄱ', '기', '김']
      '재' → ['ㅈ', '재']
    한글이 아니면 글자 그대로 한 단계.
  */
  function hangulSteps(ch) {
    var code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return [ch];

    var cho = Math.floor(code / 588);
    var jung = Math.floor((code % 588) / 28);
    var jong = code % 28;

    var steps = [HANGUL.CHO[cho]];
    steps.push(String.fromCharCode(0xac00 + cho * 588 + jung * 28)); // 초성+중성
    if (jong) steps.push(ch); // 받침까지
    return steps;
  }

  /*
    요소 안의 텍스트를 한 글자씩 조합해 가며 타이핑한다.
    <strong> 같은 하위 태그의 구조는 그대로 유지한다.
  */
  /*
    텍스트 노드를 순서대로 모아 원본을 기억하고 비운다.
    타이핑 시작 전에 미리 비워둬야 박스가 "빈 상태"로 떠오른다.
  */
  function collectSlots(root) {
    var slots = [];
    (function walk(node) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) return;
          slots.push({ node: n, text: n.nodeValue });
          n.nodeValue = '';
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(root);
    return slots;
  }

  function typeInto(root, opts) {
    var speed = (opts && opts.speed) || 34;
    var done = (opts && opts.done) || function () {};
    var slots = (opts && opts.slots) || collectSlots(root);

    if (!slots.length) return done();

    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    root.appendChild(caret);

    var si = 0;   // 몇 번째 텍스트 조각
    var ci = 0;   // 그 조각의 몇 번째 글자
    var stepI = 0; // 그 글자의 조합 단계
    var steps = null;

    function tick() {
      if (si >= slots.length) {
        if (caret.parentNode) caret.parentNode.removeChild(caret);
        return done();
      }

      var slot = slots[si];

      if (ci >= slot.text.length) {
        si++;
        ci = 0;
        steps = null;
        return tick();
      }

      if (!steps) steps = hangulSteps(slot.text.charAt(ci));

      // 완성된 앞 글자들 + 지금 조합 중인 글자
      slot.node.nodeValue = slot.text.slice(0, ci) + steps[stepI];
      stepI++;

      if (stepI >= steps.length) {
        ci++;
        stepI = 0;
        steps = null;
      }

      /*
        글자가 늘면 박스도 넓어지므로 굴절 변위맵을 함께 갱신한다.
        (맵과 박스 크기가 어긋나면 이음매가 세로선으로 보인다)
      */
      if (typeof window.__rebuildGlassMap === 'function') {
        window.__rebuildGlassMap();
      }

      window.setTimeout(tick, speed);
    }

    tick();
  }

  function initHeroIntro() {
    var root = document.documentElement;
    var items = {
      header: document.querySelector('.site-header.intro-item'),
      title: document.querySelector('.hero__title').closest('.intro-item'),
      lead: document.querySelector('.hero__lead.intro-item'),
      scroll: document.querySelector('.hero__scroll.intro-item')
    };
    var leadText = document.querySelector('.hero__lead-text');

    // 모션 축소 설정이면 연출 없이 즉시 표시
    if (reduceMotion) {
      root.classList.remove('is-intro');
      Object.keys(items).forEach(function (k) {
        if (items[k]) items[k].classList.add('is-in');
      });
      return;
    }

    function show(el) {
      if (el) el.classList.add('is-in');
    }

    /*
      박스가 "빈 상태"로 먼저 떠오르도록 텍스트를 미리 비워둔다.
      (타이핑 시작 시점에 비우면 그 전까지 문장이 보인다)
    */
    var slots = leadText ? collectSlots(leadText) : [];

    // 1초간 하늘만 → 타이틀 → 빈 박스 → 타이핑 → 헤더·스크롤
    window.setTimeout(function () { show(items.title); }, 1000);

    window.setTimeout(function () {
      show(items.lead);

      // 박스가 완전히 떠오른 뒤 타이핑 시작
      window.setTimeout(function () {
        if (!leadText) return;
        typeInto(leadText, {
          speed: 34,
          slots: slots,
          /*
            타이핑 중에는 박스 크기가 계속 변하므로,
            문장이 다 찍힌 뒤 최종 크기로 굴절 변위맵을 다시 만든다.
          */
          done: function () {
            if (typeof window.__rebuildGlassMap === 'function') {
              window.__rebuildGlassMap();
            }
          }
        });
      }, 900);
    }, 1750);

    window.setTimeout(function () {
      show(items.header);
      show(items.scroll);
    }, 2400);
  }

  /* ------------------------------------------------------------------------
     스크롤 등장 — 뷰포트 진입 시 .is-visible 부여 (1회만)
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!targets.length) return;

    // 모션 축소 설정이거나 미지원 브라우저면 즉시 노출
    if (reduceMotion || !hasIO) {
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    /*
      같은 그룹(.reveal-group) 안의 항목들에 순차 지연을 부여한다.
      HTML 에 일일이 data-delay 를 적지 않아도 되도록 여기서 계산한다.
    */
    Array.prototype.forEach.call(
      document.querySelectorAll('.reveal-group'),
      function (group) {
        // 타임라인은 선 그리기 이후로 지연을 따로 계산한다(initTimeline)
        if (group.classList.contains('timeline')) return;

        var items = group.querySelectorAll(':scope > .reveal');
        Array.prototype.forEach.call(items, function (el, i) {
          el.style.setProperty('--reveal-delay', i * 90 + 'ms');
        });
      }
    );

    /*
      화면 밖으로 나가면 다시 숨고, 들어오면 다시 나타난다.
      (unobserve 하지 않으므로 위로 스크롤해도 애니메이션이 재생된다)
    */
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     타임라인 — 선을 먼저 긋고, 그 뒤에 포인트가 순차 등장

     .timeline 은 reveal-group 이지만 항목 지연을 선 그리는 시간만큼
     뒤로 밀어야 하므로 여기서 따로 계산한다.
     ------------------------------------------------------------------------ */
  function initTimeline() {
    var lines = Array.prototype.slice.call(document.querySelectorAll('.timeline'));
    if (!lines.length) return;

    var LINE_MS = 900; // 선이 다 그어지는 시간
    var STEP_MS = 130; // 포인트 사이 간격

    lines.forEach(function (tl) {
      var items = tl.querySelectorAll(':scope > .reveal');
      Array.prototype.forEach.call(items, function (el, i) {
        // 선이 끝난 뒤부터 순차 등장
        el.style.setProperty('--reveal-delay', LINE_MS * 0.55 + i * STEP_MS + 'ms');
      });
    });

    if (reduceMotion || !hasIO) {
      lines.forEach(function (tl) {
        tl.classList.add('is-drawn');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-drawn', entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    lines.forEach(function (tl) {
      observer.observe(tl);
    });
  }

  /* ------------------------------------------------------------------------
     네비게이션 하이라이트 — 화면 중앙을 지나는 섹션을 활성 표시
     ------------------------------------------------------------------------ */
  function initNavHighlight() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.site-nav__link')
    );
    if (!links.length || !hasIO) return;

    var pairs = [];
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var section = document.querySelector(href);
      if (section) pairs.push({ link: link, section: section });
    });
    if (!pairs.length) return;

    /*
      HERO 도 함께 관찰한다.
      HERO 는 GNB 항목이 없으므로, 화면 중앙에 걸리면 모든 링크를 비활성화한다.
      (관찰하지 않으면 페이지 최상단에서 ABOUT 이 켜진 채로 남는다)
    */
    var hero = document.getElementById('hero');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          if (entry.target === hero) {
            pairs.forEach(function (p) {
              p.link.classList.remove('is-active');
            });
            return;
          }

          pairs.forEach(function (p) {
            p.link.classList.toggle('is-active', p.section === entry.target);
          });
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    pairs.forEach(function (p) {
      observer.observe(p.section);
    });
    if (hero) observer.observe(hero);
  }

  /* ------------------------------------------------------------------------
     모바일 햄버거 메뉴
     ------------------------------------------------------------------------ */
  function initNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      var label = toggle.querySelector('.sr-only');
      if (label) label.textContent = open ? '메뉴 닫기' : '메뉴 열기';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // 메뉴 항목 클릭 시 닫기
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.site-nav__link')) setOpen(false);
    });

    // ESC 로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // 데스크탑 폭으로 넓어지면 열림 상태 해제
    var mq = window.matchMedia('(min-width: 1024px)');
    var onChange = function (e) {
      if (e.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ------------------------------------------------------------------------
     SKILLS — 키캡을 누르면 우측 패널이 해당 스킬 상세로 바뀐다

     TODO: figma 외 항목의 설명·별점은 임시값이다. 실제 내용으로 교체할 것.
     ------------------------------------------------------------------------ */
  var SKILL_DATA = {
    figma: {
      name: 'Figma',
      icon: 'assets/images/skills-01.webp',
      rating: 4.5,
      points: [
        '피그마 툴의 기초적인 활용이 가능합니다.',
        '환경변수를 설정하여 디자인토큰을 생성해 여러 요소등에 빠른 적용이 가능합니다.',
        '컴포넌트 설정 및 스타일 가이드 제작으로 재사용성을 살려 효율적인 작업이 가능합니다.'
      ]
    },
    photoshop: {
      name: 'Photoshop',
      icon: 'assets/images/skills-02.webp',
      rating: 4,
      points: ['설명을 입력해 주세요.']
    },
    illustrator: {
      name: 'Illustrator',
      icon: 'assets/images/skills-03.webp',
      rating: 3.5,
      points: ['설명을 입력해 주세요.']
    },
    javascript: {
      name: 'JavaScript',
      icon: 'assets/images/skills-04.webp',
      rating: 3.5,
      points: ['설명을 입력해 주세요.']
    },
    css: {
      name: 'CSS3',
      icon: 'assets/images/skills-05.webp',
      rating: 4.5,
      points: ['설명을 입력해 주세요.']
    },
    html: {
      name: 'HTML5',
      icon: 'assets/images/skills-06.webp',
      rating: 4.5,
      points: ['설명을 입력해 주세요.']
    },
    git: {
      name: 'Git',
      icon: 'assets/images/skills-07.webp',
      rating: 3,
      points: ['설명을 입력해 주세요.']
    },
    claude: {
      name: 'Claude',
      icon: 'assets/images/skills-08.webp',
      rating: 4,
      points: ['설명을 입력해 주세요.']
    },
    gnuboard: {
      name: 'gnuboard',
      // 키캡용(가로 긴 형태)과 달리 상세 패널용은 정사각 버전을 쓴다
      icon: 'assets/images/skills-09-detail.webp',
      rating: 3.5,
      points: ['설명을 입력해 주세요.']
    }
  };

  function initSkillPanel() {
    var panel = document.querySelector('.skills__panel');
    if (!panel) return;

    var intro = panel.querySelector('[data-panel="intro"]');
    var detail = panel.querySelector('[data-panel="detail"]');
    var keys = Array.prototype.slice.call(
      document.querySelectorAll('.keycap[data-skill]')
    );
    if (!intro || !detail || !keys.length) return;

    var elIcon = detail.querySelector('.skill-detail__icon img');
    var elName = detail.querySelector('.skill-detail__name');
    var elStars = detail.querySelector('.skill-detail__stars');
    var elList = detail.querySelector('.skill-detail__list');

    // 기본은 안내 화면
    intro.hidden = false;
    intro.classList.add('is-shown');

    function show(el) {
      var other = el === intro ? detail : intro;
      other.classList.remove('is-shown');
      // 페이드아웃이 끝난 뒤 감춘다
      window.setTimeout(function () {
        if (!other.classList.contains('is-shown')) other.hidden = true;
      }, 300);

      el.hidden = false;
      /*
        hidden 을 푼 직후에는 브라우저가 아직 레이아웃을 반영하지 않아
        곧바로 클래스를 붙이면 transition 이 걸리지 않는다.
        강제로 레이아웃을 계산시킨 뒤 클래스를 붙인다.
      */
      void el.offsetWidth;
      el.classList.add('is-shown');
    }

    function select(key) {
      var data = SKILL_DATA[key];
      if (!data) return;

      elIcon.src = data.icon;
      elIcon.alt = data.name;
      elName.textContent = data.name;
      elStars.style.setProperty('--rating', data.rating);
      elStars.setAttribute('aria-label', '5점 만점에 ' + data.rating + '점');

      elList.innerHTML = '';
      data.points.forEach(function (t) {
        var li = document.createElement('li');
        li.textContent = t;
        elList.appendChild(li);
      });

      keys.forEach(function (k) {
        k.classList.toggle('is-active', k.getAttribute('data-skill') === key);
      });

      show(detail);
    }

    keys.forEach(function (k) {
      k.addEventListener('click', function () {
        // 이미 선택된 키를 다시 누르면 기본 화면으로 되돌린다
        if (k.classList.contains('is-active')) {
          k.classList.remove('is-active');
          show(intro);
          return;
        }
        select(k.getAttribute('data-skill'));
      });
    });
  }

  /* ------------------------------------------------------------------------
     PROJECTS 탭 (WAI-ARIA Tabs 패턴)
     ------------------------------------------------------------------------ */
  function initTabs() {
    var tablist = document.querySelector('.projects__tabs[role="tablist"]');
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll('[role="tab"]')
    );
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;

        // 활성 탭은 초록 배경이므로 화살표를 흰색으로 바꾼다
        var arrow = t.querySelector('.tab__arrow');
        if (arrow) {
          arrow.src = selected
            ? 'assets/icons/proj-arrow-round-white.svg'
            : 'assets/icons/proj-arrow-round-green.svg';
        }

        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        select(tab, false);
      });
    });

    // 좌우 화살표 / Home / End 키보드 조작
    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;

      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = tabs[(i + 1) % tabs.length];
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = tabs[(i - 1 + tabs.length) % tabs.length];
      } else if (e.key === 'Home') {
        next = tabs[0];
      } else if (e.key === 'End') {
        next = tabs[tabs.length - 1];
      }

      if (next) {
        e.preventDefault();
        select(next, true);
      }
    });
  }

  /* ------------------------------------------------------------------------
     복사 버튼 (CONTACT 이메일)
     ------------------------------------------------------------------------ */
  function initCopy() {
    var buttons = document.querySelectorAll('[data-copy]');
    if (!buttons.length) return;

    /*
      navigator.clipboard 는 HTTPS 또는 localhost 에서만 동작한다.
      file:// 로 열었을 때를 대비해 임시 textarea 로 폴백한다.
    */
    function copy(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try {
          ok = document.execCommand('copy');
        } catch (e) {
          ok = false;
        }
        document.body.removeChild(ta);
        ok ? resolve() : reject();
      });
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      var label = btn.querySelector('.contact__copy-text');
      var original = label ? label.textContent : '';
      var timer;

      btn.addEventListener('click', function () {
        copy(btn.getAttribute('data-copy')).then(
          function () {
            btn.classList.add('is-copied');
            if (label) label.textContent = 'COPIED';

            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
              btn.classList.remove('is-copied');
              if (label) label.textContent = original;
            }, 1800);
          },
          function () {
            if (label) label.textContent = 'FAILED';
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
              if (label) label.textContent = original;
            }, 1800);
          }
        );
      });
    });
  }

  /* ------------------------------------------------------------------------
     좌측 섹션 인디케이터
       - HERO 를 벗어나면 나타난다
       - 현재 섹션의 점을 채운다
       - CONTACT(어두운 배경)에서는 흰색으로 반전
     ------------------------------------------------------------------------ */
  function initSectionDots() {
    var nav = document.querySelector('.section-dots');
    if (!nav) return;

    var items = Array.prototype.slice.call(
      nav.querySelectorAll('.section-dots__item')
    );
    var hero = document.getElementById('hero');
    var contact = document.getElementById('contact');
    if (!items.length) return;

    // href → 섹션 매칭
    var pairs = [];
    items.forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var sec = document.querySelector(href);
      if (sec) pairs.push({ item: a, section: sec });
    });
    if (!pairs.length) return;

    if (!hasIO) {
      nav.classList.add('is-shown');
      return;
    }

    // HERO 를 벗어났을 때만 표시
    if (hero) {
      new IntersectionObserver(
        function (entries) {
          nav.classList.toggle('is-shown', !entries[0].isIntersecting);
        },
        { rootMargin: '-40% 0px 0px 0px', threshold: 0 }
      ).observe(hero);
    } else {
      nav.classList.add('is-shown');
    }

    // 화면 중앙을 지나는 섹션을 활성 표시
    var active = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          pairs.forEach(function (p) {
            p.item.classList.toggle('is-active', p.section === entry.target);
          });
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    pairs.forEach(function (p) {
      active.observe(p.section);
    });

    // CONTACT 구간에서는 밝은 색으로 반전
    if (contact) {
      new IntersectionObserver(
        function (entries) {
          nav.classList.toggle('is-dark', entries[0].isIntersecting);
        },
        { rootMargin: '-50% 0px -50% 0px' }
      ).observe(contact);
    }
  }

  /* ------------------------------------------------------------------------
     맨 위로 버튼
     ------------------------------------------------------------------------ */
  function initToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) return;

    btn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });

    // HERO를 벗어나면 표시
    var hero = document.getElementById('hero');
    if (hero && hasIO) {
      new IntersectionObserver(
        function (entries) {
          btn.classList.toggle('is-shown', !entries[0].isIntersecting);
        },
        { threshold: 0 }
      ).observe(hero);
    } else {
      btn.classList.add('is-shown');
    }
  }

  /* ------------------------------------------------------------------------
     유리 굴절 변위맵 생성

     알약(라운드 사각형)까지의 부호거리(SDF)를 구해,
     테두리 안쪽 bezel 폭 안에서만 "바깥 방향"으로 배경을 밀어내는
     변위맵을 캔버스로 그려 SVG feImage 에 넣는다.
       R 채널 = X 변위, G 채널 = Y 변위 (128 = 변위 없음)
     ------------------------------------------------------------------------ */
  function initGlassMap() {
    var lead = document.querySelector('.hero__lead');
    var feImage = document.getElementById('glass-map');
    var filter = document.getElementById('glass-refraction');
    if (!lead || !feImage || !filter) return;

    /*
      굴절 세기.
      변위맵은 채널당 0~255 밖에 담지 못하므로 1.0 을 넘기면 값이 잘려
      "포화된 영역"과 그렇지 않은 영역 사이에 띠 모양 경계가 드러난다.
      1.0 이하로 유지하고, 실제 굴절량은 SVG 의 scale 로 조절한다.
    */
    var AMOUNT = 1;
    var lastKey = '';

    function build() {
      var rect = lead.getBoundingClientRect();
      var w = Math.round(rect.width);
      var h = Math.round(rect.height);
      if (!w || !h) return;

      // 크기가 그대로면 다시 그리지 않는다
      var key = w + 'x' + h;
      if (key === lastKey) return;
      lastKey = key;

      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      var ctx = canvas.getContext('2d');
      var img = ctx.createImageData(w, h);

      var hw = w / 2;
      var hh = h / 2;

      /*
        라운드 사각형 SDF 는 직선부와 곡선부가 만나는 지점에서 기울기 방향이
        꺾여 대각선 자국을 남긴다. 알약은 사실상 타원에 가까우므로
        타원 기반 방사형 감쇠를 쓰면 꺾이는 지점 자체가 없어 매끈하다.
      */

      function clamp255(v) {
        return v < 0 ? 0 : v > 255 ? 255 : v;
      }

      /*
        캡슐(알약) 테두리까지의 거리.
        음수면 안쪽, 0 이면 테두리.
      */
      var radius = Math.min(hw, hh);
      function distToEdge(x, y) {
        var qx = Math.abs(x) - (hw - radius);
        var qy = Math.abs(y) - (hh - radius);
        var ox = Math.max(qx, 0);
        var oy = Math.max(qy, 0);
        return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
      }

      /*
        감쇠 구간을 도형 전체(테두리 → 중심)로 잡는다.

        구간을 짧게 잡으면 굴절이 "끝나는 지점"이 생기고,
        그 자리가 테두리와 나란한 띠로 보인다.
        중심까지 이어지게 하면 끝나는 지점 자체가 없어 띠가 생기지 않는다.
      */
      // 굴절이 실리는 테두리 띠 폭 (높이의 약 1/3)
      var SPAN = Math.max(18, Math.round(h * 0.32));

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var px = x + 0.5 - hw;
          var py = y + 0.5 - hh;

          // 테두리에서 안쪽으로 얼마나 들어왔는가 (0=테두리, 1=중심)
          var inward = Math.min(1, Math.max(0, -distToEdge(px, py) / SPAN));

          /*
            테두리(1) → 중심(0) 으로 감쇠.
            높은 거듭제곱으로 굴절을 테두리 쪽에 몰아주되,
            값이 0 에 닿는 곳은 중심 한 점뿐이라 경계선이 생기지 않는다.
          */
          /*
            f^5 는 감쇠가 너무 급해 테두리 몇 px 에만 굴절이 걸린다.
            f^2 로 완만하게 해 굴절 띠가 눈에 보이도록 한다.
          */
          var f = 1 - inward;
          var falloff = f * f;

          // 방향: 중심에서 바깥으로 (꺾이는 지점 없음)
          var nx = px / hw;
          var ny = py / hh;
          var len = Math.hypot(nx, ny) || 1;

          var i = (y * w + x) * 4;
          img.data[i]     = clamp255(Math.round(128 + (nx / len) * falloff * AMOUNT * 127));
          img.data[i + 1] = clamp255(Math.round(128 + (ny / len) * falloff * AMOUNT * 127));
          img.data[i + 2] = 128;
          img.data[i + 3] = 255;
        }
      }

      ctx.putImageData(img, 0, 0);

      /*
        캡슐은 직선부와 곡선부가 만나는 지점이 있어, 그 경계에서 변위 방향이
        꺾이며 각진 자국이 남는다. 완성된 변위맵을 한 번 흐려 그 꺾임을
        뭉툭하게 만든다. (맵을 흐리는 것이므로 배경 선명도에는 영향이 없다)
      */
      var soft = document.createElement('canvas');
      soft.width = w;
      soft.height = h;
      var sctx = soft.getContext('2d');

      // 흐릴 때 가장자리가 투명으로 번지지 않도록 중립값(128)으로 채워둔다
      sctx.fillStyle = 'rgb(128,128,128)';
      sctx.fillRect(0, 0, w, h);
      sctx.filter = 'blur(' + Math.max(4, Math.round(h * 0.1)) + 'px)';
      sctx.drawImage(canvas, 0, 0);

      var url = soft.toDataURL('image/png');
      feImage.setAttribute('width', w);
      feImage.setAttribute('height', h);
      feImage.setAttribute('href', url);
      // 구형 브라우저 호환
      feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
    }

    build();
    window.addEventListener('resize', build);

    // 웹폰트 로드로 알약 크기가 바뀔 수 있으므로 한 번 더
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(build);
    }

    /*
      인트로 타이핑이 끝나면 박스가 최종 크기가 되므로 그때 다시 그린다.
      (타이핑 전에는 박스가 비어 있어 변위맵이 작게 만들어진다)
    */
    window.__rebuildGlassMap = function () {
      lastKey = '';
      build();
    };
  }

  /* ------------------------------------------------------------------------
     헤더 배경 전환 — HERO 위에서는 투명, 벗어나면 검정
     ------------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    var hero = document.getElementById('hero');
    if (!header) return;

    // HERO가 없으면 항상 불투명하게 둔다
    if (!hero) {
      header.classList.add('is-scrolled');
      return;
    }

    var ticking = false;

    function update() {
      ticking = false;
      // HERO 하단이 헤더 아래로 올라오면 배경을 켠다
      var passed = window.scrollY >= hero.offsetHeight - header.offsetHeight;
      header.classList.toggle('is-scrolled', passed);
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------------
     HERO 구름 패럴랙스 — 스크롤에 따라 구름을 다른 속도로 이동
     ------------------------------------------------------------------------ */
  function initParallax() {
    if (reduceMotion) return;

    var clouds = Array.prototype.slice.call(
      document.querySelectorAll('.hero__cloud')
    );
    var hero = document.getElementById('hero');
    if (!clouds.length || !hero) return;

    // 가까운 구름일수록 스크롤에 크게 반응한다 (CSS 레인 순서와 동일)
    var speeds = [0.32, 0.22, 0.13, 0.07];
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;

      // HERO를 벗어나면 계산하지 않는다
      if (y > hero.offsetHeight) return;

      clouds.forEach(function (el, i) {
        /*
          가로 흐름은 CSS 애니메이션이 transform 으로 담당하므로,
          여기서는 translate(세로) 만 건드려 서로 덮어쓰지 않게 한다.
        */
        el.style.translate = '0 ' + y * (speeds[i] || 0.2) + 'px';
      });
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------------
     초기화
     ------------------------------------------------------------------------ */
  function init() {
    initHeroIntro();
    initScrollReveal();
    initTimeline();
    initNavHighlight();
    initGlassMap();
    initHeaderScroll();
    initNavToggle();
    initSkillPanel();
    initTabs();
    initCopy();
    initSectionDots();
    initToTop();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
