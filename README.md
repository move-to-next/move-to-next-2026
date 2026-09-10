# MOVE TO THE NEXT — 포트폴리오 2026

신입 웹퍼블리셔 **김재은**의 포트폴리오 사이트입니다.
Figma 디자인을 기반으로 프레임워크 없이 순수 HTML · CSS · JavaScript 로 구현했습니다.

### 🔗 [사이트 바로가기 →](https://move-to-next-2026.vercel.app/)

```
다음 목표들을 향해 앞으로 나아가고 있는 신입 웹퍼블리셔 김재은입니다.
```

---

## 기술 스택

| 구분 | 내용 |
|------|------|
| 마크업 | HTML5 (시맨틱 태그, WAI-ARIA) |
| 스타일 | CSS3 (커스텀 프로퍼티, Grid, Flexbox) |
| 스크립트 | Vanilla JavaScript (ES5 문법, 빌드 도구 없음) |
| 폰트 | Red Rose, Raleway, Montserrat, Pretendard |
| 이미지 | WebP |

별도의 빌드 과정이 없어 정적 호스팅에 그대로 배포할 수 있습니다.

## 실행 방법

```bash
npx serve .
```

VS Code **Live Server** 확장으로 열어도 동일하게 동작합니다.

> `index.html` 을 직접 열어도 되지만, 일부 브라우저 기능(클립보드 복사 등)은
> `http://` 또는 `https://` 환경에서만 정상 동작합니다.

## 폴더 구조

```
.
├── index.html
├── css/
│   ├── reset.css       브라우저 기본 스타일 초기화
│   ├── base.css        디자인 토큰 · 타이포 · 공통 컴포넌트
│   ├── sections.css    섹션별 레이아웃
│   └── responsive.css  반응형 (1720 / 1280 / 1023 / 767)
├── js/
│   └── main.js         인터랙션 전반
└── assets/
    ├── images/         WebP 이미지
    └── icons/          SVG 아이콘
```

---

## 섹션 구성

### HERO
- 하늘 배경 위 **구름 3겹 무한 패럴랙스** — 가까운 구름일수록 빠르게 흐릅니다
- 인트로 연출: 하늘만 1초 → 타이틀 → 문구 박스 → 헤더·스크롤 순으로 등장
- 문구는 **한글 자모 조합 타이핑** (`ㄱ → 기 → 김`)
- 문구 박스는 **유리 굴절 효과** 적용

### ABOUT
- 무한 가로 마퀴, 세로 롤링 문구
- GitHub · Velog 링크

### EXPERIENCE
- CAREER · EDUCATION · LICENCE 세 영역
- 타임라인은 **선이 먼저 그어진 뒤 포인트가 순차 등장**
- CAREER 항목에 마우스를 올리면 원이 가로로 늘어나며 상세 내용 표시

### SKILLS
- **키보드 키캡** 형태의 툴 목록 (3D 측면 벽 + 눌림 효과)
- 키를 누르면 우측 패널이 해당 툴의 상세 설명으로 전환

### PROJECTS
- DESIGN / PUBLISHING 탭 전환 (WAI-ARIA Tabs 패턴)
- 썸네일 갤러리

### CONTACT
- 이메일 주소와 **클립보드 복사 버튼**

---

## 구현 포인트

### 유리 굴절 (Glass Refraction)
`backdrop-filter` 에 SVG `feDisplacementMap` 을 결합해 배경이 실제로 휘어 보이도록 했습니다.
변위맵은 **캔버스로 직접 생성**하며, 알약 테두리까지의 거리(SDF)를 계산해
가장자리에서만 바깥 방향으로 배경을 밀어냅니다.

타이핑으로 박스 크기가 변할 때마다 변위맵을 다시 그려
맵과 요소 크기가 어긋나 생기는 이음매를 방지했습니다.

### 한글 자모 조합 타이핑
유니코드 한글 음절을 초성 · 중성 · 종성으로 분해해
실제 타이핑처럼 글자가 조합되는 과정을 재현했습니다.

```
김 → ㄱ → 기 → 김
은 → ㅇ → 으 → 은
```

### 키캡 3D
윗면(이미지)과 측면 벽(배경색) 2단 구조로 입체감을 만들고,
호버 시 윗면이 내려앉아 실제로 눌리는 느낌을 줍니다.

### 이음매 없는 격자 배경
원본 이미지에서 격자 **한 칸만 정확히 잘라내** 반복시켜,
섹션 높이와 무관하게 칸 크기가 일정하고 경계에서 끊기지 않습니다.

### 성능
전체 이미지를 WebP 로 변환하고 표시 크기에 맞춰 리사이즈했습니다.

```
26.5MB → 1.5MB (94% 감소)
```

---

## 접근성

- 시맨틱 마크업, 본문 바로가기 링크, 헤딩 레벨 준수
- 모든 이미지에 `alt` 제공 (장식 이미지는 빈 `alt`)
- 탭·키캡 등 상호작용 요소는 키보드로 조작 가능
- `prefers-reduced-motion: reduce` 설정 시 모든 애니메이션 비활성화

## 반응형

| 브레이크포인트 | 대응 |
|---|---|
| ~1720px | 좌우 여백 축소 |
| ~1280px | 타이포 축소, SKILLS 세로 전환 |
| ~1023px | 햄버거 메뉴, 타임라인 세로 전환 |
| ~767px | 1단 레이아웃 |

---

## 배포

[Vercel](https://vercel.com) 로 배포했습니다.
`main` 브랜치에 푸시하면 자동으로 재배포됩니다.

**https://move-to-next-2026.vercel.app/**

## 링크

- 사이트 — https://move-to-next-2026.vercel.app/
- GitHub — https://github.com/move-to-next
- Velog — https://velog.io/@move-to-next/posts
- Email — rlawodms95@gmail.com
