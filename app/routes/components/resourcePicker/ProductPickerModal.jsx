import { Button } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function ProductPickerButton({
  onSelect,
  singleSelect = false,
  isVariantSelectorOff,
  initialSelected = [],
}) {
  const shopify = useAppBridge();

  // extract id and variant of the product for preselected products when picekr is opened
  const buildSelectionIds = (products = []) =>
    products.map((product) => ({
      id: product.id,
      ...(product.variants?.length
        ? {
            variants: product.variants.map((v) => ({
              id: v.id,
            })),
          }
        : {}),
    }));

  const openPicker = async () => {
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: !singleSelect,
      filter: {
        archived: false,
        variants: !isVariantSelectorOff,
      },
      // ✅ THIS is the magic
      selectionIds: buildSelectionIds(initialSelected),
    });

    const selected = result?.selectedResources || result?.selection;
    if (!selected?.length) return;

    const restricted = selected.map((product) => ({
      id: product.id,
      title: product.title,
      productHandle: product.handle,

      // product-level info
      productTitle: product.title,
      totalVariants: product.totalVariants,

      // first variant as primary (for quick access / preview)
      price: product.variants?.[0]?.price,
      compareAtPrice: product.variants?.[0]?.compareAtPrice ?? null,

      image: product.images?.[0]
        ? {
            url: product.images[0].originalSrc,
            altText: product.images[0].altText || "",
          }
        : null,

      // ✅ ALL variants
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? null,

        image: variant.image
          ? {
              url: variant.image.originalSrc,
              altText: variant.image.altText || "",
            }
          : null,
      })),
    }));

    onSelect(singleSelect ? restricted.slice(0, 1) : restricted);
  };

  return (
    <Button onClick={openPicker} variant="primary">
      {singleSelect ? "Select product" : "Select products"}
    </Button>
  );
}
