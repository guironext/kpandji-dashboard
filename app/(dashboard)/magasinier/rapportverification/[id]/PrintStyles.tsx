"use client";

import { useEffect } from "react";

const STYLE_ID = "rapport-verification-print-styles";

const PRINT_CSS = `
@media print {
  body * {
    visibility: hidden;
  }
  #printable-area,
  #printable-area * {
    visibility: visible;
  }
  #printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .print-hide {
    display: none !important;
  }
  body {
    background: #fff !important;
  }
  .bg-gradient-to-r,
  .bg-gradient-to-br,
  .bg-white {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  /* Pagination helpers */
  .page-break {
    break-before: page;
    page-break-before: always;
  }
  .avoid-break {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead {
    display: table-header-group;
  }
  tfoot {
    display: table-footer-group;
  }
  tr,
  img,
  svg,
  blockquote,
  pre,
  code {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 1cm;
  }
}
`;

const PrintStyles = () => {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
};

export default PrintStyles;
