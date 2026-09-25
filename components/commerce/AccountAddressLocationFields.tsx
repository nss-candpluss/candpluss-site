"use client";

import { useState } from "react";

import { contactFormCopy } from "@/data/contact";
import {
  japanZoneCodeFromPrefecture,
  japanZones,
} from "@/lib/commerce/japan-zone-code";
import { lookupAddressByPostalCode } from "@/lib/contact/postal-code";
import {
  contactSelectChevronClassName,
  getContactFloatingSelectClassName,
  getContactFloatingSelectStyle,
} from "@/sections/contact/contactStyles";
import { SupportFloatingInput } from "@/sections/support/SupportFloatingField";

/**
 * 郵便番号・都道府県・市区町村。
 *
 * 郵便番号が 7 桁そろったら、都道府県と市区町村を自動で入れる。
 * お問い合わせフォームと同じ引き方（`lookupAddressByPostalCode`）を使う。
 *
 * 自動で入れたあとも書き換えられるよう、値は React 側で持つ。
 * 番地から下は郵便番号では決まらないので、この組には入れない。
 */
export function AccountAddressLocationFields({
  formKey,
  defaultZip,
  defaultZoneCode,
  defaultCity,
}: {
  /** 同じ画面に住所が何件も並ぶので、入力欄の id を分ける */
  formKey: string;
  defaultZip: string;
  defaultZoneCode: string;
  defaultCity: string;
}) {
  const { fieldLabels, placeholders } = contactFormCopy;
  const fieldId = (name: string) => `account-address-${formKey}-${name}`;
  const [zip, setZip] = useState(defaultZip);
  const [zoneCode, setZoneCode] = useState(defaultZoneCode);
  const [city, setCity] = useState(defaultCity);

  async function applyPostalCode(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 7) {
      return;
    }

    const found = await lookupAddressByPostalCode(digits);
    if (!found) {
      return;
    }

    /*
      引けた都道府県は名前なので、Shopify に送るコードに直す。
      引けなかった分は、いま入っているものを残す。
    */
    setZoneCode(
      (current) => japanZoneCodeFromPrefecture(found.prefecture) || current
    );
    setCity((current) => found.addressLine1 || current);
  }

  return (
    <>
      <div className="max-w-[240px]">
        <SupportFloatingInput
          id={fieldId("zip")}
          name="zip"
          type="text"
          label={`${fieldLabels.postalCode} *`}
          autoComplete="postal-code"
          inputMode="numeric"
          value={zip}
          maxLength={20}
          required
          /*
            引くのは打っている最中だけにする。
            郵便番号を触らずに都道府県だけ書き換わると、
            保存ボタンを出す判定（入力の変化）が動かない。
          */
          onChange={(event) => {
            setZip(event.target.value);
            void applyPostalCode(event.target.value);
          }}
        />
      </div>

      {/* 都道府県名は短いので、郵便番号と同じ幅で足りる */}
      <div className="relative max-w-[240px]">
        <label htmlFor={fieldId("zone")} className="sr-only">
          {`${placeholders.prefecture} *`}
        </label>
        <select
          id={fieldId("zone")}
          name="zoneCode"
          value={zoneCode}
          required
          onChange={(event) => setZoneCode(event.target.value)}
          className={getContactFloatingSelectClassName()}
          style={getContactFloatingSelectStyle(Boolean(zoneCode))}
        >
          <option value="">{`${placeholders.prefecture} *`}</option>
          {japanZones.map((zone) => (
            <option key={zone.zoneCode} value={zone.zoneCode}>
              {zone.prefecture}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className={contactSelectChevronClassName} />
      </div>

      <div className="max-w-[320px]">
        <SupportFloatingInput
          id={fieldId("city")}
          name="city"
          type="text"
          label="市区町村 *"
          autoComplete="address-level2"
          value={city}
          maxLength={100}
          required
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
    </>
  );
}
