/* --------------------------------------------------------------
   PREVIEW MODE DETECTOR + FIXES
-------------------------------------------------------------- */
(function(){
  const isPreview =
    window.location.href.includes("/preview") ||
    window.Shopify?.designMode === true ||
    window.__OPTIMAIO_ADMIN_PREVIEW__ === true;

  if (!isPreview) return; // storefront -> full script continues normally

  console.warn("⚡ Optimaio: Admin Preview Mode Enabled");

  // 1) Mock /cart.js
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    if (args[0] === "/cart.js") {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [
              {
                title: "Preview Product",
                quantity: 1,
                final_line_price: 25900,
                original_line_price: 25900,
                image:
                  "https://cdn.shopify.com/s/files/preview.png",
                product_title: "Preview Product",
                variant_title: "",
                key: "preview-key",
              },
            ],
            total_price: 25900,
            original_total_price: 25900,
            item_count: 1,
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (args[0].includes("/recommendations/products.json")) {
      return Promise.resolve(
        new Response(JSON.stringify({ products: [] }), {
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    return originalFetch(...args);
  };

  // 2) Prevent auto-close in preview
  window.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#optimaio-cart-drawer")) return;
      e.stopPropagation();
    },
    true
  );

  // 3) Force drawer to open automatically
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      const drawer = document.getElementById("optimaio-cart-drawer");
      if (drawer) drawer.classList.add("open");

      document.dispatchEvent(new Event("optimaio:cart:refresh"));
    }, 400);
  });

  // 4) Flag to other scripts
  window.__OPTIMAIO_ADMIN_PREVIEW__ = true;
})();
