# Silhouette Search — 디자인 아이디어

## 세 가지 접근 방식

### A. Ink & Paper
흑백 인쇄물에서 영감을 받은 타이포그래피 중심 디자인. 실루엣 이미지가 마치 도감의 삽화처럼 배치된다.
**Probability:** 0.07

### B. Studio Minimal
오프화이트 배경에 단일 강조색(딥 블루)을 포인트로 쓰는 Apple 스타일의 클린한 인터페이스. 검색창이 중심이고 결과가 격자로 펼쳐진다.
**Probability:** 0.09

### C. Dark Archive
어두운 배경 위에 흰 실루엣이 떠오르는 느낌. 박물관 아카이브 같은 분위기.
**Probability:** 0.03

---

## 선택: B. Studio Minimal

### Design Movement
Swiss International Style + Apple HIG — 기능과 미학이 동등한 비중을 갖는다.

### Core Principles
1. 검색창이 유일한 진입점 — 모든 시선이 여기서 시작한다.
2. 실루엣 이미지가 콘텐츠의 주인공 — UI는 배경으로 물러난다.
3. 여백이 레이아웃을 구성한다 — 요소 간 간격이 위계를 만든다.
4. 흑백 이미지와 오프화이트 배경의 대비만으로 충분하다.

### Color Philosophy
- Background: `#F8F7F4` (따뜻한 오프화이트 — 순백보다 눈에 편함)
- Foreground: `#1A1A1A` (소프트 블랙)
- Accent: `#0066CC` (Apple Blue — 인터랙티브 요소에만 사용)
- Muted: `#8A8A8A` (보조 텍스트)

### Layout Paradigm
검색창이 화면 상단 1/3에 고정되고, 하단 2/3에 결과 격자가 펼쳐지는 비대칭 구조.
결과 카드는 정사각형으로 균일하게 배치되며, 호버 시 아이콘 이름이 나타난다.

### Signature Elements
1. 검색창 하단의 얇은 1px 라인 — 입력 시 파란색으로 전환
2. 결과 카드: 흰 배경에 검은 실루엣, 미세한 그림자
3. 로딩 시 카드가 아래에서 위로 페이드인

### Interaction Philosophy
타이핑 즉시 검색 (debounce 300ms). 결과 카드 클릭 시 SVG 다운로드.

### Animation
- 검색 결과: `opacity: 0 → 1`, `translateY(8px → 0)`, 50ms 스태거
- 카드 호버: `scale(1.03)`, 150ms ease-out
- 로딩 스피너: 미니멀한 원형 회전

### Typography System
- Display: `DM Sans` 700 — 헤더, 브랜드명
- Body: `DM Sans` 400/500 — 일반 텍스트
- Mono: `DM Mono` — 아이콘 이름 레이블

### Brand Essence
"단어를 실루엣으로 — 디자이너를 위한 즉각적인 아이콘 탐색기"
Adjectives: 명료한, 즉각적인, 신뢰할 수 있는

### Brand Voice
- Headline: "단어 하나로 찾는 실루엣"
- CTA: "SVG 다운로드"
- No filler: "환영합니다" 같은 문구 없음

### Wordmark & Logo
S 자를 실루엣 형태로 추상화한 단순한 마크. 텍스트 없이 도형만.

### Signature Brand Color
`#0066CC` — Apple Blue
