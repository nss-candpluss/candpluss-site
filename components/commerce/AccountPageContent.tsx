import { redirect } from "next/navigation";

import { ACCOUNT_LOGIN_START_PATH } from "@/lib/commerce/account-login";
import {
  fetchCustomerAccountSnapshot,
  type CustomerAddressDetail,
  type CustomerMoney,
  type CustomerOrderDetail,
  type CustomerSection,
} from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";
import { inputText } from "@/lib/typography";

const NOT_REGISTERED = "登録なし";

function formatMoney(money?: CustomerMoney | null) {
  if (!money) {
    return NOT_REGISTERED;
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(money.amount));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return NOT_REGISTERED;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBoolean(value: boolean) {
  return value ? "はい" : "いいえ";
}

function formatText(value?: string | null) {
  return value?.trim() ? value : NOT_REGISTERED;
}

function formatList(values: readonly string[]) {
  return values.length ? values.join(", ") : NOT_REGISTERED;
}

const inputClassName =
  `mt-2 w-full border border-[#ccc] bg-transparent px-4 py-3 font-body-ja ${inputText(14)}`;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="font-ui-en text-xl font-semibold">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** ラベルと値を 1 行で並べる。値が無いものは「登録なし」で埋める */
function Field({ label, value }: { label: string; value: string }) {
  const isEmpty = value === NOT_REGISTERED;

  return (
    <div className="grid gap-1 border-b border-[#eee] py-3 min-[640px]:grid-cols-[200px_minmax(0,1fr)] min-[640px]:gap-4">
      <dt className="font-body-ja text-xs text-[var(--color-muted)]">{label}</dt>
      <dd
        className={`font-body-ja text-sm break-words ${
          isEmpty ? "text-[var(--color-muted)]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function FieldList({ children }: { children: React.ReactNode }) {
  return <dl className="border-t border-[#eee]">{children}</dl>;
}

function AddressFields({
  address,
  prefix,
}: {
  address?: CustomerAddressDetail | null;
  prefix: string;
}) {
  if (!address) {
    return (
      <p className="font-body-ja text-sm text-[var(--color-muted)]">
        {prefix}: {NOT_REGISTERED}
      </p>
    );
  }

  return (
    <FieldList>
      <Field label={`${prefix} / ID`} value={address.id} />
      <Field label={`${prefix} / 氏名`} value={formatText(address.name)} />
      <Field label={`${prefix} / 姓`} value={formatText(address.lastName)} />
      <Field label={`${prefix} / 名`} value={formatText(address.firstName)} />
      <Field label={`${prefix} / 会社名`} value={formatText(address.company)} />
      <Field label={`${prefix} / 郵便番号`} value={formatText(address.zip)} />
      <Field label={`${prefix} / 国`} value={formatText(address.country)} />
      <Field
        label={`${prefix} / 国コード`}
        value={formatText(address.territoryCode)}
      />
      <Field label={`${prefix} / 都道府県`} value={formatText(address.province)} />
      <Field
        label={`${prefix} / 都道府県コード`}
        value={formatText(address.zoneCode)}
      />
      <Field label={`${prefix} / 市区町村`} value={formatText(address.city)} />
      <Field label={`${prefix} / 住所1`} value={formatText(address.address1)} />
      <Field label={`${prefix} / 住所2`} value={formatText(address.address2)} />
      <Field
        label={`${prefix} / 電話番号`}
        value={formatText(address.phoneNumber)}
      />
      <Field
        label={`${prefix} / エリア表記`}
        value={formatText(address.formattedArea)}
      />
      <Field
        label={`${prefix} / 整形済み住所`}
        value={formatList(address.formatted)}
      />
    </FieldList>
  );
}

/** スコープ不足などで取れなかった区画は、理由をそのまま出す */
function SectionError({ error }: { error: string }) {
  return (
    <p className="font-body-ja text-sm text-[#9b1b30]">
      取得できませんでした: {error}
    </p>
  );
}

function OrderCard({ order }: { order: CustomerOrderDetail }) {
  return (
    <li className="border border-[#ddd] p-6">
      <FieldList>
        <Field label="注文番号" value={order.name} />
        <Field label="連番" value={String(order.number)} />
        <Field
          label="確認番号"
          value={formatText(order.confirmationNumber)}
        />
        <Field label="ID" value={order.id} />
        <Field label="注文日時" value={formatDateTime(order.processedAt)} />
        <Field label="作成日時" value={formatDateTime(order.createdAt)} />
        <Field label="更新日時" value={formatDateTime(order.updatedAt)} />
        <Field
          label="キャンセル日時"
          value={formatDateTime(order.cancelledAt)}
        />
        <Field
          label="キャンセル理由"
          value={formatText(order.cancelReason)}
        />
        <Field label="編集済み" value={formatBoolean(order.edited)} />
        <Field label="支払い状況" value={formatText(order.financialStatus)} />
        <Field label="配送状況" value={formatText(order.fulfillmentStatus)} />
        <Field
          label="配送が必要"
          value={formatBoolean(order.requiresShipping)}
        />
        <Field label="通貨" value={order.currencyCode} />
        <Field label="メールアドレス" value={formatText(order.email)} />
        <Field label="電話番号" value={formatText(order.phone)} />
        <Field label="備考" value={formatText(order.note)} />
        <Field label="発注番号" value={formatText(order.poNumber)} />
        <Field label="ロケール" value={formatText(order.customerLocale)} />
        <Field label="出荷元" value={formatText(order.locationName)} />
        <Field label="小計" value={formatMoney(order.subtotal)} />
        <Field label="税" value={formatMoney(order.totalTax)} />
        <Field label="チップ" value={formatMoney(order.totalTip)} />
        <Field label="関税" value={formatMoney(order.totalDuties)} />
        <Field label="送料" value={formatMoney(order.totalShipping)} />
        <Field label="返金額" value={formatMoney(order.totalRefunded)} />
        <Field label="合計" value={formatMoney(order.totalPrice)} />
        <Field label="ステータスページ" value={order.statusPageUrl} />
      </FieldList>

      <div className="mt-8">
        <h4 className="font-ui-en text-sm font-semibold">SHIPPING ADDRESS</h4>
        <div className="mt-3">
          <AddressFields address={order.shippingAddress} prefix="配送先" />
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-ui-en text-sm font-semibold">BILLING ADDRESS</h4>
        <div className="mt-3">
          <AddressFields address={order.billingAddress} prefix="請求先" />
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-ui-en text-sm font-semibold">LINE ITEMS</h4>
        {order.lineItems.nodes.length ? (
          <ul className="mt-3 flex flex-col gap-6">
            {order.lineItems.nodes.map((lineItem) => (
              <li key={lineItem.id}>
                <FieldList>
                  <Field label="商品名" value={lineItem.name} />
                  <Field label="タイトル" value={formatText(lineItem.title)} />
                  <Field
                    label="バリエーション"
                    value={formatText(lineItem.variantTitle)}
                  />
                  <Field label="SKU" value={formatText(lineItem.sku)} />
                  <Field
                    label="ベンダー"
                    value={formatText(lineItem.vendor)}
                  />
                  <Field
                    label="商品タイプ"
                    value={formatText(lineItem.productType)}
                  />
                  <Field label="数量" value={String(lineItem.quantity)} />
                  <Field
                    label="返品可能数"
                    value={String(lineItem.refundableQuantity)}
                  />
                  <Field
                    label="配送が必要"
                    value={formatBoolean(lineItem.requiresShipping)}
                  />
                  <Field
                    label="ギフトカード"
                    value={formatBoolean(lineItem.giftCard)}
                  />
                  <Field label="単価" value={formatMoney(lineItem.price)} />
                  <Field
                    label="小計"
                    value={formatMoney(lineItem.totalPrice)}
                  />
                  <Field
                    label="割引額"
                    value={formatMoney(lineItem.totalDiscount)}
                  />
                  <Field
                    label="画像 URL"
                    value={formatText(lineItem.image?.url)}
                  />
                  <Field
                    label="画像 alt"
                    value={formatText(lineItem.image?.altText)}
                  />
                </FieldList>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-body-ja text-sm text-[var(--color-muted)]">
            {NOT_REGISTERED}
          </p>
        )}
      </div>
    </li>
  );
}

function SectionBody<T>({
  section,
  empty,
  render,
  isEmpty,
}: {
  section: CustomerSection<T>;
  empty: string;
  isEmpty: (data: T) => boolean;
  render: (data: T) => React.ReactNode;
}) {
  if (section.error) {
    return <SectionError error={section.error} />;
  }

  if (!section.data || isEmpty(section.data)) {
    return (
      <p className="font-body-ja text-sm text-[var(--color-muted)]">{empty}</p>
    );
  }

  return <>{render(section.data)}</>;
}

/**
 * 公開ページの `/account` とテスト領域の `/shopify-test/account` で共有する。
 * 会員機能のリリース前は公開側が閉じているだけで、画面は 2 系統に分けない。
 *
 * いまは Customer Account API から何が取れるかを確認するための仮画面なので、
 * 取得できた項目をそのまま並べている。未登録の項目は「登録なし」で埋める。
 */
export async function AccountPageContent() {
  const isStaticExport = process.env.STATIC_EXPORT === "true";
  const session = isStaticExport ? null : await getLiveCustomerTokenSession();

  if (!session && !isStaticExport) {
    // 案内ページを挟まず Shopify のサインイン画面へ送る。自前の画面で
    // メールを聞いても、Shopify 側で同じ入力をやり直すことになる。
    redirect(ACCOUNT_LOGIN_START_PATH);
  }

  // ログイン済みで取得に失敗したときは、ログインへ戻さず理由を出す。
  // 戻すとサイレント再ログインで戻ってきて同じ失敗を繰り返す。
  let snapshot: Awaited<ReturnType<typeof fetchCustomerAccountSnapshot>> | null =
    null;
  let snapshotError: string | null = null;

  if (session) {
    try {
      snapshot = await fetchCustomerAccountSnapshot(session.accessToken);
    } catch (cause) {
      snapshotError =
        cause instanceof Error ? cause.message : "アカウント情報を取得できませんでした。";
    }
  }

  return (
    <main
      data-header-theme="onLight"
      className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <h1 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-none">
        Account
      </h1>

      {snapshotError ? (
        <div className="mt-12 max-w-[620px]">
          <SectionError error={snapshotError} />
          <form action="/account/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="border-b border-current font-ui-en text-sm"
            >
              LOGOUT
            </button>
          </form>
        </div>
      ) : null}

      {!snapshot && !snapshotError ? (
        <div className="mt-12 max-w-[620px]">
          <p className="font-body-ja text-sm leading-relaxed">
            Shopifyアカウントでログインすると、プロフィールと注文履歴を確認できます。
          </p>
          <p className="mt-6 font-body-ja text-sm text-[var(--color-muted)]">
            アカウント機能はVercel環境への移行後に利用できます。
          </p>
        </div>
      ) : null}

      {snapshot ? (
        <div className="mt-12 max-w-[860px]">
          <p className="font-body-ja text-sm text-[var(--color-muted)]">
            Customer Account API から取得できる項目を並べた確認用の画面です。
            未登録の項目は「{NOT_REGISTERED}」と表示しています。
          </p>
          <form action="/account/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="border-b border-current font-ui-en text-sm"
            >
              LOGOUT
            </button>
          </form>

          <Section title="PROFILE">
            <FieldList>
              <Field label="ID" value={snapshot.profile.id} />
              <Field label="表示名" value={formatText(snapshot.profile.displayName)} />
              <Field label="姓" value={formatText(snapshot.profile.lastName)} />
              <Field label="名" value={formatText(snapshot.profile.firstName)} />
              <Field
                label="メールアドレス"
                value={formatText(snapshot.profile.emailAddress?.emailAddress)}
              />
              <Field
                label="メール配信状態"
                value={formatText(snapshot.profile.emailAddress?.marketingState)}
              />
              <Field
                label="電話番号"
                value={formatText(snapshot.profile.phoneNumber?.phoneNumber)}
              />
              <Field
                label="アカウント作成日時"
                value={formatDateTime(snapshot.profile.creationDate)}
              />
              <Field label="タグ" value={formatList(snapshot.profile.tags)} />
              <Field
                label="アバター画像 URL"
                value={formatText(snapshot.profile.imageUrl)}
              />
            </FieldList>
          </Section>

          <Section title="DEFAULT ADDRESS">
            <AddressFields
              address={snapshot.profile.defaultAddress}
              prefix="既定の住所"
            />
          </Section>

          <Section title="ADDRESSES">
            {snapshot.profile.addresses.nodes.length ? (
              <ul className="flex flex-col gap-8">
                {snapshot.profile.addresses.nodes.map((address, index) => (
                  <li key={address.id}>
                    <AddressFields
                      address={address}
                      prefix={`住所 ${index + 1}`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body-ja text-sm text-[var(--color-muted)]">
                {NOT_REGISTERED}
              </p>
            )}
          </Section>

          <Section title="ORDERS">
            <SectionBody
              section={snapshot.orders}
              empty="注文履歴はありません。"
              isEmpty={(orders) => orders.length === 0}
              render={(orders) => (
                <ul className="flex flex-col gap-10">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </ul>
              )}
            />
          </Section>

          <Section title="STORE CREDIT">
            <SectionBody
              section={snapshot.storeCreditAccounts}
              empty="ストアクレジットはありません。"
              isEmpty={(accounts) => accounts.length === 0}
              render={(accounts) => (
                <FieldList>
                  {accounts.map((account) => (
                    <Field
                      key={account.id}
                      label={account.balance.currencyCode}
                      value={formatMoney(account.balance)}
                    />
                  ))}
                </FieldList>
              )}
            />
          </Section>

          <Section title="RELATED RECORDS">
            <SectionBody
              section={snapshot.relatedRecordCounts}
              empty="関連レコードはありません。"
              isEmpty={() => false}
              render={(counts) => (
                <FieldList>
                  <Field
                    label="法人担当者 (B2B)"
                    value={`${counts.companyContacts} 件`}
                  />
                  <Field
                    label="定期購入契約"
                    value={`${counts.subscriptionContracts} 件`}
                  />
                  <Field
                    label="下書き注文"
                    value={`${counts.draftOrders} 件`}
                  />
                </FieldList>
              )}
            />
          </Section>

          <Section title="UPDATE PROFILE">
            <form
              action="/api/shopify/customer/profile"
              method="post"
              className="grid gap-5 min-[640px]:grid-cols-2"
            >
              <label className="font-body-ja text-sm">
                姓
                <input
                  name="lastName"
                  defaultValue={snapshot.profile.lastName ?? ""}
                  maxLength={100}
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                名
                <input
                  name="firstName"
                  defaultValue={snapshot.profile.firstName ?? ""}
                  maxLength={100}
                  className={inputClassName}
                />
              </label>
              <button
                type="submit"
                className="bg-[var(--foreground)] px-6 py-4 font-ui-en text-sm text-white min-[640px]:col-span-2 min-[640px]:w-fit"
              >
                UPDATE PROFILE
              </button>
            </form>
          </Section>

          <Section title="UPDATE ADDRESS">
            <form
              action="/api/shopify/customer/address"
              method="post"
              className="grid gap-5 min-[640px]:grid-cols-2"
            >
              <input
                type="hidden"
                name="addressId"
                value={snapshot.profile.defaultAddress?.id ?? ""}
              />
              <input type="hidden" name="territoryCode" value="JP" />
              <label className="font-body-ja text-sm">
                姓
                <input
                  name="lastName"
                  defaultValue={snapshot.profile.defaultAddress?.lastName ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                名
                <input
                  name="firstName"
                  defaultValue={snapshot.profile.defaultAddress?.firstName ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                郵便番号
                <input
                  name="zip"
                  defaultValue={snapshot.profile.defaultAddress?.zip ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                都道府県コード
                <input
                  name="zoneCode"
                  defaultValue={snapshot.profile.defaultAddress?.zoneCode ?? ""}
                  placeholder="JP-40"
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                市区町村
                <input
                  name="city"
                  defaultValue={snapshot.profile.defaultAddress?.city ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                住所1
                <input
                  name="address1"
                  defaultValue={snapshot.profile.defaultAddress?.address1 ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                住所2
                <input
                  name="address2"
                  defaultValue={snapshot.profile.defaultAddress?.address2 ?? ""}
                  className={inputClassName}
                />
              </label>
              <button
                type="submit"
                className="bg-[var(--foreground)] px-6 py-4 font-ui-en text-sm text-white min-[640px]:col-span-2 min-[640px]:w-fit"
              >
                UPDATE ADDRESS
              </button>
            </form>
          </Section>
        </div>
      ) : null}
    </main>
  );
}
