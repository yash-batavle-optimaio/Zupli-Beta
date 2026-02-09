import { Button, Icon } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PlusIcon } from "@shopify/polaris-icons";
export default function CampaignProductSelector({
  onSelect,
  singleSelect = false,
  initialSelected = [],
  label,
  isTableButton = false,
}) {
  const shopify = useAppBridge();

  /**
   * Build selectionIds so picker opens with preselected variants
   */
  const buildSelectionIds = (variants = []) => {
    const byProduct = new Map();

    variants.forEach((v) => {
      if (!v.productId) return; // ⛔ guard

      if (!byProduct.has(v.productId)) {
        byProduct.set(v.productId, {
          id: v.productId,
          variants: [],
        });
      }

      byProduct.get(v.productId).variants.push({
        id: v.id,
      });
    });

    return Array.from(byProduct.values());
  };

  const openPicker = async () => {
    const selectionIds = buildSelectionIds(initialSelected);

    const result = await shopify.resourcePicker({
      type: "product",
      multiple: !singleSelect,
      filter: {
        archived: false,
        variants: true,
      },
      selectionIds: selectionIds.length ? selectionIds : undefined,
    });

    if (!result) return;

    const selected = result.selectedResources || result.selection;
    if (!selected?.length) return;

    const normalized = selected.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        campareAtPrice: variant.compareAtPrice,
        availableForSale: variant.availableForSale ?? true,
        image: variant.image
          ? {
              url: variant.image.originalSrc,
              altText: variant.image.altText || "",
            }
          : product.images?.[0]
            ? {
                url: product.images[0].originalSrc,
                altText: product.images[0].altText || "",
              }
            : null,

        productHandle: product.handle,
        productTitle: product.title,
        productId: product.id, // ✅ REQUIRED
      })),
    );

    onSelect(singleSelect ? normalized.slice(0, 1) : normalized);
  };

  return isTableButton ? (
    <Button
      variant="tertiary"
      size="slim"
      fullWidth
      onClick={openPicker}
      icon={<Icon source={PlusIcon} />}
    >
      {label || (singleSelect ? "Select product" : "Select products")}
    </Button>
  ) : (
    <Button variant="primary" onClick={openPicker}>
      {label || (singleSelect ? "Select product" : "Select products")}
    </Button>
  );
}
