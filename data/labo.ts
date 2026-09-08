export const laboContent = {
  title: "LABO",
  hero: {
    image: "/images/labo/labo-hero.webp",
    title: "C AND+S LABO",
    titleLogo: "/assets/logos/logo-candpluss-labo.svg",
    label: "SEE. TOUCH. EXPERIENCE.",
    body:
      "C AND+S LABOは、製品を実際に見て、触れて、\nその品質やサイズ感を確かめていただける\nブランド体験スペースです。",
  },
} as const;

export const laboAboutContent = {
  title: "LABOについて",
  label: "ABOUT C AND+S LABO",
  bodyTitle: "製品をもっと深く知るための場所",
  body:
    "MOYAシリーズの製品展示をはじめ、ZIG STAKEなど、C AND+Sの製品を実際にご覧いただけます。オンラインでは感じることのできないサイズ感や素材感、細部のこだわりまで、ぜひご体感ください。",
  images: [
    {
      src: "/images/labo/labo-materials-01.webp",
      alt: "C AND+S LABO（ダミー画像 1）",
    },
    {
      src: "/images/labo/labo-materials-02.webp",
      alt: "C AND+S LABO（ダミー画像 2）",
    },
  ],
} as const;

export const laboActivitiesContent = {
  title: "LABOでできること",
  label: "WHAT YOU CAN DO",
  items: [
    {
      id: "moya",
      title: "MOYAを実寸サイズで",
      body: "MOYA500、MOYA420を展示。サイズ感や内部空間、生地、フレーム、各部のディテールを直接ご確認いただけます。",
      image: "/images/labo/labo-materials-03.webp",
    },
    {
      id: "zig-stake",
      title: "細部まで手に取って確かめる",
      body: "燕三条で製造するZIG STAKEを展示。重量感や形状、仕上げなど写真ではわからない細部の品質を直接体感いただけます。",
      image: "/images/home/home-link-zigstake.webp",
    },
    {
      id: "purchase",
      title: "確かめてその場で選ぶ",
      body: "展示製品を実際に確認したうえで、C AND+Sの各種製品をご購入いただけます。",
      image: "/images/home/home-link-products.webp",
    },
  ],
} as const;

export const laboDesignContent = {
  title: "LABOではデザイン・開発を行っています",
  label: "DESIGN & DEVELOPMENT",
  body:
    "C AND+S LABOでは、製品を生み出す拠点でもあります。実際に使い、検証し、改善を重ねることで、美しさと機能を両立した製品を生み出しています。",
  image: "/images/labo/labo-skech-image.jpg",
} as const;

export const laboVisitContent = {
  title: "LABO見学予約",
  label: "VISIT THE LABO",
  body:
    "C AND+S LABOの見学は事前予約制です。MOYAシリーズの実製品の確認など、見学をご希望の方は下記よりご予約ください。",
  notes: [
    "※ 完全予約制です。事前にLINEまたはお問い合わせフォームにてご予約ください。",
    "※ 見学時間の目安は1組様あたり60分程度とさせていただきます。",
    "※ 複数名での見学ご希望のグループ様は最大4名迄とさせていただきます。",
  ],
  lineButton: {
    label: "LINEでご予約",
  },
  contactButton: {
    label: "お問い合わせフォームよりご予約",
    href: "/contact",
  },
} as const;

export const laboAccessContent = {
  title: "LABOへのアクセス",
  label: "ACCESS",
  body: "C AND+S LABO\n〒816-0902\n福岡県大野城市乙金1-10-40-1F\n営業時間：10:00 - 17:00\n定休日：土日、祝日\n駐車場：あり",
  map: {
    src: "https://maps.google.com/maps?q=%E7%A6%8F%E5%B2%A1%E7%9C%8C%E5%A4%A7%E9%87%8E%E5%9F%8E%E5%B8%82%E4%B9%99%E9%87%911-10-40&hl=ja&z=16&output=embed",
    title: "C AND+S LABO の地図",
  },
} as const;
