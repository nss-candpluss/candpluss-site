import Link from "next/link";
import { redirect } from "next/navigation";
import { Fragment } from "react";

import {
  AccountAddressAdd,
  AccountAddressHeader,
} from "@/components/commerce/AccountAddressControls";
import { FieldNote } from "@/components/commerce/AccountFieldNote";
import { AccountNotice } from "@/components/commerce/AccountNotice";
import { AccountTabs } from "@/components/commerce/AccountTabs";
import { AccountUpdateForm } from "@/components/commerce/AccountUpdateForm";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { SiteImage } from "@/components/ui/SiteImage";
import { contactFormCopy } from "@/data/contact";
import {
  ACCOUNT_LOGIN_START_PATH,
  accountReceiptHref,
} from "@/lib/commerce/account-login";
import { japanZones, normalizeJapanZoneCode } from "@/lib/commerce/japan-zone-code";
import { formHalfSpanClassName } from "@/lib/layout";
import { accountFieldNotes, accountMemberCopy } from "@/lib/commerce/account-field-notes";
import {
  accountOrderLineImageAlt,
  accountOrderLineTitle,
  accountOrderLineVariantTitle,
  accountOrderLinesByAmount,
  accountOrderOptionalFields,
  accountOrderPaymentMethods,
  accountOrderShipmentDisplay,
  formatAccountAddressLine,
  formatAccountAddressName,
  formatAccountDate,
  formatAccountMoney,
  formatAccountMoneyAmount,
  formatAccountOrderPaymentStatus,
  formatAccountOrderDateTime,
  formatAccountName,
  formatAccountShipmentStatus,
} from "@/lib/commerce/account-page";
import {
  fetchCustomerAccountSnapshot,
  getShopifyCustomerProfileUrl,
  isEmailMarketingSubscribed,
  type CustomerAccount,
  type CustomerAccountSnapshot,
  type CustomerAddressDetail,
  type CustomerMoney,
  type CustomerOrderDetail,
  type CustomerSection,
} from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";
import {
  bodyLinkUnderlineClassName,
  bodyText,
  uiText,
} from "@/lib/typography";
import { ContactField } from "@/sections/contact/ContactField";
import {
  contactSelectChevronClassName,
  getContactCheckboxClassName,
  getContactFloatingSelectClassName,
  getContactFloatingSelectStyle,
} from "@/sections/contact/contactStyles";
import { SupportFloatingInput } from "@/sections/support/SupportFloatingField";

const NOT_REGISTERED = "登録なし";

function formatMoney(money?: CustomerMoney | null) {
  return formatAccountMoney(money) ?? NOT_REGISTERED;
}

