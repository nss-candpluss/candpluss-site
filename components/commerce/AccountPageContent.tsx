import Link from "next/link";
import { redirect } from "next/navigation";

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
  NEW_ACCOUNT_ADDRESS,
  accountAddressAddHref,
  accountAddressDeleteHref,
  accountAddressDeleteIdFromSearch,
  accountAddressIdFromSearch,
  accountOrderLineImageAlt,
  accountOrderLineTitle,
  accountOrderLineVariantTitle,
  accountOrderOptionalFields,
  accountOrderPaymentMethods,
  accountOrderShipmentDisplay,
  accountOrderSubtotalWithTax,
  accountPageNotice,
  accountPageTabHref,
  formatAccountAddressLine,
  formatAccountAddressName,
  formatAccountDate,
  formatAccountMoney,
  formatAccountOrderPaymentStatus,
  formatAccountOrderDateTime,
  formatAccountFulfillmentUnitStatus,
  formatAccountName,
  formatAccountShipmentStatus,
  queryStringFromSearchParams,
  resolveAccountPageTabId,
} from "@/lib/commerce/account-page";
import {
  fetchCustomerAccountSnapshot,
  getShopifyCustomerProfileUrl,
  isEmailMarketingSubscribed,
  type CustomerAccount,
  type CustomerAddressDetail,
  type CustomerMoney,
  type CustomerOrderDetail,
  type CustomerSection,
} from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";
import {
  bodyLinkUnderlineClassName,
  bodyText,
  cartLineTitleClassName,
  sectionTitle62ClassName,
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

const readOnlyHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;
const readOnlyNoteClassName = `mt-[calc(8px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${uiText(13)}`;

const addressActionClassName =
  "cursor-pointer border-b border-current font-body-ja text-sm text-[var(--foreground)]";

/** 住所 1 件に対する操作。フォームなので JavaScript なしで動く */
function AddressIntentButton({
  addressId,
  intent,
  children,
}: {
  addressId: string;
  intent: "default" | "delete";
  children: string;
}) {
  return (
    <form action="/api/shopify/customer/address" method="post">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="addressId" value={addressId} />
      <button type="submit" className={addressActionClassName}>
        {children}
      </button>
    </form>
  );
}

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

const fieldNoteClassName = `mt-1 font-body-ja text-[var(--color-muted)] ${uiText(12)}`;

function FieldNote({ children }: { children: string }) {
  return <p className={fieldNoteClassName}>{children}</p>;
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

/** 追跡は開けないと意味がないので、URL の項目だけリンクにする */
function LinkField({
  label,
  url,
  note,
}: {
  label: string;
  url?: string | null;
  note: string;
}) {
  if (!url) {
    return <Field label={label} value={NOT_REGISTERED} note={note} />;
  }

  return (
    <div className="grid gap-1 border-b border-[#eee] py-3 min-[640px]:grid-cols-[200px_minmax(0,1fr)] min-[640px]:gap-4">
      <dt className="font-body-ja text-xs text-[var(--color-muted)]">
        {label}
        <FieldNote>{note}</FieldNote>
      </dt>
      <dd className="font-body-ja text-sm break-all">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {url}
        </a>
      </dd>
    </div>
  );
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
    <ul className="mt-4 divide-y divide-[#ddd] border-y border-[#ddd]">
      {lineItems.map((lineItem) => {
        const title = accountOrderLineTitle(lineItem);
        const variantTitle = accountOrderLineVariantTitle(lineItem);
        const imageSrc = lineItem.image?.url;
        const discount = hasDiscount(lineItem.totalDiscount)
          ? formatMoney(lineItem.totalDiscount)
          : null;

        return (
          <li
            key={lineItem.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 py-4 min-[768px]:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <div className="relative size-[96px] shrink-0 bg-[#eef1f3]">
              {imageSrc ? (
                <SiteImage
                  src={imageSrc}
                  alt={accountOrderLineImageAlt(lineItem)}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <p
                className={`font-body-ja font-semibold ${cartLineTitleClassName}`}
              >
                {title}
              </p>
              {variantTitle ? (
                <p
                  className={`mt-2 font-ui-en text-[var(--color-muted)] ${uiText(14)}`}
                >
                  {variantTitle}
                </p>
              ) : null}
              <p className={`mt-2 font-body-ja ${uiText(14)}`}>
                数量 {lineItem.quantity}
              </p>
              {discount ? (
                <p
                  className={`mt-1 font-body-ja text-[var(--color-muted)] ${uiText(12)}`}
                >
                  割引 {discount}
                </p>
              ) : null}
            </div>

            <p className="col-start-2 font-ui-en text-sm font-semibold min-[768px]:col-start-auto">
              {formatMoney(lineItem.totalPrice ?? lineItem.price)}
            </p>
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

function OrderStatusBadge({ children }: { children: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[var(--color-divider)] px-[0.75em] py-[0.3em] font-body-ja ${uiText(12)}`}
    >
      {children}
    </span>
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

      <div className="mt-6">
        <h4 className="font-body-ja text-sm font-semibold">購入商品</h4>
        <FieldNote>{accountFieldNotes.order.lineItems}</FieldNote>
        <OrderLineItems lineItems={order.lineItems.nodes} />
      </div>

      <div className="mt-6">
        <FieldList>
        {optional.showUpdatedAt ? (
        <Field
            label="更新日時"
            value={formatDateTime(order.updatedAt)}
            note={accountFieldNotes.order.updatedAt}
          />
        ) : null}
        {optional.showCancelledAt ? (
        <Field
          label="キャンセル日時"
          value={formatDateTime(order.cancelledAt)}
            note={accountFieldNotes.order.cancelledAt}
        />
        ) : null}
        {optional.showCancelReason ? (
        <Field
          label="キャンセル理由"
          value={formatText(order.cancelReason)}
            note={accountFieldNotes.order.cancelReason}
          />
        ) : null}
        {optional.showEdited ? (
          <Field label="編集済み" value="はい" note={accountFieldNotes.order.edited} />
        ) : null}
        {optional.showNote ? (
          <Field label="備考" value={formatText(order.note)} note={accountFieldNotes.order.note} />
        ) : null}
        {optional.showPoNumber ? (
        <Field
            label="発注番号"
            value={formatText(order.poNumber)}
            note={accountFieldNotes.order.poNumber}
          />
        ) : null}
        {optional.showLocationName ? (
          <Field
            label="出荷元"
            value={formatText(order.locationName)}
            note={accountFieldNotes.order.locationName}
          />
        ) : null}
        <Field
          label="商品の小計"
          value={formatMoney(accountOrderSubtotalWithTax(order))}
          note={accountFieldNotes.order.subtotal}
        />
        <Field label="配送料" value={formatMoney(order.totalShipping)} note={accountFieldNotes.order.shipping} />
        {optional.showRefunded ? (
          <Field
            label="返金額"
            value={formatMoney(order.totalRefunded)}
            note={accountFieldNotes.order.refunded}
          />
        ) : null}
        <Field label="ご請求額" value={formatMoney(order.totalPrice)} note={accountFieldNotes.order.total} />
        <LinkField label="ステータスページ" url={order.statusPageUrl} note={accountFieldNotes.order.statusPage} />
        </FieldList>
      </div>

      <div className="mt-8">
        <h4 className="font-body-ja text-sm font-semibold">発送情報</h4>
        <FieldNote>{accountFieldNotes.order.fulfillments}</FieldNote>
        {order.fulfillments.nodes.length ? (
          <ul className="mt-3 flex flex-col gap-6">
            {order.fulfillments.nodes.map((fulfillment) => (
              <li key={fulfillment.id}>
                <FieldList>
                  <Field label="発送 ID" value={fulfillment.id} note={accountFieldNotes.order.fulfillmentId} />
                  <Field
                    label="発送状態"
                    value={formatAccountFulfillmentUnitStatus(fulfillment.status) ?? NOT_REGISTERED}
                    note={accountFieldNotes.order.shipmentStatus}
                  />
                  <Field
                    label="いまの配送状況"
                    value={formatAccountShipmentStatus(fulfillment.latestShipmentStatus) ?? NOT_REGISTERED}
                    note={accountFieldNotes.order.latestShipmentStatus}
                  />
                  <Field
                    label="配達予定日時"
                    value={formatDateTime(fulfillment.estimatedDeliveryAt)}
                    note={accountFieldNotes.order.estimatedDeliveryAt}
                  />
                  <Field
                    label="発送日時"
                    value={formatDateTime(fulfillment.createdAt)}
                    note={accountFieldNotes.order.fulfillmentCreatedAt}
                  />
                  <Field
                    label="更新日時"
                    value={formatDateTime(fulfillment.updatedAt)}
                    note={accountFieldNotes.order.fulfillmentUpdatedAt}
                  />
                  <Field
                    label="店頭受け取り済み"
                    value={formatBoolean(fulfillment.isPickedUp)}
                    note={accountFieldNotes.order.isPickedUp}
                  />
                </FieldList>

                <div className="mt-6">
                  <h5 className="font-body-ja text-xs font-semibold">追跡情報</h5>
                  <FieldNote>{accountFieldNotes.order.tracking}</FieldNote>
                  {fulfillment.trackingInformation.length ? (
                    <div className="mt-2 flex flex-col gap-4">
                      {fulfillment.trackingInformation.map((tracking) => (
                        <FieldList key={`${tracking.number}-${tracking.url}`}>
                          <Field
                            label="配送業者"
                            value={formatText(tracking.company)}
                            note={accountFieldNotes.order.trackingCompany}
                          />
                          <Field
                            label="追跡番号"
                            value={formatText(tracking.number)}
                            note={accountFieldNotes.order.trackingNumber}
                          />
                          <LinkField
                            label="追跡 URL"
                            url={tracking.url}
                            note={accountFieldNotes.order.trackingUrl}
                          />
                        </FieldList>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 font-body-ja text-sm text-[var(--color-muted)]">
                      {NOT_REGISTERED}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <h5 className="font-body-ja text-xs font-semibold">配送履歴</h5>
                  <FieldNote>{accountFieldNotes.order.events}</FieldNote>
                  {fulfillment.events.nodes.length ? (
                    <FieldList>
                      {fulfillment.events.nodes.map((event) => (
                        <Field
                          key={event.id}
                          label={formatDateTime(event.happenedAt)}
                          value={formatAccountShipmentStatus(event.status) ?? event.status}
                          note={accountFieldNotes.order.event}
                        />
                      ))}
                    </FieldList>
                  ) : (
                    <p className="mt-2 font-body-ja text-sm text-[var(--color-muted)]">
                      {NOT_REGISTERED}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-body-ja text-sm text-[var(--color-muted)]">
            {NOT_REGISTERED}
          </p>
        )}
      </div>

      <div className="mt-8">
        <h4 className="font-body-ja text-sm font-semibold">お届け先</h4>
        <OrderAddressBlock address={order.shippingAddress} />
      </div>

      <div className="mt-8">
        <h4 className="font-body-ja text-sm font-semibold">決済方法</h4>
        <OrderPaymentMethods transactions={order.transactions} />
      </div>

      <div className="mt-8">
        <h4 className="font-body-ja text-sm font-semibold">ご請求先</h4>
        <OrderAddressBlock address={order.billingAddress} />
        <Link
          href={accountReceiptHref(order.id)}
          className="mt-3 inline-flex border-b border-current font-body-ja text-sm"
        >
          領収書を見る
        </Link>
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
export async function AccountPageContent({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
} = {}) {
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
  const search = queryStringFromSearchParams(searchParams);
  const activeTabId = resolveAccountPageTabId({ search });
  const notice = accountPageNotice(search);
  const addresses = snapshot?.profile.addresses.nodes ?? [];
  const defaultAddressId = snapshot?.profile.defaultAddress?.id;
  const deleteTargetId = accountAddressDeleteIdFromSearch(search);
  const isNewAddress =
    accountAddressIdFromSearch(search) === NEW_ACCOUNT_ADDRESS;
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
            className={`font-body-ja font-semibold text-[var(--foreground)] ${sectionTitle62ClassName}`}
          >
            {accountName}
      </h1>
          {accountDate ? (
            <time
              dateTime={snapshot.profile.creationDate}
              className={`mt-[calc(16px*var(--gap-scale-y))] block font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
            >
              {accountDate}
            </time>
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

          {notice ? (
            <p
              role="status"
              className={`mt-[calc(24px*var(--gap-scale-y))] font-body-ja text-sm ${
                notice.tone === "error"
                  ? "text-[#9b1b30]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          <AccountTabs activeTabId={activeTabId} search={search}>
              {activeTabId === "profile" ? (
                <div className="flex flex-col gap-[calc(62px*var(--gap-scale-y))]">
                  <MemberSection title={accountMemberCopy.accountDetails.title}>
                    <ProfileNameForm profile={snapshot.profile} />

            <FieldList>
              <Field
                label="メールアドレス"
                        value={formatText(
                          snapshot.profile.emailAddress?.emailAddress
                        )}
                        note={accountMemberCopy.accountDetails.email}
              />
              <Field
                label="電話番号"
                        value={formatText(
                          snapshot.profile.phoneNumber?.phoneNumber
                        )}
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
                    <EmailMarketingForm profile={snapshot.profile} />
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
                    <p className={readOnlyNoteClassName}>
                      {accountMemberCopy.privacy.body}
                    </p>
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
              ) : null}
              {activeTabId === "addresses" ? (
                <div className="flex flex-col gap-[calc(62px*var(--gap-scale-y))]">
                  {addresses.map((address, index) => (
                    <div key={address.id}>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <p className="font-body-ja text-sm font-bold">
                          住所 {index + 1}
                          {address.id === defaultAddressId ? "（既定）" : ""}
                        </p>
                        {address.id === defaultAddressId ? null : (
                          <div>
                            <AddressIntentButton
                              addressId={address.id}
                              intent="default"
                            >
                              既定にする
                            </AddressIntentButton>
                            <FieldNote>{accountFieldNotes.address.setDefault}</FieldNote>
                          </div>
                        )}
                        {deleteTargetId === address.id ? null : (
                          <div>
                            <Link
                              href={accountAddressDeleteHref(address.id)}
                              scroll={false}
                              prefetch={false}
                              className={addressActionClassName}
                            >
                              削除する
                            </Link>
                            <FieldNote>{accountFieldNotes.address.remove}</FieldNote>
                          </div>
                        )}
                      </div>

                      {deleteTargetId === address.id ? (
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border border-[#ddd] p-4">
                          <p className="font-body-ja text-sm">
                            この住所を削除しますか？
                          </p>
                          <AddressIntentButton
                            addressId={address.id}
                            intent="delete"
                          >
                            削除する
                          </AddressIntentButton>
                          <Link
                            href={accountPageTabHref("addresses")}
                            scroll={false}
                            prefetch={false}
                            className={addressActionClassName}
                          >
                            やめる
                          </Link>
                        </div>
                      ) : null}

                      <div className="mt-[calc(24px*var(--gap-scale-y))]">
                        <AddressForm
                      address={address}
                          formKey={String(index + 1)}
                          isDefault={address.id === defaultAddressId}
                        />
                      </div>
                    </div>
                  ))}

                  {isNewAddress ? (
                    <div>
                      <p className="font-body-ja text-sm font-bold">住所を追加</p>
                      <div className="mt-[calc(24px*var(--gap-scale-y))]">
                        <AddressForm
                          formKey="new"
                          isDefault={addresses.length === 0}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Link
                        href={accountAddressAddHref()}
                        scroll={false}
                        prefetch={false}
                        className={addressActionClassName}
                      >
                        住所を追加する
                      </Link>
                      <FieldNote>{accountFieldNotes.address.add}</FieldNote>
                    </div>
                  )}
                </div>
              ) : null}
              {activeTabId === "orders" ? (
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
              ) : null}
              {activeTabId === "related-records" ? (
            <SectionBody
              section={snapshot.relatedRecordCounts}
              empty="関連レコードはありません。"
              isEmpty={() => false}
              render={(counts) => (
                <FieldList>
                  <Field
                    label="法人担当者 (B2B)"
                    value={`${counts.companyContacts} 件`}
                          note={accountFieldNotes.related.companyContacts}
                  />
                  <Field
                    label="定期購入契約"
                    value={`${counts.subscriptionContracts} 件`}
                          note={accountFieldNotes.related.subscriptionContracts}
                  />
                  <Field
                    label="下書き注文"
                    value={`${counts.draftOrders} 件`}
                          note={accountFieldNotes.related.draftOrders}
                  />
                </FieldList>
              )}
            />
              ) : null}
          </AccountTabs>
        </div>
      ) : null}
      </Container>
    </main>
  );
}
