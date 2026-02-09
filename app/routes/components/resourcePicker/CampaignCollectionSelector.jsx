import { Button } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function CampaignCollectionSelector({
  label = "Select collections",
  initialSelected = [],
  singleSelect = false,
  onSelect,
}) {
  const shopify = useAppBridge();

  /**
   * Build selectionIds for preselected collections
   */
  const buildSelectionIds = (collections = []) =>
    collections
      .filter((c) => c?.id)
      .map((c) => ({
        id: c.id,
      }));

  const openPicker = async () => {
    const selectionIds = buildSelectionIds(initialSelected);

    const result = await shopify.resourcePicker({
      type: "collection",
      multiple: !singleSelect,
      selectionIds: selectionIds.length ? selectionIds : undefined,
    });

    if (!result) return;

    const selected = result.selectedResources || result.selection;
    if (!selected?.length) return;

    /**
     * Normalize to your required format
     */
    const normalized = selected.map((collection) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      image: collection.image
        ? {
            url: collection.image.originalSrc,
            alt: collection.image.altText || "",
          }
        : {
            url: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection.png",
            alt: "No image available",
          },
    }));

    onSelect(singleSelect ? normalized.slice(0, 1) : normalized);
  };

  return (
    <Button variant="primary" size="slim" onClick={openPicker}>
      {label}
    </Button>
  );
}