/** サマリーは税を別の行に出すので、金額に税込を付けない */
function formatAmount(money?: CustomerMoney | null) {
  return formatAccountMoneyAmount(money) ?? NOT_REGISTERED;
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

function formatText(value?: string | null) {
  return value?.trim() ? value : NOT_REGISTERED;
}

const readOnlyHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;
const readOnlyNoteClassName = `mt-[calc(8px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${uiText(13)}`;

function LogoutButton() {
  return (
    <form action="/account/logout" method="post">
      <button
        type="submit"
        className="border-b border-current font-ui-en text-sm"
      >
        LOGOUT
      </button>
    </form>
  );
}

/** ラベルと値を 1 行で並べる。値が無いものは「登録なし」で埋める */
function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  const isEmpty = value === NOT_REGISTERED;

  return (
    <div className="grid gap-1 border-b border-[#eee] py-3 min-[640px]:grid-cols-[200px_minmax(0,1fr)] min-[640px]:gap-4">
      <dt className="font-body-ja text-xs text-[var(--color-muted)]">
        {label}
        {note ? <FieldNote>{note}</FieldNote> : null}
      </dt>
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

function MemberSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
    return (
    <section>
      <h3 className={readOnlyHeadingClassName}>{title}</h3>
      <div className="mt-[calc(24px*var(--gap-scale-y))] flex flex-col gap-[calc(24px*var(--gap-scale-y))]">
        {children}
      </div>
    </section>
  );
}

function ShopifyChangeLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${bodyLinkUnderlineClassName} font-body-ja font-semibold text-[var(--foreground)]`}
    >
      {children}
    </a>
  );
}

function ProfileNameForm({ profile }: { profile: CustomerAccount }) {
  const { placeholders } = contactFormCopy;

  return (
    <AccountUpdateForm
      action="/api/shopify/customer/profile"
      submitLabel="名前を更新する"
    >
      {isEmailMarketingSubscribed(profile.emailAddress?.marketingState) ? (
        <input type="hidden" name="emailMarketing" value="on" />
      ) : null}
      <ContactField
        label="お名前"
        requirement="required"
        note={accountMemberCopy.accountDetails.name}
        fixedTitleSize
        groupedContentGap
      >
        <SiteGrid className="gap-x-[calc(12px*var(--gap-scale-x))] gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="account-last-name"
              name="lastName"
              type="text"
              label={`${placeholders.lastName} *`}
              autoComplete="family-name"
              defaultValue={profile.lastName ?? ""}
              maxLength={100}
              required
            />
          </div>
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="account-first-name"
              name="firstName"
              type="text"
              label={`${placeholders.firstName} *`}
              autoComplete="given-name"
              defaultValue={profile.firstName ?? ""}
              maxLength={100}
              required
            />
          </div>
        </SiteGrid>
      </ContactField>
    </AccountUpdateForm>
  );
}

function EmailMarketingForm({ profile }: { profile: CustomerAccount }) {
  return (
    <AccountUpdateForm
      action="/api/shopify/customer/profile"
      submitLabel="配信設定を更新する"
    >
      <input type="hidden" name="lastName" value={profile.lastName ?? ""} />
      <input type="hidden" name="firstName" value={profile.firstName ?? ""} />
      <ContactField
        label="メール配信"
        requirement="optional"
        note={accountMemberCopy.notifications.emailMarketing}
        fixedTitleSize
        groupedContentGap
      >
        <label className="inline-flex cursor-pointer items-center gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]">
          <input
            type="checkbox"
            name="emailMarketing"
            defaultChecked={isEmailMarketingSubscribed(
              profile.emailAddress?.marketingState
            )}
            className={getContactCheckboxClassName()}
          />
          <span className={`font-body-ja text-[var(--foreground)] ${uiText(14)}`}>
            メールマガジンを受け取る
          </span>
        </label>
      </ContactField>
    </AccountUpdateForm>
  );
}

function AddressForm({
  address,
  formKey,
  isDefault,
}: {
  address?: CustomerAddressDetail;
  formKey: string;
  isDefault: boolean;
}) {
  const { fieldLabels, placeholders } = contactFormCopy;
  const zoneCode = normalizeJapanZoneCode(address?.zoneCode);
  const fieldId = (name: string) => `account-address-${formKey}-${name}`;

  return (
    <AccountUpdateForm
      action="/api/shopify/customer/address"
      submitLabel={address ? "住所を更新する" : "住所を追加する"}
    >
      <input type="hidden" name="intent" value="save" />
      <input type="hidden" name="addressId" value={address?.id ?? ""} />
      <input type="hidden" name="territoryCode" value="JP" />

      <ContactField
        label="お名前"
        requirement="required"
        note={accountFieldNotes.address.name}
        fixedTitleSize
        groupedContentGap
      >
        <SiteGrid className="gap-x-[calc(12px*var(--gap-scale-x))] gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id={fieldId("last-name")}
              name="lastName"
              type="text"
              label={`${placeholders.lastName} *`}
              autoComplete="family-name"
              defaultValue={address?.lastName ?? ""}
              maxLength={100}
              required
            />
          </div>
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id={fieldId("first-name")}
              name="firstName"
              type="text"
              label={`${placeholders.firstName} *`}
              autoComplete="given-name"
              defaultValue={address?.firstName ?? ""}
              maxLength={100}
              required
            />
          </div>
        </SiteGrid>
      </ContactField>

      <ContactField
        label="住所"
        requirement="required"
        note={accountFieldNotes.address.block}
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div>
            <div className="max-w-[240px]">
              <SupportFloatingInput
                id={fieldId("zip")}
                name="zip"
                type="text"
                label={fieldLabels.postalCode}
                autoComplete="postal-code"
                inputMode="numeric"
                defaultValue={address?.zip ?? ""}
                maxLength={20}
                required
              />
            </div>
            <FieldNote>{accountFieldNotes.address.zip}</FieldNote>
          </div>

          <div>
            <div className="relative">
              <label htmlFor={fieldId("zone")} className="sr-only">
                {placeholders.prefecture}
              </label>
              <select
                id={fieldId("zone")}
                name="zoneCode"
                defaultValue={zoneCode}
                required
                className={getContactFloatingSelectClassName()}
                style={getContactFloatingSelectStyle(Boolean(zoneCode))}
              >
                <option value="">{placeholders.prefecture}</option>
                {japanZones.map((zone) => (
                  <option key={zone.zoneCode} value={zone.zoneCode}>
                    {zone.prefecture}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={contactSelectChevronClassName} />
            </div>
            <FieldNote>{accountFieldNotes.address.zone}</FieldNote>
          </div>

          <div>
            <SupportFloatingInput
              id={fieldId("city")}
              name="city"
              type="text"
              label="市区町村"
              autoComplete="address-level2"
              defaultValue={address?.city ?? ""}
              maxLength={100}
              required
            />
            <FieldNote>{accountFieldNotes.address.city}</FieldNote>
          </div>
          <div>
            <SupportFloatingInput
              id={fieldId("address1")}
              name="address1"
              type="text"
              label="番地"
              autoComplete="address-line1"
              defaultValue={address?.address1 ?? ""}
              maxLength={255}
              required
            />
            <FieldNote>{accountFieldNotes.address.address1}</FieldNote>
          </div>
          <div>
            <SupportFloatingInput
              id={fieldId("address2")}
              name="address2"
              type="text"
              label={placeholders.addressLine2}
              autoComplete="address-line2"
              defaultValue={address?.address2 ?? ""}
              maxLength={255}
            />
            <FieldNote>{accountFieldNotes.address.address2}</FieldNote>
          </div>
        </div>
      </ContactField>

      <ContactField
        label="既定の住所"
        requirement="optional"
        note={accountFieldNotes.address.defaultAddress}
        fixedTitleSize
        groupedContentGap
      >
        <label className="inline-flex cursor-pointer items-center gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]">
          <input
            type="checkbox"
            name="defaultAddress"
            defaultChecked={isDefault}
            className={getContactCheckboxClassName()}
          />
          <span className={`font-body-ja text-[var(--foreground)] ${uiText(14)}`}>
            この住所を既定にする
          </span>
        </label>
      </ContactField>
    </AccountUpdateForm>
  );
}

function OrderAddressBlock({
  address,
}: {
  address?: CustomerAddressDetail | null;
}) {
  const name = address ? formatAccountAddressName(address) : null;
  const addressLine = address ? formatAccountAddressLine(address) : null;

  if (!name && !addressLine) {
    return (
      <p className={`mt-3 font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}>
        {NOT_REGISTERED}
      </p>
    );
  }

  return (
    <div className={`mt-3 font-body-ja ${bodyText(15)}`}>
      {name ? <p>{name}</p> : null}
      {addressLine ? <p>{addressLine}</p> : null}
    </div>
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

function hasDiscount(money?: CustomerMoney | null) {
  return Boolean(money && Number(money.amount) > 0);
}

function OrderLineItems({
  lineItems,
}: {
  lineItems: CustomerOrderDetail["lineItems"]["nodes"];
}) {
  if (!lineItems.length) {
  return (
      <p className="mt-3 font-body-ja text-sm text-[var(--color-muted)]">
        購入商品はありません。
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-[calc(24px*var(--gap-scale-y))]">
      {accountOrderLinesByAmount(lineItems).map((lineItem) => {
        const title = accountOrderLineTitle(lineItem);
        const variantTitle = accountOrderLineVariantTitle(lineItem);
        const imageSrc = lineItem.image?.url;
        const discount = hasDiscount(lineItem.totalDiscount)
          ? formatMoney(lineItem.totalDiscount)
          : null;
        const price = formatAccountMoneyAmount(
          lineItem.totalPrice ?? lineItem.price
        );

        return (
          <li
            key={lineItem.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-[26px] gap-y-4"
          >
            {/* 画面幅に合わせて 96px から 280px まで広げる */}
            <div className="relative size-[clamp(96px,calc(280px*var(--layout-scale-x)),280px)] shrink-0 bg-[#eef1f3]">
              {imageSrc ? (
                <SiteImage
                  src={imageSrc}
                  alt={accountOrderLineImageAlt(lineItem)}
                  fill
                  sizes="(min-width: 1025px) 280px, 160px"
                  className="object-cover"
                />
              ) : null}
            </div>

            {/* 文字の大きさは商品一覧のカードに揃える */}
            <div className="mt-[6px] min-w-0">
              <p className={`font-body-ja font-semibold ${uiText(16)}`}>
                {title}
              </p>
              {/* カラーと数量はひとまとまりとして、前後を広めに空ける */}
              <div className="mt-4">
                {variantTitle ? (
                  <p
                    className={`font-ui-en text-[var(--color-muted)] ${uiText(14)}`}
                  >
                    {variantTitle}
                  </p>
                ) : null}
                <p
                  className={`font-body-ja ${uiText(14)} ${
                    variantTitle ? "mt-2" : ""
                  }`}
                >
                  数量 {lineItem.quantity}
                </p>
              </div>
              {discount ? (
                <p
                  className={`mt-1 font-body-ja text-[var(--color-muted)] ${uiText(12)}`}
                >
                  割引 {discount}
                </p>
              ) : null}
              <p className="mt-4 inline-flex items-baseline gap-x-[calc(4px*var(--gap-scale-x))]">
                <span className={`font-ui-en font-semibold ${uiText(14)}`}>
                  {price ?? NOT_REGISTERED}
                </span>
                {price ? (
                  <span className={`font-body-ja ${uiText(11)}`}>税込</span>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function OrderPaymentMethods({
  transactions,
}: {
  transactions: CustomerOrderDetail["transactions"];
}) {
  const methods = accountOrderPaymentMethods(transactions ?? []);

  if (!methods.length) {
    return (
      <p className={`mt-3 font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}>
        {NOT_REGISTERED}
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {methods.map((method) => (
        <li key={method.id} className="flex items-center gap-2">
          {method.iconUrl ? (
            /* 決済アイコンは Shopify 以外のホストから返ることがあり、
               next/image の remotePatterns に列挙できない */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={method.iconUrl}
              alt={method.iconAlt}
              width={28}
              height={18}
              className="h-[18px] w-[28px] object-contain"
            />
          ) : null}
          <p className={`font-body-ja ${bodyText(15)}`}>{method.label}</p>
        </li>
      ))}
    </ul>
  );
}

function OrderAmountRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        emphasized ? "font-semibold" : ""
      }`}
    >
      <dt className={`font-body-ja ${bodyText(15)}`}>{label}</dt>
      <dd className={`text-right font-body-ja ${bodyText(15)}`}>{value}</dd>
    </div>
  );
}

/**
 * 購入商品の隣に置く金額まとめ。
 *
 * 税を独立した行に出すので、各行の金額には税込を付けない。
 * 狭い列に収めるため項目ごとの注釈も出さない。
 */
function OrderAmountSummary({
  order,
  showRefunded,
}: {
  order: CustomerOrderDetail;
  showRefunded: boolean;
}) {
  return (
    <OrderSidebarSection title="サマリー">
      <dl className="mt-3 flex flex-col gap-3">
        <OrderAmountRow label="小計" value={formatAmount(order.subtotal)} />
        <OrderAmountRow label="配送料" value={formatAmount(order.totalShipping)} />
        <OrderAmountRow label="消費税" value={formatAmount(order.totalTax)} />
        {showRefunded ? (
          <OrderAmountRow
            label="返金額"
            value={formatAmount(order.totalRefunded)}
          />
        ) : null}
        <OrderAmountRow
          label="ご請求額"
          value={formatAmount(order.totalPrice)}
          emphasized
        />
      </dl>
    </OrderSidebarSection>
  );
}

function OrderStatusBadge({ children }: { children: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[var(--color-divider)] px-[0.75em] py-[0.3em] font-body-ja ${uiText(12)}`}
    >
      {children}
    </span>
  );
}

/**
 * 注文カード右側の列。幅が狭いのでラベルを値の上に積む。
 *
 * 区切り線はカテゴリの境目だけに引くので、項目どうしは余白で分ける。
 */
function SidebarField({ label, value }: { label: string; value: string }) {
  const isEmpty = value === NOT_REGISTERED;

  return (
    <div>
      <dt className={`font-body-ja text-[var(--color-muted)] ${uiText(12)}`}>
        {label}
      </dt>
      <dd
        className={`mt-1 font-body-ja break-words ${uiText(14)} ${
          isEmpty ? "text-[var(--color-muted)]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/** URL をそのまま出すと狭い列で折り返し続けるので、短い文字でリンクにする */
function SidebarLinkField({
  label,
  url,
  linkText,
}: {
  label: string;
  url?: string | null;
  linkText: string;
}) {
  if (!url) {
    return <SidebarField label={label} value={NOT_REGISTERED} />;
  }

  return (
    <div>
      <dt className={`font-body-ja text-[var(--color-muted)] ${uiText(12)}`}>
        {label}
      </dt>
      <dd className="mt-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex border-b border-current font-body-ja ${uiText(14)}`}
        >
          {linkText}
        </a>
      </dd>
    </div>
  );
}

function SidebarFieldList({ children }: { children: React.ReactNode }) {
  return <dl className="mt-3 flex flex-col gap-3">{children}</dl>;
}

/**
 * 区切り線はカテゴリの境目に引く。
 *
 * 先頭のカテゴリの上には線を出さないので、`first:` で打ち消している。
 */
function OrderSidebarSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--color-divider)] py-[clamp(20px,calc(32px*var(--gap-scale-y)),32px)] first:border-t-0 first:pt-0 last:pb-0">
      {title ? (
        <h4 className={`font-body-ja font-semibold ${uiText(16)}`}>{title}</h4>
      ) : null}
      {children}
    </section>
  );
}

/** 発送ごとの配送状況。社内管理用の項目は出さない */
function OrderFulfillments({
  fulfillments,
}: {
  fulfillments: CustomerOrderDetail["fulfillments"]["nodes"];
}) {
  if (!fulfillments.length) {
    return (
      <p className={`mt-3 font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}>
        {NOT_REGISTERED}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-[calc(24px*var(--gap-scale-y))]">
      {fulfillments.map((fulfillment) => (
        <li key={fulfillment.id}>
          <SidebarFieldList>
            <SidebarField
              label="いまの配送状況"
              value={
                formatAccountShipmentStatus(fulfillment.latestShipmentStatus) ??
                NOT_REGISTERED
              }
            />
            <SidebarField
              label="配達予定日時"
              value={formatDateTime(fulfillment.estimatedDeliveryAt)}
            />
            <SidebarField
              label="発送日時"
              value={formatDateTime(fulfillment.createdAt)}
            />
            {fulfillment.trackingInformation.map((tracking) => (
              <Fragment key={`${tracking.number}-${tracking.url}`}>
                <SidebarField
                  label="配送業者"
                  value={formatText(tracking.company)}
                />
                <SidebarField
                  label="追跡番号"
                  value={formatText(tracking.number)}
                />
                <SidebarLinkField
                  label="追跡ページ"
                  url={tracking.url}
                  linkText="配送状況を追跡する"
                />
              </Fragment>
            ))}
          </SidebarFieldList>

          {fulfillment.events.nodes.length ? (
            <div className="mt-[calc(24px*var(--gap-scale-y))]">
              <h5 className={`font-body-ja font-semibold ${uiText(13)}`}>
                配送履歴
              </h5>
              <SidebarFieldList>
                {fulfillment.events.nodes.map((event) => (
                  <SidebarField
                    key={event.id}
                    label={formatDateTime(event.happenedAt)}
                    value={
                      formatAccountShipmentStatus(event.status) ?? event.status
                    }
                  />
                ))}
              </SidebarFieldList>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function OrderCard({ order }: { order: CustomerOrderDetail }) {
  const optional = accountOrderOptionalFields(order);
  const paymentStatus = formatAccountOrderPaymentStatus(
    order.financialStatus,
    order.transactions
  );
  const shipmentStatus = accountOrderShipmentDisplay(order);
  const orderedAt = formatAccountOrderDateTime(order.processedAt);

  return (
    <li className="rounded-[16px] border border-[var(--color-divider)] bg-white px-[clamp(24px,calc(48px*var(--gap-scale-x)),48px)] py-[clamp(24px,calc(48px*var(--gap-scale-y)),48px)] shadow-[0_0_16px_rgba(0,0,0,0.08)]">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className={`font-body-ja font-semibold ${uiText(16)}`}>
            ご注文番号：{order.name}
          </p>
          {paymentStatus ? <OrderStatusBadge>{paymentStatus}</OrderStatusBadge> : null}
          {shipmentStatus ? (
            <OrderStatusBadge>{shipmentStatus}</OrderStatusBadge>
          ) : null}
        </div>
        {orderedAt ? (
          <p className={`mt-2 font-body-ja ${uiText(14)}`}>
            ご注文日時：{orderedAt}
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-x-[clamp(24px,calc(48px*var(--gap-scale-x)),48px)] gap-y-[calc(32px*var(--gap-scale-y))] min-[1025px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div>
          <h4 className={`font-body-ja font-semibold ${uiText(16)}`}>
            ご購入商品
          </h4>
          <OrderLineItems lineItems={order.lineItems.nodes} />
        </div>

        {/* 1 列に畳んだときは、ご購入商品との境目にも線を引く */}
        <div className="flex flex-col border-t border-[var(--color-divider)] pt-[clamp(20px,calc(32px*var(--gap-scale-y)),32px)] min-[1025px]:border-t-0 min-[1025px]:pt-0">
          <OrderAmountSummary order={order} showRefunded={optional.showRefunded} />

          <OrderSidebarSection>
            <SidebarFieldList>
              {optional.showUpdatedAt ? (
                <SidebarField
                  label="更新日時"
                  value={formatDateTime(order.updatedAt)}
                />
              ) : null}
              {optional.showCancelledAt ? (
                <SidebarField
                  label="キャンセル日時"
                  value={formatDateTime(order.cancelledAt)}
                />
              ) : null}
              {optional.showCancelReason ? (
                <SidebarField
                  label="キャンセル理由"
                  value={formatText(order.cancelReason)}
                />
              ) : null}
              {optional.showEdited ? (
                <SidebarField label="編集済み" value="はい" />
              ) : null}
              {optional.showNote ? (
                <SidebarField label="備考" value={formatText(order.note)} />
              ) : null}
              {optional.showPoNumber ? (
                <SidebarField
                  label="発注番号"
                  value={formatText(order.poNumber)}
                />
              ) : null}
              {optional.showLocationName ? (
                <SidebarField
                  label="出荷元"
                  value={formatText(order.locationName)}
                />
              ) : null}
              <SidebarLinkField
                label="ステータスページ"
                url={order.statusPageUrl}
                linkText="注文状況を見る"
              />
            </SidebarFieldList>
          </OrderSidebarSection>

          <OrderSidebarSection title="発送情報">
            <OrderFulfillments fulfillments={order.fulfillments.nodes} />
          </OrderSidebarSection>

          <OrderSidebarSection title="お届け先">
            <OrderAddressBlock address={order.shippingAddress} />
          </OrderSidebarSection>

          <OrderSidebarSection title="決済方法">
            <OrderPaymentMethods transactions={order.transactions} />
          </OrderSidebarSection>

          <OrderSidebarSection title="ご請求先">
            <OrderAddressBlock address={order.billingAddress} />
            <Link
              href={accountReceiptHref(order.id)}
              className={`mt-3 inline-flex border-b border-current font-body-ja ${uiText(14)}`}
            >
              領収書を見る
            </Link>
          </OrderSidebarSection>
        </div>
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

function ProfilePanel({
  profile,
  shopifyProfileUrl,
}: {
  profile: CustomerAccount;
  shopifyProfileUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-[calc(62px*var(--gap-scale-y))]">
      <MemberSection title={accountMemberCopy.accountDetails.title}>
        <ProfileNameForm profile={profile} />

        <FieldList>
          <Field
            label="メールアドレス"
            value={formatText(profile.emailAddress?.emailAddress)}
            note={accountMemberCopy.accountDetails.email}
          />
          <Field
            label="電話番号"
            value={formatText(profile.phoneNumber?.phoneNumber)}
            note={accountMemberCopy.accountDetails.phone}
          />
        </FieldList>

        {shopifyProfileUrl ? (
          <p className={readOnlyNoteClassName}>
            <ShopifyChangeLink href={shopifyProfileUrl}>
              {accountMemberCopy.accountDetails.emailChange}
            </ShopifyChangeLink>
            {" / "}
            <ShopifyChangeLink href={shopifyProfileUrl}>
              {accountMemberCopy.accountDetails.phoneChange}
            </ShopifyChangeLink>
          </p>
        ) : null}

        <p className={readOnlyNoteClassName}>
          {accountMemberCopy.accountDetails.login}
        </p>
      </MemberSection>

      <MemberSection title={accountMemberCopy.notifications.title}>
        <EmailMarketingForm profile={profile} />
      </MemberSection>

      <MemberSection title={accountMemberCopy.payments.title}>
        <p className={readOnlyNoteClassName}>
          {shopifyProfileUrl
            ? accountMemberCopy.payments.body
            : accountMemberCopy.payments.unavailable}
        </p>
        {shopifyProfileUrl ? (
          <p>
            <ShopifyChangeLink href={shopifyProfileUrl}>
              {accountMemberCopy.payments.link}
            </ShopifyChangeLink>
          </p>
        ) : null}
      </MemberSection>

      <MemberSection title={accountMemberCopy.privacy.title}>
        <p className={readOnlyNoteClassName}>{accountMemberCopy.privacy.body}</p>
        <p>
          <Link
            href={accountMemberCopy.privacy.href}
            className={`${bodyLinkUnderlineClassName} font-body-ja font-semibold text-[var(--foreground)]`}
          >
            {accountMemberCopy.privacy.link}
          </Link>
        </p>
      </MemberSection>
    </div>
  );
}

function AddressesPanel({
  addresses,
  defaultAddressId,
}: {
  addresses: CustomerAddressDetail[];
  defaultAddressId?: string;
}) {
  return (
    <div className="flex flex-col gap-[calc(62px*var(--gap-scale-y))]">
      {addresses.map((address, index) => (
        <div key={address.id}>
          <AccountAddressHeader
            addressId={address.id}
            title={`住所 ${index + 1}${
              address.id === defaultAddressId ? "（既定）" : ""
            }`}
            isDefault={address.id === defaultAddressId}
          />

          <div className="mt-[calc(24px*var(--gap-scale-y))]">
            <AddressForm
              address={address}
              formKey={String(index + 1)}
              isDefault={address.id === defaultAddressId}
            />
          </div>
        </div>
      ))}

      <AccountAddressAdd>
        <AddressForm formKey="new" isDefault={addresses.length === 0} />
      </AccountAddressAdd>
    </div>
  );
}

function OrdersPanel({ orders }: { orders: CustomerAccountSnapshot["orders"] }) {
  return (
    <SectionBody
      section={orders}
      empty="注文履歴はありません。"
      isEmpty={(list) => list.length === 0}
      render={(list) => (
        <ul className="flex flex-col gap-10">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    />
  );
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

  const accountName = snapshot ? formatAccountName(snapshot.profile) : "";
  const accountDate = snapshot
    ? formatAccountDate(snapshot.profile.creationDate)
    : null;
  const addresses = snapshot?.profile.addresses.nodes ?? [];
  const defaultAddressId = snapshot?.profile.defaultAddress?.id;
  const shopifyProfileUrl = await getShopifyCustomerProfileUrl();

  return (
    <main
      data-header-theme="onLight"
      className="pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <Container>
      {snapshot ? (
        <header>
          <h1
            className={`font-body-ja font-semibold text-[var(--foreground)] ${uiText(32)}`}
          >
            {accountName}
          </h1>
          {accountDate ? (
            <p
              className={`mt-[calc(16px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${uiText(15)}`}
            >
              <time dateTime={snapshot.profile.creationDate}>{accountDate}</time>
              から会員
            </p>
          ) : null}
        </header>
      ) : null}

      {snapshotError ? (
        <div className="mt-12">
          <SectionError error={snapshotError} />
          <div className="mt-6">
            <LogoutButton />
          </div>
        </div>
      ) : null}

      {!snapshot && !snapshotError ? (
        <div>
          <p className="font-body-ja text-sm leading-relaxed">
            Shopifyアカウントでログインすると、プロフィールと注文履歴を確認できます。
          </p>
          <p className="mt-6 font-body-ja text-sm text-[var(--color-muted)]">
            アカウント機能はVercel環境への移行後に利用できます。
          </p>
        </div>
      ) : null}

      {snapshot ? (
        <div className="mt-[calc(32px*var(--gap-scale-y))]">
          <div className="flex flex-wrap items-end justify-end gap-4">
            <LogoutButton />
          </div>

          <AccountNotice />

          <AccountTabs
            panels={{
              orders: <OrdersPanel orders={snapshot.orders} />,
              profile: (
                <ProfilePanel
                  profile={snapshot.profile}
                  shopifyProfileUrl={shopifyProfileUrl}
                />
              ),
              addresses: (
                <AddressesPanel
                  addresses={addresses}
                  defaultAddressId={defaultAddressId}
                />
              ),
            }}
          />
        </div>
      ) : null}
      </Container>
    </main>
  );
}
