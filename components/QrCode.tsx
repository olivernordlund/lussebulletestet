"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR code pointing to the start page of this site. */
export default function QrCode({ path = "/" }: { path?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [host, setHost] = useState("");

  useEffect(() => {
    const url = new URL(path, window.location.origin).toString();
    setHost(window.location.host);
    QRCode.toString(url, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#161514", light: "#ffffff" },
    }).then(setSvg);
  }, [path]);

  return (
    <div className="qr">
      <div className="qr__code" dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
      {host && <p className="qr__url">{host}</p>}
    </div>
  );
}
