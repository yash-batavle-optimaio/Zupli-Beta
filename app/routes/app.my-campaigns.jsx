import {
  IndexTable,
  Text,
  Badge,
  Page,
  Spinner,
  Button,
  ButtonGroup,
  Card,
  Box,
  Popover,
  ActionList,
  InlineStack,
  Tooltip,
  Select,
  TextField,
  BlockStack,
  Layout,
  Divider,
  Collapsible,
  Banner,
  InlineGrid,
  DataTable,
  Thumbnail,
} from "@shopify/polaris";
import { useEffect, useState, useCallback, useRef } from "react";
import { authenticate } from "../shopify.server";
import {
  DeleteIcon,
  PlusIcon,
  CaretDownIcon,
  CaretUpIcon,
  DiscountIcon,
  CalendarIcon,
  BlogIcon,
  ArrowLeftIcon,
} from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
import ProductPickerModal from "./components/ProductPickerModal";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import CollectionPickerModal from "./components/CollectionPickerModal";
import Colabssiblecom from "./components/Colabssiblecom";
import ActiveDatesPicker from "./components/ActiveDatesPicker";
import ContentEditor from "./components/ContentEditor";
import { useSearchParams } from "@remix-run/react";
import {
  getInitialContentByGoal,
  getInitialContentForBxgy,
} from "./utils/content/initialGoalContent";
import CampaignGoal from "./components/campaignEdit/CampaignGoal";
import TieredGoalCard from "./components/campaignEdit/TieredGoalCard";
import { useNavigate } from "@remix-run/react";
import CampaignProductSelector from "./components/resourcePicker/CampaignProductSelector";
import CampaignCollectionSelector from "./components/resourcePicker/CampaignCollectionSelector";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function CampaignIndexTable() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalRefs = useRef({});
  const lastAddedGoalId = useRef(null);

  // "cart" | "quantity"
  const [selected, setSelected] = useState("cart");

  // goals array for tiered milestones
  const [goals, setGoals] = useState([]);

  // popover for "Add a new goal"
  const [active, setActive] = useState(false);

  // Gift product picker modal
  const [pickerOpen, setPickerOpen] = useState(false);

  // which goal is currently picking products
  const [currentGoal, setCurrentGoal] = useState(null);

  // BXGY picker mode: "buy" or "get"
  const [pickerType, setPickerType] = useState("get");

  const toggleActive = useCallback(() => setActive((prev) => !prev), []);

  const [status, setStatus] = useState("draft");
  const [name, setName] = useState("Cart Goal 6");

  // SaveBar state
  const [saveBarOpen, setSaveBarOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const shopify = useAppBridge();

  const [content, setContent] = useState({ title: "", subtitle: "" });

  const [activeContentGoal, setActiveContentGoal] = useState(null);

  // Inside CampaignIndexTable component
  const [activeDates, setActiveDates] = useState({
    start: { date: null, time: null },
    end: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const [tieredErrors, setTieredErrors] = useState({}); // { [goalId]: { target, products, giftQty, discountValue, discountType } }
  const [tieredGeneralErrors, setTieredGeneralErrors] = useState([]); // e.g., ["Add at least one goal"]

  const [bxgyErrors, setBxgyErrors] = useState({});

  const [nameError, setNameError] = useState("");

  const [defaultCurrency, setDefaultCurrency] = useState("Amt");

  useEffect(() => {
    async function fetchDefaultCurrency() {
      try {
        const res = await fetch("/api/get-shopDefaultCurrency");
        const data = await res.json();
        console.log("💱 Shop currency:", data);

        if (data.ok && data.currencyCode) {
          setDefaultCurrency(data.currencyCode);
        }
      } catch (err) {
        console.error("⚠️ Failed to load currency:", err);
      }
    }

    fetchDefaultCurrency();
  }, []);

  function validateTiered(goals = [], trackType = "cart") {
    const perGoal = {}; // { [id]: { field: "error" } }
    const general = [];

    if (!goals.length) {
      general.push("Add at least one goal.");
      return { perGoal, general };
    }

    // target checks (required, positive, integer for quantity)
    const targets = [];
    goals.forEach((g) => {
      const errs = {};
      const t = Number(g.target);

      if (!Number.isFinite(t) || t <= 0) {
        errs.target = "Target is required and must be greater than 0";
      } else {
        // Save for global ascending check
        targets.push({ id: g.id, value: t });
        if (trackType === "quantity" && !Number.isInteger(t)) {
          errs.target = "Target must be a whole number (quantity)";
        }
      }

      // per-type checks
      if (g.type === "free_product") {
        if (!Array.isArray(g.products) || g.products.length === 0) {
          errs.products = "Select at least one gift product";
        }
        if (!g.giftQty || g.giftQty <= 0) {
          errs.giftQty = "Gift quantity must be at least 1";
        }
      }

      // free_shipping has no extra fields

      if (Object.keys(errs).length) perGoal[g.id] = errs;
    });

    // 📈 Global ascending check
    if (targets.length > 1) {
      // Sort by user-defined order (not automatically by value)
      for (let i = 1; i < goals.length; i++) {
        const prev = Number(goals[i - 1].target);
        const curr = Number(goals[i].target);

        // Only check valid numbers
        if (Number.isFinite(prev) && Number.isFinite(curr)) {
          if (curr <= prev) {
            general.push(
              `Milestone ${i + 1} must be greater than Milestone ${i} .`,
              //  `Milestone ${i + 1} (${curr}) must be greater than Milestone ${i} (${prev}).`
            );
          }
        }
      }

      // Check for duplicates or wrong ordering overall
      const ordered = [...targets].sort((a, b) => a.value - b.value);
      for (let i = 0; i < ordered.length; i++) {
        if (i > 0 && ordered[i].value <= ordered[i - 1].value) {
          general.push(
            "Milestone targets must be strictly increasing (no duplicates).",
          );
          break;
        }
      }
    }

    return { perGoal, general };
  }

  const validateBxgy = (goal) => {
    const errors = {};

    if (!goal) return errors;

    // Quantities
    if (!goal.buyQty || goal.buyQty <= 0)
      errors.buyQty = "Buy quantity must be greater than 0";

    if (!goal.getQty || goal.getQty <= 0)
      errors.getQty = "Get quantity must be greater than 0";

    // Spend / Collection validations
    if (goal.bxgyMode === "spend_any_collection") {
      if (!goal.spendAmount || goal.spendAmount <= 0)
        errors.spendAmount = "Spend amount must be greater than 0";
      if (!goal.buyCollections?.length)
        errors.buyCollections = "Select at least one collection";
    }

    if (goal.bxgyMode === "product" && !goal.buyProducts?.length)
      errors.buyProducts = "Select at least one product to buy";

    if (goal.bxgyMode === "collection" && !goal.buyCollections?.length)
      errors.buyCollections = "Select at least one collection to buy";

    // Reward validation (always required)
    if (!goal.getProducts?.length)
      errors.getProducts = "Select at least one reward product";

    return errors;
  };

  // LOAD CAMPAIGNS FROM METAFIELD
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || !campaigns.length) return;

    const campaignToEdit = campaigns.find((c) => c.id === editId);

    if (campaignToEdit) {
      setEditingCampaign(campaignToEdit);
    }
  }, [campaigns, searchParams]);

  // ------------------------------------------------------------------
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch(
          "/api/my-campaign?namespace=optimaio_cart&key=campaigns",
        );
        const data = await response.json();
        if (data.success && data.value && Array.isArray(data.value.campaigns)) {
          setCampaigns(data.value.campaigns);
        } else {
          setCampaigns([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch campaigns:", err);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  // Define default structure once at top (or in a separate constants file)
  const defaultContent = {
    giftTitleBefore: "",
    giftTitleAfter: "",
    progressTextBefore: "",
    progressTextAfter: "",
    batchTitle: "",
    offerTitle: "",
    offerSubtitle: "",
    offerSubtitleAfter: "",
  };

  // ------------------------------------------------------------------
  // WHEN USER CLICKS "EDIT" ON A CAMPAIGN
  // load its fields into state for editing
  // ------------------------------------------------------------------
  useEffect(() => {
    if (editingCampaign) {
      const resolvedContent =
        editingCampaign.campaignType === "bxgy"
          ? editingCampaign.content &&
            Object.keys(editingCampaign.content).length > 0
            ? editingCampaign.content
            : getInitialContentForBxgy()
          : editingCampaign.content || {};

      const snap = {
        campaignName: editingCampaign.campaignName || "",
        status: editingCampaign.status || "draft",
        trackType: editingCampaign.trackType || "cart",
        goals: editingCampaign.goals || [],
        campaignType: editingCampaign.campaignType || "tiered",
        activeDates: editingCampaign.activeDates || {
          start: { date: null, time: null },
          end: null,
        },
        content: resolvedContent, // ✅ IMPORTANT
      };

      setName(snap.campaignName);
      setStatus(snap.status);
      setGoals(snap.goals);
      setSelected(snap.trackType);
      setActiveDates(snap.activeDates);

      setContent(resolvedContent); // ✅ SAME OBJECT
      setInitialSnapshot(snap); // ✅ SAME CONTENT

      setSaveBarOpen(false);
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [editingCampaign]);

  useEffect(() => {
    if (!isInitialized || !initialSnapshot) return;

    const currentSnapshot = {
      campaignName: name,
      status,
      trackType: selected,
      goals,
      campaignType: editingCampaign?.campaignType || "tiered",
      activeDates,
    };

    const changed =
      JSON.stringify(currentSnapshot) !== JSON.stringify(initialSnapshot);

    setSaveBarOpen(changed);
  }, [
    isInitialized,
    name,
    status,
    selected,
    goals,
    activeDates,
    initialSnapshot,
    editingCampaign,
  ]);

  useEffect(() => {
    if (!lastAddedGoalId.current) return;

    const el = goalRefs.current[lastAddedGoalId.current];

    if (el) {
      // Polaris layouts need a frame to settle
      requestAnimationFrame(() => {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    lastAddedGoalId.current = null;
  }, [goals]);

  // ------------------------------------------------------------------
  // DETECT UNSAVED CHANGES
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isInitialized || !initialSnapshot) return;

    const changed =
      name !== initialSnapshot.campaignName ||
      status !== initialSnapshot.status ||
      selected !== initialSnapshot.trackType ||
      JSON.stringify(goals) !== JSON.stringify(initialSnapshot.goals) ||
      JSON.stringify(activeDates) !==
        JSON.stringify(initialSnapshot.activeDates) ||
      JSON.stringify(content) !== JSON.stringify(initialSnapshot.content);

    setSaveBarOpen(changed);
  }, [
    isInitialized,
    name,
    status,
    selected,
    goals,
    activeDates,
    content,
    initialSnapshot,
  ]);

  // ------------------------------------------------------------------
  // SAVE CAMPAIGN
  // ------------------------------------------------------------------
  const tzOffsetMinutes = -new Date().getTimezoneOffset();
  const handleSaveCampaign = async () => {
    const campaignData = {
      id: editingCampaign?.id || `cmp_${Date.now()}`,
      campaignName: name,
      status,
      trackType: selected,
      goals,
      campaignType: editingCampaign?.campaignType || "tiered",
      activeDates, // ✅ Add this line
      content, // ✅ new
      tzOffsetMinutes,
    };

    // 🧩 Validate campaign name
    if (campaignData.campaignType === "bxgy") {
      const errors = validateBxgy(goals[0]);

      if (Object.keys(errors).length > 0) {
        setBxgyErrors(errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setBxgyErrors({});

      // 🔒 FORCE FREE PRODUCT AFTER VALIDATION
      campaignData.goals = campaignData.goals.map((g) => ({
        ...g,
        discountType: "free_product",
        discountValue: 100,
      }));
    } else {
      // ✅ Tiered validation
      const { perGoal, general } = validateTiered(goals, selected);
      setTieredErrors(perGoal);
      setTieredGeneralErrors(general);
      if (general.length || Object.keys(perGoal).length) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    const res = await fetch("/api/save-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignData),
    });

    const data = await res.json();
    if (data.ok) {
      setCampaigns(data.campaigns);

      // Update snapshot so SaveBar closes
      setInitialSnapshot({
        campaignName: name,
        status,
        trackType: selected,
        goals,
        campaignType: editingCampaign?.campaignType || "tiered",
        activeDates,
        content,
      });

      setSaveBarOpen(false);

      if (shopify?.saveBar) {
        shopify.saveBar.hide("campaign-save-bar");
      }
    } else {
      alert("❌ Failed to save campaign");
    }
  };

  // ------------------------------------------------------------------
  // DISCARD CAMPAIGN
  // ------------------------------------------------------------------
  const handleDiscardCampaign = () => {
    // const confirmDiscard = window.confirm("Discard changes?");
    // if (!confirmDiscard) return;

    if (!initialSnapshot) return;

    // Restore previous values
    setName(initialSnapshot.campaignName);
    setStatus(initialSnapshot.status);
    setSelected(initialSnapshot.trackType);
    setGoals(initialSnapshot.goals);
    setActiveDates(initialSnapshot.activeDates);
    setContent(initialSnapshot.content || {});

    setSaveBarOpen(false);

    if (shopify?.saveBar) {
      shopify.saveBar.hide("campaign-save-bar");
    }
  };

  // ------------------------------------------------------------------
  // STATUS DROPDOWN OPTIONS
  // ------------------------------------------------------------------
  const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Active", value: "active" },
  ];

  // ------------------------------------------------------------------
  // ADD NEW GOAL (tiered milestones mode)
  // ------------------------------------------------------------------
  const handleSelect = (type) => {
    // Build ID
    let prefix = "";
    if (type === "free_product") prefix = "GIFT";
    if (type === "order_discount") prefix = "OFF";
    if (type === "free_shipping") prefix = "SHIP";

    const num = Math.floor(10 + Math.random() * 990); // 10–999
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randLetters = (len) =>
      Array.from(
        { length: len },
        () => letters[Math.floor(Math.random() * letters.length)],
      ).join("");

    const letterCount = num.toString().length === 2 ? 4 : 3;
    const goalId = `${prefix}${num}${randLetters(letterCount)}`;

    // Base object
    let newGoal = { id: goalId, type };

    if (type === "free_product") {
      newGoal.giftQty = 1;
      newGoal.products = [];
    }

    if (type === "order_discount") {
      newGoal.discountType = "percentage";
      newGoal.discountValue = 10;
    }

    // 🔑 CONTENT DEFAULTS (ADD HERE)
    const goalIndex = goals.length; // zero-based
    const suffix =
      goalIndex === 0
        ? "st"
        : goalIndex === 1
          ? "nd"
          : goalIndex === 2
            ? "rd"
            : "th";

    const goalKey = `${goalIndex + 1}${suffix} goal`;

    setContent((prev) => ({
      ...prev,
      [goalKey]: prev[goalKey] || getInitialContentByGoal(newGoal),
    }));

    // free_shipping has no extra config initially
    lastAddedGoalId.current = goalId;
    setGoals((prev) => [...prev, newGoal]);
    setActive(false);
  };

  // popover activator button
  const activator = (
    <Button
      plain
      icon={<Icon source={PlusIcon} tone="base" />}
      onClick={toggleActive}
    >
      Add a new goal
    </Button>
  );

  // BXGY EDITOR (Buy X Get Y) — Enhanced with Product / Collection / All Modes
  // BXGY EDITOR (Buy X Get Y) — Clean, Logical Structure
  const renderBxgyEditor = (bxgyErrors, setBxgyErrors) => {
    const bxgyGoal = goals[0] || {
      id: `BXGY_${Date.now()}`,
      bxgyMode: "product", // "product" | "collection" | "all"
      buyQty: 1,
      buyProducts: [],
      buyCollections: [],
      getQty: 1,
      getProducts: [],
      discountType: "free_product",
      discountValue: 100,
    };

    // 🔒 FORCE BXGY TO ALWAYS BE FREE PRODUCT
    if (
      bxgyGoal.discountType !== "free_product" ||
      bxgyGoal.discountValue !== 100
    ) {
      bxgyGoal.discountType = "free_product";
      bxgyGoal.discountValue = 100;
    }

    if (!goals[0]) setGoals([bxgyGoal]);

    return (
      <Card sectioned>
        <Text variant="headingSm" fontWeight="bold">
          Buy X Get Y Type
        </Text>

        {/* ---------------- Offer Type Selector ---------------- */}
        <div style={{ marginTop: "1rem" }}>
          {/* <Text fontWeight="bold">Buy X Get Y Type</Text> */}
          <ButtonGroup segmented>
            <Button
              pressed={bxgyGoal.bxgyMode === "product"}
              onClick={() =>
                setGoals((prev) => [
                  {
                    ...prev[0],
                    bxgyMode: "product",
                    // Keep collections, just clear if switching intentionally
                    buyCollections:
                      prev[0].bxgyMode === "collection"
                        ? prev[0].buyCollections
                        : prev[0].buyCollections,
                  },
                ])
              }
            >
              Product-based
            </Button>

            <Button
              pressed={bxgyGoal.bxgyMode === "spend_any_collection"}
              onClick={() =>
                setGoals((prev) => [
                  {
                    ...prev[0],
                    bxgyMode: "spend_any_collection",
                    spendAmount: prev[0].spendAmount || 0,
                    minQty: prev[0].minQty || 1,
                    buyCollections: prev[0].buyCollections || [],
                  },
                ])
              }
            >
              Spend X on Any Collection
            </Button>

            <Button
              pressed={bxgyGoal.bxgyMode === "collection"}
              onClick={() =>
                setGoals((prev) => [
                  {
                    ...prev[0],
                    bxgyMode: "collection",
                    // Keep products unless switching from product mode
                    buyProducts:
                      prev[0].bxgyMode === "product"
                        ? prev[0].buyProducts
                        : prev[0].buyProducts,
                  },
                ])
              }
            >
              Collection-based
            </Button>

            <Button
              pressed={bxgyGoal.bxgyMode === "all"}
              onClick={() =>
                setGoals((prev) => [
                  {
                    ...prev[0],
                    bxgyMode: "all",
                    // Keep data but clarify no manual selection needed
                    buyProducts: prev[0].buyProducts || [],
                    buyCollections: prev[0].buyCollections || [],
                  },
                ])
              }
            >
              Storewide (All Products)
            </Button>
          </ButtonGroup>
        </div>

        {/* ---------------- BUY SECTION ---------------- */}
        <div style={{ marginTop: "1.5rem" }}>
          {bxgyGoal.bxgyMode !== "spend_any_collection" && (
            <Text variant="headingSm" fontWeight="bold">
              Buy Requirements (X)
            </Text>
          )}

          {bxgyGoal.bxgyMode !== "spend_any_collection" && (
            <div style={{ marginBottom: "1rem" }}>
              <TextField
                label="Buy Quantity (X)"
                type="number"
                value={bxgyGoal.buyQty}
                onChange={(val) =>
                  setGoals([{ ...bxgyGoal, buyQty: Number(val) }])
                }
                error={bxgyErrors.buyQty}
              />
            </div>
          )}
          {bxgyGoal.bxgyMode === "product" && (
            <>
              <CampaignProductSelector
                label="Select Buy Products"
                initialSelected={bxgyGoal.buyProducts || []}
                onSelect={(variants) =>
                  setGoals((prev) => [
                    {
                      ...prev[0],
                      buyProducts: variants,
                    },
                  ])
                }
              />

              {bxgyErrors.buyProducts && (
                <Text tone="critical" variant="bodySm">
                  {bxgyErrors.buyProducts}
                </Text>
              )}

              {(bxgyGoal.buyProducts || []).length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  {(bxgyGoal.buyProducts || []).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #eee",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginBottom: "0.5rem",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <img
                          src={p.image?.url || p.productImage?.url || ""}
                          alt={p.title}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "4px",
                            objectFit: "cover",
                          }}
                        />
                        <Text>
                          {p.productTitle
                            ? `${p.productTitle} - ${p.title}`
                            : p.title}
                        </Text>
                      </div>
                      <Button
                        plain
                        destructive
                        icon={<Icon source={DeleteIcon} />}
                        onClick={() =>
                          setGoals([
                            {
                              ...bxgyGoal,
                              buyProducts: (bxgyGoal.buyProducts || []).filter(
                                (bp) => bp.id !== p.id,
                              ),
                            },
                          ])
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {bxgyGoal.bxgyMode === "spend_any_collection" && (
            <BlockStack gap={200}>
              <Text variant="headingSm" fontWeight="bold">
                Spend X on Any Collection
              </Text>

              {/* Spend threshold */}
              <TextField
                label="Minimum Spend"
                type="number"
                value={bxgyGoal.spendAmount || 0}
                onChange={(val) =>
                  setGoals([{ ...bxgyGoal, spendAmount: Number(val) }])
                }
                helpText="Customer must spend at least this amount in selected collections."
                error={bxgyErrors.spendAmount}
              />

              {/* Select collections */}

              <Box maxWidth="200px" width="100%">
                <CampaignCollectionSelector
                  label="Select Collections"
                  initialSelected={bxgyGoal.buyCollections || []}
                  onSelect={(collections) =>
                    setGoals((prev) => [
                      {
                        ...prev[0],
                        buyCollections: collections,
                      },
                    ])
                  }
                />
              </Box>

              {bxgyErrors.buyCollections && (
                <Text tone="critical" variant="bodySm">
                  {bxgyErrors.buyCollections}
                </Text>
              )}

              {(bxgyGoal.buyCollections || []).length > 0 && (
                <Card padding="0">
                  <DataTable
                    columnContentTypes={["text", "text"]}
                    headings={[]}
                    rows={bxgyGoal.buyCollections.map((c) => [
                      // Collection column
                      <InlineStack gap="200" blockAlign="center" wrap={false}>
                        <Thumbnail
                          source={c.image?.url || ""}
                          alt={c.title}
                          size="small"
                        />
                        <Box minWidth="0">
                          <Text as="span">{c.title}</Text>
                        </Box>
                      </InlineStack>,

                      // Action column
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                        padding={100}
                      >
                        <InlineStack align="end" blockAlign="center">
                          <Button
                            plain
                            destructive
                            icon={DeleteIcon}
                            onClick={() =>
                              setGoals((prev) => [
                                {
                                  ...prev[0],
                                  buyCollections: prev[0].buyCollections.filter(
                                    (col) => col.id !== c.id,
                                  ),
                                },
                              ])
                            }
                          />
                        </InlineStack>
                      </Box>,
                    ])}
                  />
                </Card>
              )}
            </BlockStack>
          )}

          {bxgyGoal.bxgyMode === "collection" && (
            <BlockStack gap={200}>
              <Box>
                <CampaignCollectionSelector
                  label="Select Collections"
                  initialSelected={bxgyGoal.buyCollections || []}
                  onSelect={(collections) =>
                    setGoals((prev) => [
                      {
                        ...prev[0],
                        buyCollections: collections,
                      },
                    ])
                  }
                />
              </Box>

              {bxgyErrors.buyCollections && (
                <Text tone="critical" variant="bodySm">
                  {bxgyErrors.buyCollections}
                </Text>
              )}

              {(bxgyGoal.buyCollections || []).length > 0 && (
                <Card padding="0">
                  <DataTable
                    columnContentTypes={["text", "numeric"]}
                    headings={[]}
                    rows={bxgyGoal.buyCollections.map((c) => [
                      // Collection column
                      <InlineStack
                        key={`collection-${c.id}`}
                        gap="200"
                        blockAlign="center"
                        wrap={false}
                      >
                        <Thumbnail
                          source={c.image?.url || c.image?.src || ""}
                          alt={c.title}
                          size="small"
                        />
                        <Box minWidth="0">
                          <Text as="span">{c.title}</Text>
                        </Box>
                      </InlineStack>,

                      // Action column
                      <Box
                        key={`delete-${c.id}`}
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                        padding={100}
                      >
                        <Button
                          plain
                          destructive
                          icon={DeleteIcon}
                          onClick={() =>
                            setGoals([
                              {
                                ...bxgyGoal,
                                buyCollections: bxgyGoal.buyCollections.filter(
                                  (col) => col.id !== c.id,
                                ),
                              },
                            ])
                          }
                        />
                      </Box>,
                    ])}
                  />
                </Card>
              )}
            </BlockStack>
          )}

          {bxgyGoal.bxgyMode === "all" && (
            <Box padding="200" tone="subdued">
              <Text>Applies to all store products — no selection needed.</Text>
            </Box>
          )}
        </div>

        {/* ---------------- GET SECTION (Always visible) ---------------- */}
        {/* ---------------- GET SECTION (Always visible) ---------------- */}
        <BlockStack gap="200">
          <Box paddingBlockStart="400">
            <Divider />
          </Box>
          <Text variant="headingSm" fontWeight="bold">
            Get Reward (Y)
          </Text>

          <div style={{ marginBottom: "1rem" }}>
            <TextField
              label="Get Quantity (Y)"
              type="number"
              value={bxgyGoal.getQty}
              onChange={(val) =>
                setGoals([{ ...bxgyGoal, getQty: Number(val) }])
              }
              error={bxgyErrors.getQty}
            />
          </div>

          <box>
            <CampaignProductSelector
              label="Select Reward Products"
              initialSelected={bxgyGoal.getProducts || []}
              onSelect={(variants) =>
                setGoals((prev) => [
                  {
                    ...prev[0],
                    getProducts: variants,
                  },
                ])
              }
            />
          </box>

          {bxgyErrors.getProducts && (
            <Text tone="critical" variant="bodySm">
              {bxgyErrors.getProducts}
            </Text>
          )}

          {(bxgyGoal.getProducts || []).length > 0 && (
            <Card padding="0">
              <DataTable
                columnContentTypes={["text", "numeric"]}
                headings={[]}
                rows={bxgyGoal.getProducts.map((p) => [
                  // Product column
                  <InlineStack
                    key={`product-${p.id}`}
                    gap="200"
                    blockAlign="center"
                    wrap={false}
                  >
                    <Thumbnail
                      source={p.image?.url || p.productImage?.url || ""}
                      alt={p.title}
                      size="small"
                    />

                    <Box minWidth="0">
                      <Text as="span">
                        {p.productTitle
                          ? `${p.productTitle} - ${p.title}`
                          : p.title}
                      </Text>
                    </Box>
                  </InlineStack>,

                  // Action column (right aligned)
                  <Box
                    key={`delete-${p.id}`}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    padding={100}
                  >
                    <Button
                      plain
                      destructive
                      icon={DeleteIcon}
                      onClick={() =>
                        setGoals([
                          {
                            ...bxgyGoal,
                            getProducts: (bxgyGoal.getProducts || []).filter(
                              (gp) => gp.id !== p.id,
                            ),
                          },
                        ])
                      }
                    />
                  </Box>,
                ])}
              />
            </Card>
          )}
        </BlockStack>

        {/* ---------------- DISCOUNT SECTION ---------------- */}

        {/* Friendly note when Free Product is active */}
        {bxgyGoal.discountType === "free_product" && (
          <Box
            padding="400"
            background="bg-subdued"
            borderRadius="200"
            marginTop="400"
          >
            <Text tone="subdued">
              🎁 All selected reward products will be completely free for the
              customer.
            </Text>
          </Box>
        )}

        {/* ---------------- MODALS ---------------- */}
        {pickerType === "collection" ? (
          <CollectionPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            initialSelected={bxgyGoal.buyCollections || []}
            onSelect={(selectedCollections) =>
              setGoals([{ ...bxgyGoal, buyCollections: selectedCollections }])
            }
          />
        ) : (
          <ProductPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            initialSelected={
              bxgyGoal[pickerType === "buy" ? "buyProducts" : "getProducts"] ||
              []
            }
            onSelect={(selectedVariants) => {
              setGoals([
                {
                  ...bxgyGoal,
                  [pickerType === "buy" ? "buyProducts" : "getProducts"]:
                    selectedVariants,
                },
              ]);
            }}
          />
        )}
      </Card>
    );
  };

  // ------------------------------------------------------------------
  // EDIT VIEW
  // ------------------------------------------------------------------
  if (editingCampaign) {
    const isBxgy = editingCampaign?.campaignType === "bxgy";

    function getOrdinal(n) {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    return (
      <Page
        title={
          <InlineStack gap="500" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              plain
              onClick={() => window.history.back()}
            />
            <Text variant="headingLg" as="h2">
              Edit Campaign
            </Text>
          </InlineStack>
        }
      >
        <Layout>
          {/* -------------------------------------------------
             LEFT SECTION
          ------------------------------------------------- */}
          <Layout.Section>
            <BlockStack gap="400">
              <Colabssiblecom
                title="Rewards"
                description="Choose the product that the customer buys and the free gift they get along with it."
                icon={DiscountIcon}
              >
                {!isBxgy && (
                  <>
                    {!isBxgy && tieredGeneralErrors.length > 0 && (
                      <Box
                        padding="200"
                        background="bg-surface-success"
                        borderRadius="200"
                        tone="critical"
                      >
                        {tieredGeneralErrors.map((msg, i) => (
                          <Text key={i} tone="critical" variant="bodySm">
                            {msg}
                          </Text>
                        ))}
                      </Box>
                    )}
                    <Text variant="bodyLg" fontWeight="bold">
                      Campaign ID:
                    </Text>
                    <Text>{editingCampaign.id}</Text>

                    {/* Tracking Section */}
                    <div style={{ marginTop: "1rem" }}>
                      <Text variant="headingMd" as="h6" tone="subdued">
                        Choose what to track
                      </Text>
                      <Box
                        padding="100"
                        borderRadius="200"
                        background="bg-subdued"
                      >
                        <ButtonGroup segmented>
                          <Button
                            pressed={selected === "cart"}
                            onClick={() => setSelected("cart")}
                          >
                            Total cart value
                          </Button>
                          <Button
                            pressed={selected === "quantity"}
                            onClick={() => setSelected("quantity")}
                          >
                            Product quantity
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </div>

                    {/* Milestones Section */}
                    <div style={{ marginTop: "1.5rem" }}>
                      <Text variant="headingMd" as="h3" fontWeight="bold">
                        Milestones
                      </Text>
                      <Text tone="subdued">
                        Setup the target value and reward for each milestone
                      </Text>

                      {/* Add goal button */}
                      <BlockStack gap="400">
                        {/* Create goals */}
                        <Popover
                          active={active}
                          activator={activator}
                          onClose={toggleActive}
                        >
                          <ActionList
                            items={[
                              {
                                content: "Free product",
                                onAction: () => handleSelect("free_product"),
                              },
                              {
                                content: "Order discount",
                                onAction: () => handleSelect("order_discount"),
                              },
                              {
                                content: "Free shipping",
                                onAction: () => handleSelect("free_shipping"),
                              },
                            ]}
                          />
                        </Popover>

                        {/* Render all goals (full original milestone editor UI) */}
                        <BlockStack gap="400">
                          {goals.map((goal, index) => (
                            <Box
                              paddingInlineStart="200"
                              key={goal.id}
                              ref={(el) => {
                                if (el) goalRefs.current[goal.id] = el;
                              }}
                            >
                              <InlineGrid
                                columns="120px 1fr"
                                gap="400"
                                alignItems="start"
                              >
                                {/* Left column */}
                                <Box>
                                  <Text variant="bodyMd" tone="subdued">
                                    {getOrdinal(index + 1)} goal
                                  </Text>

                                  <TextField
                                    label=""
                                    type="number"
                                    value={goal.target || ""}
                                    prefix={
                                      selected === "cart"
                                        ? defaultCurrency
                                        : "Qty"
                                    }
                                    onChange={(val) =>
                                      setGoals((prev) =>
                                        prev.map((g) =>
                                          g.id === goal.id
                                            ? { ...g, target: Number(val) }
                                            : g,
                                        ),
                                      )
                                    }
                                    error={tieredErrors[goal.id]?.target}
                                  />
                                </Box>

                                {/* Right column */}
                                <Box paddingInlineStart="200">
                                  <TieredGoalCard
                                    goal={goal}
                                    setGoals={setGoals}
                                    tieredErrors={tieredErrors}
                                    setCurrentGoal={setCurrentGoal}
                                    setPickerType={setPickerType}
                                    setPickerOpen={setPickerOpen}
                                    defaultCurrency={defaultCurrency}
                                  />
                                </Box>
                              </InlineGrid>
                            </Box>
                          ))}
                        </BlockStack>
                      </BlockStack>

                      <Box padding="200">
                        <Banner tone="info">
                          <Text variant="bodySm">
                            Set your existing Shopify discounts to combine with
                            product and order discounts to ensure that these
                            rewards work well together.
                          </Text>
                        </Banner>
                      </Box>
                    </div>

                    {/* ⬇️ ProductPickerModal for tiered free gifts */}
                    <ProductPickerModal
                      open={pickerOpen}
                      onClose={() => setPickerOpen(false)}
                      initialSelected={
                        goals.find((g) => g.id === currentGoal)?.products || []
                      }
                      onSelect={(selectedVariants) => {
                        setGoals((prev) =>
                          prev.map((g) =>
                            g.id === currentGoal
                              ? {
                                  ...g,
                                  products: selectedVariants,
                                }
                              : g,
                          ),
                        );
                      }}
                    />
                  </>
                )}

                {/* BXGY block (single rule). Shown only if campaignType is bxgy */}
                {isBxgy && (
                  <>
                    {renderBxgyEditor(bxgyErrors, setBxgyErrors)}

                    {/* Picker for BXGY: can assign buyProducts/getProducts */}
                  </>
                )}
              </Colabssiblecom>

              {/* Content */}

              <Colabssiblecom
                title="Content"
                description="Customize content shown for this campaign and manage translations to languages."
                icon={BlogIcon}
              >
                {isBxgy ? (
                  <ContentEditor
                    value={content}
                    onChange={(val) => setContent(val)}
                    type="bxgy"
                  />
                ) : (
                  <BlockStack gap="400">
                    {goals.map((goal, index) => {
                      const num = index + 1;
                      const suffix =
                        num === 1
                          ? "st"
                          : num === 2
                            ? "nd"
                            : num === 3
                              ? "rd"
                              : "th";

                      const goalKey = `${num}${suffix} goal`;
                      const isOpen = activeContentGoal === goalKey;

                      return (
                        <Card key={goal.id}>
                          <Box>
                            {/* Header Row */}
                            <InlineStack
                              align="space-between"
                              blockAlign="center"
                            >
                              <Text variant="headingSm" fontWeight="bold">
                                {goalKey}
                              </Text>

                              <Button
                                onClick={() =>
                                  setActiveContentGoal(isOpen ? null : goalKey)
                                }
                              >
                                {isOpen ? "Close" : "Edit"}
                              </Button>
                            </InlineStack>

                            {/* Collapsible Content */}
                            <Collapsible open={isOpen}>
                              <Box paddingBlockStart="400">
                                <ContentEditor
                                  value={content[goalKey] || {}}
                                  onChange={(val) =>
                                    setContent((prev) => ({
                                      ...prev,
                                      [goalKey]: val,
                                    }))
                                  }
                                  type="tiered"
                                />
                              </Box>
                            </Collapsible>
                          </Box>
                        </Card>
                      );
                    })}
                  </BlockStack>
                )}
              </Colabssiblecom>

              {/* ------------------------------------------------------------------ */}
              {/* Collapsible Info Section (Modern Polaris) */}
              {/* ------------------------------------------------------------------ */}
              <Colabssiblecom
                title="Active dates"
                description="Manage start and end dates for this campaign."
                icon={CalendarIcon}
              >
                <ActiveDatesPicker
                  value={activeDates}
                  onChange={(dates) => setActiveDates(dates)}
                />
              </Colabssiblecom>
            </BlockStack>
          </Layout.Section>

          {/* -------------------------------------------------
             RIGHT SIDE (Preview / Settings)
          ------------------------------------------------- */}
          <Layout.Section variant="oneThird">
            <CampaignGoal
              status={status}
              setStatus={setStatus}
              statusOptions={statusOptions}
              name={name}
              setName={setName}
              nameError={nameError}
              isBxgy={isBxgy}
              goals={goals}
              defaultCurrency={defaultCurrency}
              selected={selected}
              content={content}
            />
          </Layout.Section>
        </Layout>

        <Box paddingBlockEnd="600" />

        <SaveBar id="campaign-save-bar" open={saveBarOpen} discardConfirmation>
          <button
            variant="primary"
            onClick={handleSaveCampaign}
            disabled={!saveBarOpen}
          >
            Save
          </button>
          <button onClick={handleDiscardCampaign}>Discard</button>
        </SaveBar>
      </Page>
    );
  }

  // ------------------------------------------------------------------
  // REORDER PRIORITY HELPERS (list view)
  // ------------------------------------------------------------------
  async function saveCampaignOrder(updatedCampaigns) {
    try {
      const res = await fetch("/api/update-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns: updatedCampaigns }),
      });

      const data = await res.json();
      if (data.ok || data.success) {
        console.log("✅ Campaign order saved");
      } else {
        console.error("❌ Failed to save campaign order");
      }
    } catch (error) {
      console.error("⚠️ Error saving order:", error);
    }
  }

  const handlePriorityUp = (index) => {
    if (index === 0) return; // already at top
    setCampaigns((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      saveCampaignOrder(newOrder);
      console.log("handlePriorityUp :", index);
      return newOrder;
    });
  };

  const handlePriorityDown = (index) => {
    setCampaigns((prev) => {
      if (index === prev.length - 1) return prev; // already bottom
      const newOrder = [...prev];
      [newOrder[index + 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index + 1],
      ];
      saveCampaignOrder(newOrder);
      console.log("handlePriorityDown :", index);
      return newOrder;
    });
  };

  // ------------------------------------------------------------------
  // LIST VIEW
  // ------------------------------------------------------------------
  const resourceName = { singular: "campaign", plural: "campaigns" };

  const rowMarkup = campaigns.map((c, index) => (
    <IndexTable.Row id={`row-${index}`} key={index} position={index}>
      <IndexTable.Cell>
        <Text fontWeight="bold">{c.campaignName}</Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {c.status === "active" ? (
          <Badge tone="success">Active</Badge> // 🟢 Green for Active
        ) : (
          <Badge tone="info">Draft</Badge> // 🔵 Blue for Draft
        )}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <ButtonGroup>
          <Button onClick={() => setEditingCampaign(c)}>Edit</Button>

          <Button
            tone="critical"
            onClick={async () => {
              const res = await fetch("/api/delete-campaign", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  namespace: "optimaio_cart",
                  key: "campaigns",
                  id: c.id,
                }),
              });
              const data = await res.json();
              if (data.success) {
                setCampaigns(data.campaigns);
              }
            }}
          >
            Delete
          </Button>
        </ButtonGroup>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <ButtonGroup>
          {/* Priority arrows */}
          <InlineStack gap="0" align="center">
            <Button
              icon={CaretUpIcon}
              variant="tertiary"
              onClick={() => handlePriorityUp(index)}
              accessibilityLabel="Move up"
              disabled={index === 0}
            />
            <Text variant="bodySm" tone="subdued">
              {index + 1}
            </Text>
            <Button
              icon={CaretDownIcon}
              variant="tertiary"
              onClick={() => handlePriorityDown(index)}
              accessibilityLabel="Move down"
              disabled={index === campaigns.length - 1}
            />
          </InlineStack>
        </ButtonGroup>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title={
        <InlineStack gap="500" blockAlign="center">
          <Button
            icon={ArrowLeftIcon}
            plain
            onClick={() => window.history.back()}
          />
          <Text variant="headingLg" as="h2">
            My Campaigns
          </Text>
        </InlineStack>
      }
    >
      {loading ? (
        <Spinner accessibilityLabel="Loading campaigns" size="large" />
      ) : (
        <IndexTable
          resourceName={resourceName}
          itemCount={campaigns.length}
          selectable={false}
          headings={[
            { title: "Campaign Goal" },
            { title: "Status" },
            { title: "Action" },
            { title: "Priority" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      )}
    </Page>
  );
}
