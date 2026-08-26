"use client";

/**
 * MOYA500 デザイン確認ページを起点にした共通の商品詳細 View。
 * 通常商品は Product のギャラリー・Feature・Size & Spec・Options を使用し、
 * MOYA500 のみ確認済みの拡張ギャラリーと Feature 構成を適用する。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Moya500DesignDesktopHero } from "@/components/products/moya500-design/Moya500DesignDesktopHero";
import {
  Moya500DesignFeatureSection,
  type Moya500DesignFeature,
} from "@/components/products/moya500-design/Moya500DesignFeatureSection";
import { Moya500DesignMobileHero } from "@/components/products/moya500-design/Moya500DesignMobileHero";
import { buildProductDetailGallery } from "@/components/products/moya500-design/gallery-media";
import {
  isConstrainedGalleryConnection,
  preloadMoya500Image,
  uniqueImageSources,
} from "@/components/products/moya500-design/image-preload";
import { ProductOptions } from "@/components/products/ProductOptions";
import { ProductSizeSpecSection } from "@/components/products/ProductSizeSpec";
import { MOYA500_DESIGN_ASSET_HANDLE } from "@/data/products/moya500-design";
import {
  getSelectedVariant,
  resolveProductVariantId,
} from "@/lib/products/helpers";
import { resolveFeatureImageSrc } from "@/lib/products/image-paths";
import { productDetailSectionTitleClassName } from "@/lib/typography";
import type { Product, ProductFeature } from "@/types/product";

type Moya500DesignDetailViewProps = {
  product: Product;
  initialVariantId: string;
  optionProducts: Product[];
  priority?: boolean;
};

type DesignFeatureConfig = {
  sourceId: string;
  id?: string;
  group: "Fabric" | "Flame" | "Structure" | "Parts";
  title?: string;
  body?: string;
  images?: readonly string[];
  mediaSlots?: readonly (string | null)[];
  video?: Moya500DesignFeature["video"];
  links?: Moya500DesignFeature["links"];
};

const DESIGN_SECTION_TITLE_CLASS_NAME = productDetailSectionTitleClassName;

const DESIGN_SIZE_SPEC_TYPOGRAPHY = {
  title: DESIGN_SECTION_TITLE_CLASS_NAME,
  itemName: "text-[14px] leading-[14px]",
  content: "text-[14px] leading-[24.5px]",
  note: "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(22.75px,calc(24.5px*var(--text-scale)),24.5px)]",
  download: "text-[14px] leading-[14px]",
} as const;

const FEATURE_IMAGE_ROOT = "/images/products/moya500";
const featureImageSrc = (filename: string) =>
  `${FEATURE_IMAGE_ROOT}/${filename}`;

const FEATURE_CONFIGS = [
  {
    sourceId: "feature-01",
    group: "Fabric",
    title: "軽量性と耐久性を両立するシルナイロン生地",
    body: "シルナイロンとは、ナイロン生地の両面にシリコンを含浸させることで、素材本来の軽さとしなやかさを活かしながら、優れた強度と耐久性を引き出した高機能素材です。\nMOYAの生地には、軽量性と強度のバランスに優れた70Dナイロンを使用。さらに230Tの高密度な織りと、格子状に補強糸を織り込むリップストップ構造を組み合わせることで、引き裂きに対する耐久性を高めています。\n一般的なポリエステルにPU（ポリウレタン）コーティングを施した生地と比較して、軽さとしなやかさを保ちやすく、PUコーティングに見られる加水分解による経年劣化も起こりにくいことが特徴。シワになりにくく、美しい張り姿をつくりやすいことも、MOYAにシルナイロンを採用した理由のひとつです。\n軽さ、強さ、耐久性、そして美しいシルエット。\nフィールドで長く使い続けることまで見据え、MOYAの生地として選び抜いた素材です。",
    images: [featureImageSrc("moya500-feature-fabric01.webp")],
  },
  {
    sourceId: "feature-02",
    id: "feature-frame-dac",
    group: "Flame",
    title: "優れたしなりと強度を兼ね備えたDAC社製フレームを採用",
    body: "優れたしなりと強度を兼ね備えたDAC社製「A7001 超々ジュラルミン（アルミ合金）」フレームを採用することで、スムーズな設営を可能にし、しっかりとした張り感を生み出します。軽さと強靭さの両立が、MOYA500の安定性を支えています。",
    video: {
      src: "/videos/products/moya500/moya500-wind-test.mp4",
    },
  },
  {
    sourceId: "feature-02",
    id: "feature-frame-dac-company",
    group: "Flame",
    title: "ハイエンドテント向けアルミポールのリーディングカンパニー DAC®",
    body: "DAC®（Dongah Aluminum Corp）は、高強度アルミポール分野で世界市場の約90％を占める、ハイエンドテント向けアルミポールのリーディングカンパニー。確かな技術力を誇り、世界中のトップアウトドアブランドに採用されています。",
    images: [featureImageSrc("moya500-feature-flame02.webp")],
  },
  {
    sourceId: "feature-05",
    id: "feature-structure-scale",
    group: "Structure",
    title: "圧倒的スケール感を誇る大型ドームシェルター",
    body: "設営時サイズは幅5.0m×奥行き4.33m×高さ2.3m。ドーム型のシンプルな構造によりデッドスペースを抑え、大型サイズでありながら直感的に設営できる設計です。\n出入口は3箇所に配置し、それぞれ最大幅2.1m×高さ1.83mのワイドな開口部を確保。複数人で使用する際も出入りがしやすく、大型のキャンプギアの搬入・搬出もスムーズに行えます。また、サイトレイアウトや動線に合わせて出入口を選べるため、設営後も空間を柔軟に使うことができます。デュオからファミリー、グループでの利用まで、人数や過ごし方に応じたゆとりある空間と、快適な居住性を実現しています。",
    mediaSlots: [null],
  },
  {
    sourceId: "feature-06",
    id: "feature-structure-extension",
    group: "Structure",
    title: "多彩な拡張用プロダクトとの連結",
    body: "3箇所の出入り口全てに、多彩な拡張用プロダクトを連結するための専用ジッパーを搭載。\n拡張用プロダクトの組み合わせで、\n薪ストーブの使用、車両との連結、さらにMOYAシリーズどうしの連結など、\nシーンに合わせた、より快適なキャンプライフを実現します。",
    mediaSlots: [null, null],
    links: [{ label: "拡張製品", href: "/products#tent-option" }],
  },
  {
    sourceId: "feature-07",
    id: "feature-structure-mesh",
    group: "Structure",
    title: "優れた通気性と開放感を実現する15面メッシュ",
    body: "シェルター全体に配置された15面のメッシュによって、優れた通気性と開放感を実現。破れにくく目の細かいメッシュを採用することで、小さな虫の侵入を防ぐとともに、外からは見えにくく高いプライバシー性も持ち合わせています。内側から開閉出来る仕様のため、雨天時や就寝時など、シェルター外に出ることなく開閉することができます。",
    mediaSlots: [
      featureImageSrc("moya500-feature-structure03-01.webp"),
      null,
    ],
  },
  {
    sourceId: "feature-07",
    id: "feature-structure-wind",
    group: "Structure",
    title: "風の侵入とバタつきを抑える構造",
    body: "入口の下部にもジッパーを配置。\n開口部を足元まで確実に閉じることで、風による生地の浮き上がりやバタつきを抑制します。\n同時に、地面付近から流れ込む冷気や虫の侵入経路を減らし、季節や環境の変化にも対応。\n細部まで快適性を追求した設計です。",
    images: [featureImageSrc("moya500-feature-structure04.webp")],
  },
  {
    sourceId: "feature-06",
    id: "feature-structure-gear-loops",
    group: "Structure",
    title: "インナーテントを自在に配置する、24箇所のギアループ",
    body: "24箇所に配置したギアループが、6通りのインナーテントレイアウトを可能にします。\n人数や過ごし方に応じて、寝室とリビングのバランスを変えながら、その日のキャンプに最適な空間を構成できます。\nインナーテントを使わない時は、ランタンや小物などを掛けるギアループとして機能。\n設営のためだけではなく、空間をより自由に使うための設計です。",
    mediaSlots: [
      null,
      featureImageSrc("moya500-feature-structure05-02.webp"),
      featureImageSrc("moya500-feature-structure05-03.webp"),
    ],
  },
  {
    sourceId: "feature-05",
    id: "feature-structure-skirt",
    group: "Structure",
    title: "冷気や虫の侵入を抑える、ダブルスカート",
    body: "シェルターの内側と外側、それぞれにスカートを配置。地面付近から入り込む風や冷気、雨、虫の侵入を抑え、シェルター内部の快適性を高めます。\nさらに、外側のスカートにはペグダウンポイントを設置。風の強い環境でもスカートのめくれやバタつきを抑え、裾まわりを安定させます。",
    images: [
      featureImageSrc("moya500-feature-structure06-01.webp"),
      featureImageSrc("moya500-feature-structure06-02.webp"),
    ],
  },
  {
    sourceId: "feature-03",
    id: "feature-parts-dyneema",
    group: "Parts",
    title: "高負荷ポイントを支える、Dyneema®",
    body: "軽量でありながら高い強度と優れた耐摩耗性を備え、UL（ウルトラライト）をはじめとするアウトドアギアにも採用される高機能素材、Dyneema®（ダイニーマ）。\nMOYA500では、その優れた素材特性を活かし、シェルターの中でも特に負荷が集中するポイントに補強生地として採用。耐久性が求められる箇所を的確に補強し、長期使用を見据えた強度と信頼性を高めています。\nさらに、Dyneema®特有の質感を活かすことで、機能素材そのものをデザインのアクセントとして取り入れています。",
    images: [featureImageSrc("moya500-feature-parts01.webp")],
  },
  {
    sourceId: "feature-02",
    id: "feature-parts-zippers",
    group: "Parts",
    title: "用途に応じて選び抜いた、YKK®・3Fジッパー",
    body: "ジッパーには、それぞれ異なる特性を持つYKK®と3Fを採用。\n開閉頻度の高い箇所には、スムーズな操作性と信頼性に優れたYKK®を。シェルター同士をつなぐ連結部分には、自動ロック機能を備え、負荷のかかる環境でも安定した保持力を発揮する3Fを配置しています。\n使用する場所と求められる性能を見極め、それぞれの特性を活かして使い分けています。",
    images: [
      featureImageSrc("moya500-feature-parts02-01.webp"),
      featureImageSrc("moya500-feature-parts02-02.webp"),
    ],
  },
  {
    sourceId: "feature-07",
    id: "feature-parts-duraflex",
    group: "Parts",
    title: "連結部の信頼性を高める、Duraflex®フック",
    body: "インナーテントやグランドシートなどの連結部分には、世界中のアウトドアギアで採用されるDuraflex®（デュラフレックス）製フックを採用。\n優れた耐久性に加え、温度変化の大きな環境にも対応する素材特性を備え、繰り返し着脱するパーツに求められる確かな機能性を発揮します。\n目立たない小さなパーツにも妥協せず、フィールドでの使いやすさと信頼性を追求しています。",
    images: [featureImageSrc("moya500-feature-parts03.webp")],
  },
  {
    sourceId: "feature-05",
    id: "feature-parts-zig-stake",
    group: "Parts",
    title: "燕三条製鍛造ペグ「ZIG STAKE 20」を標準装備",
    body: "MOYA500には、新潟・燕三条で製造するオリジナル鍛造ペグ「ZIG STAKE 20」を標準装備。\n高い強度と粘りを備えたS55Cスチールを採用し、硬く締まった地面にも確実に打ち込める強度と耐久性を追求しています。さらに、打ち込みやすさと保持力を両立する独自の凸型断面、ハンマーの力を伝えやすいワイドヘッド、撤収時の操作性を高める大径センターホールなど、設営から撤収までの使いやすさを細部まで設計。\nテント本体だけでなく、それを支える一本のペグにまで、品質への妥協をしない。MOYA500のために選び抜いた標準装備です。",
    mediaSlots: [null],
    links: [
      { label: "ZIG STAKE20", href: "/products/zig-stake20" },
    ],
  },
  {
    sourceId: "feature-06",
    id: "feature-parts-jammer",
    group: "Parts",
    title: "スムーズな張り調整を支える、オリジナル三角自在金具",
    body: "MOYA500には、C AND+Sオリジナルのアルミ製三角自在を標準装備。ガイロープの長さやテンションをスムーズに調整でき、設営環境に合わせた細かな張り調整を可能にします。\n軽量で耐食性に優れたアルミニウムを採用し、ブラックのボディにはC AND+Sのロゴを配置。機能性だけでなく、小さなパーツまでMOYA500の世界観を統一するためのディテールです。\n※ 同梱されている三角自在金具は9個です",
    mediaSlots: [null],
    links: [
      { label: "自在金具", href: "/products/aluminum-jammer-set" },
    ],
  },
  {
    sourceId: "feature-07",
    id: "feature-parts-guy-rope",
    group: "Parts",
    title: "細径と強度を両立した、日本製ガイロープ",
    body: "MOYA500には、京都のロープメーカー「UUU JAPAN」が手がける日本製ガイロープを標準装備。\n直径約3mmの細径設計ながら約120kgfの引張強度を備え、取り回しの良さと確かな強度を両立しています。さらに反射材を織り込んだリフレクティブ仕様により、夜間の視認性にも配慮。\n美しい張り姿と安定した設営を支える、MOYA500のために選び抜いたガイロープです。\n※ 同梱されているガイロープは4mが9本です",
    mediaSlots: [null],
    links: [
      { label: "自在金具", href: "/products/aluminum-jammer-set" },
    ],
  },
] satisfies readonly DesignFeatureConfig[];

function buildDesignFeatures(
  sourceFeatures: ProductFeature[] | undefined,
  configs: readonly DesignFeatureConfig[],
  colorCode: string,
  colorKeyed: boolean
): Moya500DesignFeature[] {
  const featureById = new Map(sourceFeatures?.map((feature) => [feature.id, feature]));

  return configs.map((config): Moya500DesignFeature => {
    const sourceFeature = featureById.get(config.sourceId);

    return {
      ...sourceFeature,
      id: config.id ?? sourceFeature?.id ?? config.sourceId,
      group: config.group,
      title: config.title ?? sourceFeature?.title ?? "",
      body: config.body ?? sourceFeature?.body ?? "",
      image:
        config.video || config.images || config.mediaSlots || !sourceFeature
          ? undefined
          : resolveFeatureImageSrc(sourceFeature, {
              handle: MOYA500_DESIGN_ASSET_HANDLE,
              colorCode,
              colorKeyed,
            }),
      images: config.images ? [...config.images] : undefined,
      mediaSlots: config.mediaSlots ? [...config.mediaSlots] : undefined,
      video: config.video,
      links: config.links,
    };
  });
}

function buildProductFeatures(
  product: Product,
  colorCode: string
): Moya500DesignFeature[] {
  if (product.features?.some((feature) => feature.images?.length || feature.video)) {
    return product.features;
  }

  if (product.handle === "moya500" || product.handle === "moya500-design") {
    return buildDesignFeatures(
      product.features,
      FEATURE_CONFIGS,
      colorCode,
      Boolean(product.colorKeyedFeatureImages)
    );
  }

  return (
    product.features?.map((feature) => ({
      ...feature,
      image: resolveFeatureImageSrc(feature, {
        handle: product.handle,
        colorCode,
        colorKeyed: Boolean(product.colorKeyedFeatureImages),
      }),
    })) ?? []
  );
}

export function Moya500DesignDetailView({
  product,
  initialVariantId,
  optionProducts,
}: Moya500DesignDetailViewProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
  const variantRequestRef = useRef(0);

  const preloadVariantEntry = useCallback(
    (variantId: string) => {
      const variant = getSelectedVariant(product, variantId);
      const gallery = buildProductDetailGallery(product, variant);
      const firstItem = gallery[0];
      const thumbnailSources = gallery.map((item) =>
        item.kind === "image" ? item.thumbnailSrc : item.thumbnailPoster
      );
      const criticalSources = uniqueImageSources([
        ...(firstItem?.kind === "image" ? [firstItem.src] : []),
        ...thumbnailSources.slice(0, 6),
      ]);
      const deferredSources = uniqueImageSources(thumbnailSources.slice(6));

      deferredSources.forEach((source) => {
        void preloadMoya500Image(source);
      });

      return Promise.all(criticalSources.map(preloadMoya500Image)).then((results) =>
        results.every(Boolean)
      );
    },
    [product]
  );

  const handleVariantIntent = useCallback(
    (variantId: string) => {
      void preloadVariantEntry(variantId);
    },
    [preloadVariantEntry]
  );

  const handleVariantChange = useCallback(
    async (variantId: string) => {
      if (variantId === selectedVariantId) {
        return;
      }

      const requestId = ++variantRequestRef.current;
      await preloadVariantEntry(variantId);

      if (requestId === variantRequestRef.current) {
        setSelectedVariantId(variantId);
      }
    },
    [preloadVariantEntry, selectedVariantId]
  );

  useEffect(() => {
    const variantIdFromUrl = new URLSearchParams(window.location.search).get("color");
    if (!variantIdFromUrl) {
      return;
    }

    const resolvedVariantId = resolveProductVariantId(product, variantIdFromUrl);
    const timeoutId = window.setTimeout(() => {
      void preloadVariantEntry(resolvedVariantId).then(() => {
        setSelectedVariantId(resolvedVariantId);
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [preloadVariantEntry, product]);

  const selectedVariant = useMemo(
    () => getSelectedVariant(product, selectedVariantId),
    [product, selectedVariantId]
  );

  const selectedColorCode = selectedVariant?.colorCode ?? "";
  const galleryItems = useMemo(
    () => buildProductDetailGallery(product, selectedVariant),
    [product, selectedVariant]
  );
  const features = useMemo(
    () => buildProductFeatures(product, selectedColorCode),
    [product, selectedColorCode]
  );

  useEffect(() => {
    if (!selectedColorCode) {
      return;
    }

    let cancelled = false;
    const currentGallerySources = galleryItems.flatMap(
      (item) => (item.kind === "image" ? [item.src] : [item.poster])
    );
    const alternateEntrySources = product.variants.flatMap((variant) => {
      if (variant.id === selectedVariantId) {
        return [];
      }

      const gallery = buildProductDetailGallery(product, variant);
      const firstItem = gallery[0];
      return [
        ...(firstItem?.kind === "image" ? [firstItem.src] : []),
        ...gallery.map((item) =>
          item.kind === "image" ? item.thumbnailSrc : item.thumbnailPoster
        ),
      ];
    });
    const queue = uniqueImageSources([
      ...currentGallerySources,
      ...alternateEntrySources,
    ]);
    const workerCount = isConstrainedGalleryConnection() ? 1 : 3;

    const preloadWorker = async () => {
      while (!cancelled) {
        const nextSource = queue.shift();
        if (!nextSource) {
          return;
        }

        await preloadMoya500Image(nextSource);
      }
    };

    const startPreloading = () => {
      void Promise.all(
        Array.from({ length: workerCount }, () => preloadWorker())
      );
    };

    if (document.readyState === "complete") {
      startPreloading();
    } else {
      window.addEventListener("load", startPreloading, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", startPreloading);
    };
  }, [galleryItems, product, selectedColorCode, selectedVariantId]);

  return (
    <>
      <Moya500DesignDesktopHero
        key={`desktop-${selectedColorCode}`}
        items={galleryItems}
        product={product}
        selectedVariant={selectedVariant}
        selectedColorCode={selectedColorCode}
        onVariantChange={handleVariantChange}
        onVariantIntent={handleVariantIntent}
      />

      <Moya500DesignMobileHero
        key={`mobile-${selectedColorCode}`}
        items={galleryItems}
        product={product}
        selectedVariant={selectedVariant}
        selectedColorCode={selectedColorCode}
        onVariantChange={handleVariantChange}
        onVariantIntent={handleVariantIntent}
      />

      <Moya500DesignFeatureSection
        id="feature"
        title="Feature"
        features={features}
        priorityFirst
      />

      {product.sizeSpec ? (
        <ProductSizeSpecSection
          sizeSpec={product.sizeSpec}
          typography={DESIGN_SIZE_SPEC_TYPOGRAPHY}
        />
      ) : null}

      {optionProducts.length ? (
        <ProductOptions
          products={optionProducts}
          titleTypographyClassName={DESIGN_SECTION_TITLE_CLASS_NAME}
          cardPresentation="productsListing"
        />
      ) : null}
    </>
  );
}
