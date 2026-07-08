import { japanesePrefectures } from "@/data/contact";

export type PostalCodeLookupResult = {
  prefecture: string;
  addressLine1: string;
};

type ZipcloudResponse = {
  status: number;
  message: string | null;
  results: Array<{
    address1: string;
    address2: string;
    address3: string;
  }> | null;
};

const ZIPCLOUD_API_URL = "https://zipcloud.ibsnet.co.jp/api/search";
const DEBUG_POSTAL_LOOKUP = process.env.NODE_ENV === "development";

function debugPostalLookup(message: string, detail?: unknown) {
  if (!DEBUG_POSTAL_LOOKUP) {
    return;
  }

  if (detail === undefined) {
    console.log(`[contact-postal] ${message}`);
    return;
  }

  console.log(`[contact-postal] ${message}`, detail);
}

function isJapanesePrefecture(value: string): value is (typeof japanesePrefectures)[number] {
  return japanesePrefectures.includes(value as (typeof japanesePrefectures)[number]);
}

export async function lookupAddressByPostalCode(
  postalCode: string
): Promise<PostalCodeLookupResult | null> {
  const normalized = postalCode.replace(/\D/g, "");

  if (normalized.length !== 7) {
    debugPostalLookup("skipped: postal code is not 7 digits", normalized);
    return null;
  }

  try {
    const response = await fetch(`${ZIPCLOUD_API_URL}?zipcode=${normalized}`);

    if (!response.ok) {
      debugPostalLookup("zipcloud HTTP error", response.status);
      return null;
    }

    const data = (await response.json()) as ZipcloudResponse;

    if (data.status !== 200 || !data.results?.length) {
      debugPostalLookup("zipcloud returned no results", {
        status: data.status,
        message: data.message,
      });
      return null;
    }

    const { address1, address2, address3 } = data.results[0];

    if (!isJapanesePrefecture(address1)) {
      debugPostalLookup("prefecture not recognized", address1);
      return null;
    }

    const addressLine1 = `${address2}${address3}`.trim();

    if (!addressLine1) {
      debugPostalLookup("address line is empty", data.results[0]);
      return null;
    }

    const result = {
      prefecture: address1,
      addressLine1,
    };

    debugPostalLookup("lookup success", result);
    return result;
  } catch (error) {
    debugPostalLookup("lookup failed", error);
    return null;
  }
}
