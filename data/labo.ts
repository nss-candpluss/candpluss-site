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
  number: "01.",
  title: "LABOについて",
  titleWrapSegments: ["LABOに", "ついて"],
  label: "ABOUT C AND+S LABO",
  bodyTitle: "製品をもっと深く知るための場所",
  body:
    "MOYAシリーズの製品展示をはじめ、ZIG STAKEなど、C AND+Sの製品を実際にご覧いただけます。オンラインでは感じることのできないサイズ感や素材感、細部のこだわりまで、ぜひご体感ください。",
  image: {
    src: "/images/labo/labo-materials-01.webp",
    alt: "C AND+S LABO（ダミー画像）",
  },
  bodyImage: {
    src: "/images/labo/labo-materials-01.webp",
    alt: "C AND+S LABO（ダミー画像）",
  },
} as const;

export const laboActivitiesContent = {
  number: "02.",
  title: "LABOでできること",
  titleWrapSegments: ["LABOで", "できること"],
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

const laboDesignTitleLead = "LABOでは";
const laboDesignTitleWrapSegments = [
  "デザイン・開発を",
  "行っています",
] as const;

export const laboDesignContent = {
  number: "03.",
  title: `${laboDesignTitleLead}${laboDesignTitleWrapSegments.join("")}`,
  titleLead: laboDesignTitleLead,
  titleWrapSegments: laboDesignTitleWrapSegments,
  label: "DESIGN & DEVELOPMENT",
  body:
    "C AND+S LABOでは、製品を生み出す拠点でもあります。実際に使い、検証し、改善を重ねることで、美しさと機能を両立した製品を生み出しています。",
  image: "/images/labo/labo-skech-image.webp",
} as const;

export const laboVisitContent = {
  number: "04.",
  title: "LABO見学予約",
  titleWrapSegments: ["LABO", "見学予約"],
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
  number: "05.",
  title: "LABOへのアクセス",
  titleWrapSegments: ["LABOへの", "アクセス"],
  label: "ACCESS",
  address: {
    postal: "〒816-0902",
    street: "福岡県大野城市乙金1-10-40-1F",
  },
  details: [
    { label: "営業時間", value: "10:00 - 17:00" },
    { label: "定休日", value: "土日、祝日、年末年始" },
    { label: "駐車場", value: "あり" },
  ],
  map: {
    src: "https://maps.google.com/maps?q=%E7%A6%8F%E5%B2%A1%E7%9C%8C%E5%A4%A7%E9%87%8E%E5%9F%8E%E5%B8%82%E4%B9%99%E9%87%911-10-40&hl=ja&z=16&output=embed",
    title: "C AND+S LABO の地図",
  },
} as const;
