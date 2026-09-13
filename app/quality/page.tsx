import { permanentRedirect } from "next/navigation";

/**
 * 旧 URL（/quality）の救済。next.config.ts の redirects と重複しているように
 * 見えるが、あちらは静的エクスポート時に無効になるためこのページが必要。
 */
export default function QualityRedirectPage() {
  permanentRedirect("/labo");
}
