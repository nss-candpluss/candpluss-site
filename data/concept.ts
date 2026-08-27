/**
 * CONCEPT ページ本文（仮）
 * 正式文言・SVGが確定したら、このファイルの内容を差し替えてください。
 */

export const conceptContent = {
  title: "CONCEPT",
  backgrounds: {
    sky: "/images/concept/concept-bg-sky.webp",
    mountainBack: "/images/concept/concept-bg-mountain-back.webp",
    mountainMiddle: "/images/concept/concept-bg-mountain-middle.webp",
    hill: "/images/concept/concept-bg-hill.webp",
    grass: "/images/concept/concept-bg-grass.webp",
  },
  logo: {
    src: "/assets/concept/logo-candpluss-tagline-white.svg",
    alt: "C AND+S",
  },
  top: {
    lead: "CAMP にプラス “S” を",
    body:
      "C AND+S（シーアンドプラスエス）は、ユーザーのキャンプライフに新たな価値をもたらす “S” を探求し、創造するブランドです。\n私たちが掲げる “S” には 3つの意味が込められています。",
  },
  sections: [
    {
      id: "something",
      headingImage: "/assets/concept/concept-something.svg",
      headingAlt: '+"S"omething.',
      subtitle: "新たな価値を創造する",
      body:
        "人それぞれ異なる趣味嗜好やライフスタイル。\nその「Something」とキャンプを結びつけるブランド、それがC AND+Sの目指す姿です。\n体験の幅を広げ、キャンプをより自分らしいものへと進化させる。\n私たちは、既成概念にとらわれず、その想いをプロダクトとして形にします。",
    },
    {
      id: "satisfy",
      headingImage: "/assets/concept/concept-satisfy.svg",
      headingAlt: '+"S"atisfy.',
      subtitle: "満たす・応じる・満足する",
      body:
        "耐久性と実用性を備えた設計のもと、国内外の優れたメーカーとともに、パーツ単位で最適な素材と技術を選び抜きます。\n日本の四季に対応し、長く使い続けられる品質と使い心地を追求する。\nそれが、C AND+Sが提供する「Satisfy」です。",
    },
    {
      id: "sustainable",
      headingImage: "/assets/concept/concept-sustainable.svg",
      headingAlt: '+"S"ustainable.',
      subtitle: "次世代へつなぐ持続可能性",
      body:
        "人と自然が共存できる未来を見据え、自然の中で過ごす楽しさや感動を次の世代へとつなぐ。\nその想いから、自然保護活動への寄付をはじめ、様々な環境への取り組みを続けていきます。\nC AND+Sはアウトドアに関わる一員として、その価値を大切にし、歩み続けます。",
    },
  ],
  featureLinks: [
    {
      id: "labo",
      title: "LABO",
      href: "/labo",
      image: "/images/common/link-quality.webp",
    },
    {
      id: "support",
      title: "SUPPORT",
      href: "/support",
      image: "/images/common/link-support.webp",
    },
    {
      id: "about",
      title: "ABOUT US",
      href: "/about",
      image: "/images/common/link-about.webp",
    },
  ],
} as const;
