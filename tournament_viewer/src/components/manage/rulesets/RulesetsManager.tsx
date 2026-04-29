import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Ruleset = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  config: Record<string, unknown>;
};

type Match = {
  id: number;
  name: string;
};

type Phase = {
  id: number;
  name: string;
  ruleset?: Ruleset;
  matches: Match[];
};

type Division = {
  id: number;
  name: string;
  phases: Phase[];
};

type PreviewRanking = {
  player: { id: number; playerName: string };
  totalPoints: number;
  averagePercentage: number;
  failCount: number;
  rank: number;
};

type PreviewAction = {
  player: { id: number; playerName: string };
  action: string;
  targetPhaseId?: number;
  targetMatchId?: number;
  rank: number;
  tiedAtBoundary: boolean;
  reason: string;
};

type PreviewResponse = {
  phaseId: number;
  matchId?: number;
  stepIndex?: number;
  stepName?: string;
  rulesetId: number;
  tiePolicy: string;
  ranking: PreviewRanking[];
  actions: PreviewAction[];
  unresolvedTies: { playerIds: number[]; reason: string }[];
};

type MatchCompletionStatus = {
  matchId: number;
  matchName: string;
  ready: boolean;
  totalRounds: number;
  completedRounds: number;
  missingRounds: {
    roundId: number;
    songId: number;
    songTitle: string;
    requiredPlayers: number;
    submittedPlayers: number;
    missingPlayers: { id: number; playerName: string }[];
  }[];
};

type RoutingRuleType =
  | "ADVANCE_TOP_N"
  | "ADVANCE_TOP_PERCENT"
  | "SEND_RANK_RANGE_TO_PHASE"
  | "SEND_REMAINING_TO_PHASE";

type RoutingRuleEditorRow = {
  ruleIndex: number;
  type: RoutingRuleType;
  lane?: "LOSERS" | "WINNERS";
  targetMatchId: number | "";
  targetPhaseId: number | "";
};

type RoutingStepEditorRow = {
  stepIndex: number;
  stepName: string;
  sourceMatchId: number | "";
  routingRules: RoutingRuleEditorRow[];
};

const qualifiersTemplate = {
  sortBy: "AVERAGE_PERCENTAGE",
  approvedOnly: false,
  minimumSubmissions: 0,
  advanceTopN: 0,
  advanceMinPercentage: 90,
};

const seedingRoundTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Ranking-only seeding. No placement actions here; use Waterfall ruleset to place seeds into rounds.",
  rules: [],
};

const doubleWaterfallTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Default Waterfall + Loser Bracket re-entry. Configure sourceMatchId/targetMatchId values to your actual matches.",
  steps: [
    {
      name: "Round 1 (winner pool)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Loser 1",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 2 (winner pool)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Loser 2",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 3 (winner pool)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Loser 3",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 4 (winner pool)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Round 5 (merge seeds + unbeaten winners)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Loser 4 (Round5 losers + climbers)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_PERCENT", percent: 50, rounding: "UP", targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
  ],
};

const adaptiveWaterfall10To5Template = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Adaptive template for max 10 players per match, top 5 go through. Set sourceMatchId and targetPhaseId per step.",
  steps: [
    {
      name: "Winners Round",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 5, targetPhaseId: 0 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, lane: "LOSERS" },
      ],
    },
    {
      name: "Losers Round",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 5, targetPhaseId: 0 },
        { type: "ELIMINATE_BOTTOM_N", count: 5 },
      ],
    },
  ],
};

const laderTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Stamina ladder / last-man-standing. Eliminate bottom player each round; all survivors proceed to next ladder round.",
  steps: [
    {
      name: "Lader Round",
      sourceMatchId: 0,
      rules: [
        { type: "ELIMINATE_BOTTOM_N", count: 1 },
        { type: "SEND_REMAINING_TO_PHASE", targetPhaseId: 0, targetMatchId: 0 },
      ],
    },
  ],
};

const finalsTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  steps: [
    {
      name: "Top 4 Semi A (1v4)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 1, targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_N", count: 1 },
      ],
    },
    {
      name: "Top 4 Semi B (2v3)",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 1, targetMatchId: 0 },
        { type: "ELIMINATE_BOTTOM_N", count: 1 },
      ],
    },
    {
      name: "3rd Place Match",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 1 },
        { type: "ELIMINATE_BOTTOM_N", count: 1 },
      ],
    },
    {
      name: "Grand Final",
      sourceMatchId: 0,
      rules: [
        { type: "ADVANCE_TOP_N", count: 1 },
        { type: "ELIMINATE_BOTTOM_N", count: 1 },
      ],
    },
  ],
};

export default function RulesetsManager() {
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [rulesetName, setRulesetName] = useState("");
  const [rulesetDescription, setRulesetDescription] = useState("");
  const [rulesetIsActive, setRulesetIsActive] = useState(true);
  const [editingRulesetId, setEditingRulesetId] = useState<number | null>(null);
  const [rulesetConfigText, setRulesetConfigText] = useState(
    JSON.stringify(adaptiveWaterfall10To5Template, null, 2),
  );
  const [helperSourceMatchId, setHelperSourceMatchId] = useState<number | "">("");
  const [helperTargetMatchId, setHelperTargetMatchId] = useState<number | "">("");
  const [helperTargetPhaseId, setHelperTargetPhaseId] = useState<number | "">("");

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [completionStatus, setCompletionStatus] = useState<MatchCompletionStatus | null>(null);
  const [completionStatusLoading, setCompletionStatusLoading] = useState(false);
  const [completionStatusError, setCompletionStatusError] = useState<string | null>(null);
  const [allowCommitWhenNotReady, setAllowCommitWhenNotReady] = useState(false);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [autoAssignOnCommit, setAutoAssignOnCommit] = useState(true);
  const [commitResult, setCommitResult] = useState<{
    runId: string;
    saved: number;
    autoAssignedPlayers: number;
  } | null>(null);

  const allPhases = useMemo(() => {
    return divisions.flatMap((division) =>
      (division.phases ?? []).map((phase) => ({
        ...phase,
        divisionId: division.id,
        divisionName: division.name,
      })),
    );
  }, [divisions]);

  const phaseRulesets = useMemo(() => rulesets, [rulesets]);
  const allMatches = useMemo(() => {
    return allPhases.flatMap((phase) =>
      (phase.matches ?? []).map((match) => ({
        ...match,
        phaseId: phase.id,
        phaseName: phase.name,
        divisionName: phase.divisionName,
      })),
    );
  }, [allPhases]);
  const allMatchIdSet = useMemo(
    () => new Set(allMatches.map((match) => match.id)),
    [allMatches],
  );
  const allPhaseIdSet = useMemo(
    () => new Set(allPhases.map((phase) => phase.id)),
    [allPhases],
  );
  const allMatchesById = useMemo(
    () => new Map(allMatches.map((match) => [match.id, match])),
    [allMatches],
  );
  const allPhasesById = useMemo(
    () => new Map(allPhases.map((phase) => [phase.id, phase])),
    [allPhases],
  );

  const parsedRulesetConfig = useMemo(() => {
    try {
      const parsed = JSON.parse(rulesetConfigText) as Record<string, unknown>;
      return { config: parsed, error: null as string | null };
    } catch {
      return {
        config: null,
        error: "Ruleset config is invalid JSON. Fix it to use the routing editor.",
      };
    }
  }, [rulesetConfigText]);

  const routingStepRows = useMemo<RoutingStepEditorRow[]>(() => {
    if (!parsedRulesetConfig.config) {
      return [];
    }
    const rawSteps = parsedRulesetConfig.config.steps;
    if (!Array.isArray(rawSteps)) {
      return [];
    }

    const supportsRoutingType = (type: unknown): type is RoutingRuleType =>
      type === "ADVANCE_TOP_N" ||
      type === "ADVANCE_TOP_PERCENT" ||
      type === "SEND_RANK_RANGE_TO_PHASE" ||
      type === "SEND_REMAINING_TO_PHASE";

    return rawSteps.flatMap((rawStep, stepIndex) => {
      if (!rawStep || typeof rawStep !== "object") {
        return [];
      }
      const step = rawStep as Record<string, unknown>;
      const rawSourceMatchId = step.sourceMatchId;
      const sourceMatchId =
        typeof rawSourceMatchId === "number" && rawSourceMatchId > 0
          ? rawSourceMatchId
          : "";
      const stepName =
        typeof step.name === "string" && step.name.trim().length > 0
          ? step.name
          : `Step ${stepIndex + 1}`;
      const rawRules = Array.isArray(step.rules) ? step.rules : [];
      const routingRules = rawRules.flatMap((rawRule, ruleIndex) => {
        if (!rawRule || typeof rawRule !== "object") {
          return [];
        }
        const rule = rawRule as Record<string, unknown>;
        if (!supportsRoutingType(rule.type)) {
          return [];
        }
        const targetMatchId: number | "" =
          typeof rule.targetMatchId === "number" && rule.targetMatchId > 0
            ? rule.targetMatchId
            : ("" as const);
        const targetPhaseId: number | "" =
          typeof rule.targetPhaseId === "number" && rule.targetPhaseId > 0
            ? rule.targetPhaseId
            : ("" as const);
        const lane: "LOSERS" | "WINNERS" | undefined =
          rule.lane === "LOSERS" || rule.lane === "WINNERS"
            ? rule.lane
            : undefined;
        return [
          {
            ruleIndex,
            type: rule.type,
            lane,
            targetMatchId,
            targetPhaseId,
          },
        ];
      });
      return [
        {
          stepIndex,
          stepName,
          sourceMatchId,
          routingRules,
        },
      ];
    });
  }, [parsedRulesetConfig.config]);

  const routingReferenceWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const stepRow of routingStepRows) {
      if (stepRow.sourceMatchId !== "" && !allMatchIdSet.has(stepRow.sourceMatchId)) {
        warnings.push(
          `${stepRow.stepName}: sourceMatchId ${stepRow.sourceMatchId} does not exist.`,
        );
      }
      for (const ruleRow of stepRow.routingRules) {
        if (
          ruleRow.targetMatchId !== "" &&
          !allMatchIdSet.has(ruleRow.targetMatchId)
        ) {
          warnings.push(
            `${stepRow.stepName} rule ${ruleRow.ruleIndex + 1}: targetMatchId ${ruleRow.targetMatchId} does not exist.`,
          );
        }
        if (
          ruleRow.targetPhaseId !== "" &&
          !allPhaseIdSet.has(ruleRow.targetPhaseId)
        ) {
          warnings.push(
            `${stepRow.stepName} rule ${ruleRow.ruleIndex + 1}: targetPhaseId ${ruleRow.targetPhaseId} does not exist.`,
          );
        }
      }
    }
    return warnings;
  }, [allMatchIdSet, allPhaseIdSet, routingStepRows]);

  const selectedMatch = useMemo(
    () => allMatches.find((match) => match.id === selectedMatchId),
    [allMatches, selectedMatchId],
  );
  const selectedPhase = useMemo(
    () => allPhases.find((phase) => phase.id === selectedMatch?.phaseId),
    [allPhases, selectedMatch?.phaseId],
  );
  const stepOptions = useMemo(() => {
    const steps = selectedPhase?.ruleset?.config?.steps;
    if (!Array.isArray(steps)) {
      return [];
    }
    return steps.map((step, index) => {
      const stepRecord =
        typeof step === "object" && step ? (step as Record<string, unknown>) : {};
      const name = typeof stepRecord.name === "string" ? stepRecord.name : `Step ${index + 1}`;
      const sourceMatchId =
        typeof stepRecord.sourceMatchId === "number"
          ? stepRecord.sourceMatchId
          : undefined;
      return { index, name, sourceMatchId };
    });
  }, [selectedPhase]);

  useEffect(() => {
    setSelectedStepIndex(0);
    setPreview(null);
    setCommitResult(null);
    setCompletionStatus(null);
    setCompletionStatusError(null);
    setAllowCommitWhenNotReady(false);
  }, [selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) {
      return;
    }

    void loadCompletionStatus(selectedMatchId);
  }, [selectedMatchId]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [rulesetsResponse, divisionsResponse] = await Promise.all([
        axios.get<Ruleset[]>("rulesets"),
        axios.get<Division[]>("divisions"),
      ]);
      setRulesets(rulesetsResponse.data ?? []);
      setDivisions(divisionsResponse.data ?? []);
    } catch {
      setError("Failed to load rulesets/divisions.");
    } finally {
      setLoading(false);
    }
  }

  function resetRulesetForm() {
    setEditingRulesetId(null);
    setRulesetName("");
    setRulesetDescription("");
    setRulesetIsActive(true);
    setRulesetConfigText(JSON.stringify(adaptiveWaterfall10To5Template, null, 2));
  }

  function selectRulesetForEdit(rulesetId: number | null) {
    if (!rulesetId) {
      resetRulesetForm();
      return;
    }
    const ruleset = rulesets.find((item) => item.id === rulesetId);
    if (!ruleset) {
      setError("Selected ruleset not found.");
      return;
    }
    setEditingRulesetId(ruleset.id);
    setRulesetName(ruleset.name ?? "");
    setRulesetDescription(ruleset.description ?? "");
    setRulesetIsActive(ruleset.isActive ?? true);
    setRulesetConfigText(JSON.stringify(ruleset.config ?? {}, null, 2));
  }

  async function saveRuleset() {
    setError(null);
    setMessage(null);

    if (!rulesetName.trim()) {
      setError("Ruleset name is required.");
      return;
    }

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(rulesetConfigText);
    } catch {
      setError("Ruleset config must be valid JSON.");
      return;
    }
    const legacyScope = inferLegacyScope(parsedConfig, rulesetName);

    try {
      if (editingRulesetId) {
        await axios.patch(`rulesets/${editingRulesetId}`, {
          name: rulesetName.trim(),
          description: rulesetDescription.trim() || undefined,
          config: parsedConfig,
          isActive: rulesetIsActive,
          scope: legacyScope,
        });
        setMessage("Ruleset updated.");
      } else {
        await axios.post("rulesets", {
          name: rulesetName.trim(),
          description: rulesetDescription.trim() || undefined,
          config: parsedConfig,
          isActive: rulesetIsActive,
          scope: legacyScope,
        });
        setMessage("Ruleset created.");
      }
      await loadData();
    } catch {
      setError(editingRulesetId ? "Failed to update ruleset." : "Failed to create ruleset.");
    }
  }

  async function deleteRuleset() {
    setError(null);
    setMessage(null);

    if (!editingRulesetId) {
      setError("Select a ruleset to delete.");
      return;
    }

    const accepted = window.confirm(
      "Delete this ruleset? This cannot be undone and phases using it will lose this reference.",
    );
    if (!accepted) {
      return;
    }

    try {
      await axios.delete(`rulesets/${editingRulesetId}`);
      resetRulesetForm();
      await loadData();
      setMessage("Ruleset deleted.");
    } catch {
      setError("Failed to delete ruleset. It may still be assigned to a phase.");
    }
  }

  async function setPhaseRuleset(phase: Phase, rulesetId: number | null) {
    setError(null);
    try {
      const response = await axios.patch<Phase>(`phases/${phase.id}`, { rulesetId });
      setDivisions((prev) =>
        prev.map((division) => ({
          ...division,
          phases: division.phases?.map((item) =>
            item.id === phase.id ? response.data : item,
          ),
        })),
      );
      setMessage("Phase ruleset updated.");
    } catch {
      setError("Failed to update phase ruleset.");
    }
  }

  function inferLegacyScope(
    config: Record<string, unknown>,
    name: string,
  ): "PHASE" | "QUALIFIER" {
    const qualifierKeys = [
      "sortBy",
      "approvedOnly",
      "minimumSubmissions",
      "advanceTopN",
      "advanceMinPercentage",
    ];
    const hasQualifierConfigKey = qualifierKeys.some((key) => key in config);
    if (hasQualifierConfigKey) {
      return "QUALIFIER";
    }

    const normalizedName = name.trim().toLowerCase();
    if (normalizedName.includes("qualifier") || normalizedName.includes("seeding")) {
      return "QUALIFIER";
    }
    return "PHASE";
  }

  function applyRoutingHelper() {
    setError(null);
    setMessage(null);

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(rulesetConfigText);
    } catch {
      setError("Ruleset config must be valid JSON before applying helper.");
      return;
    }

    const sourceMatchId =
      helperSourceMatchId === "" ? undefined : Number(helperSourceMatchId);
    const targetMatchId =
      helperTargetMatchId === "" ? undefined : Number(helperTargetMatchId);
    const targetPhaseId =
      helperTargetPhaseId === "" ? undefined : Number(helperTargetPhaseId);

    if (!sourceMatchId && !targetMatchId && !targetPhaseId) {
      setError("Pick at least one helper value to apply.");
      return;
    }

    const nextConfig = JSON.parse(
      JSON.stringify(parsedConfig),
    ) as Record<string, unknown>;

    const applyTargetsToRules = (rules: unknown[]) => {
      rules.forEach((rule) => {
        if (!rule || typeof rule !== "object") {
          return;
        }
        const typedRule = rule as Record<string, unknown>;
        const type = String(typedRule.type ?? "");
        const canRoute =
          type === "ADVANCE_TOP_N" ||
          type === "ADVANCE_TOP_PERCENT" ||
          type === "SEND_RANK_RANGE_TO_PHASE" ||
          type === "SEND_REMAINING_TO_PHASE";
        if (!canRoute) {
          return;
        }
        if (targetMatchId) {
          typedRule.targetMatchId = targetMatchId;
        }
        if (targetPhaseId) {
          typedRule.targetPhaseId = targetPhaseId;
        }
      });
    };

    const steps = nextConfig.steps;
    if (Array.isArray(steps) && steps.length > 0) {
      const safeStepIndex = Math.min(
        Math.max(selectedStepIndex, 0),
        steps.length - 1,
      );
      const step = steps[safeStepIndex];
      if (step && typeof step === "object") {
        const typedStep = step as Record<string, unknown>;
        if (sourceMatchId) {
          typedStep.sourceMatchId = sourceMatchId;
        }
        if (Array.isArray(typedStep.rules)) {
          applyTargetsToRules(typedStep.rules);
        }
      }
    } else if (Array.isArray(nextConfig.rules)) {
      applyTargetsToRules(nextConfig.rules);
    } else {
      setError(
        "This config has no rules/steps to apply routing values to.",
      );
      return;
    }

    setRulesetConfigText(JSON.stringify(nextConfig, null, 2));
    setMessage("Routing helper applied to current config.");
  }

  function updateRoutingConfig(
    mutator: (config: Record<string, unknown>) => boolean,
    successMessage: string,
  ) {
    setError(null);
    setMessage(null);

    if (!parsedRulesetConfig.config) {
      setError("Ruleset config must be valid JSON.");
      return;
    }

    const nextConfig = JSON.parse(
      JSON.stringify(parsedRulesetConfig.config),
    ) as Record<string, unknown>;
    const changed = mutator(nextConfig);
    if (!changed) {
      setError("Routing update could not be applied to this ruleset config.");
      return;
    }

    setRulesetConfigText(JSON.stringify(nextConfig, null, 2));
    setMessage(successMessage);
  }

  function updateStepSourceMatchId(stepIndex: number, nextValue: number | "") {
    updateRoutingConfig((config) => {
      const steps = config.steps;
      if (!Array.isArray(steps)) {
        return false;
      }
      const step = steps[stepIndex];
      if (!step || typeof step !== "object") {
        return false;
      }
      const typedStep = step as Record<string, unknown>;
      if (nextValue === "") {
        delete typedStep.sourceMatchId;
      } else {
        typedStep.sourceMatchId = nextValue;
      }
      return true;
    }, "Step source match updated.");
  }

  function updateStepRuleTargetMatchId(
    stepIndex: number,
    ruleIndex: number,
    nextValue: number | "",
  ) {
    updateRoutingConfig((config) => {
      const steps = config.steps;
      if (!Array.isArray(steps)) {
        return false;
      }
      const step = steps[stepIndex];
      if (!step || typeof step !== "object") {
        return false;
      }
      const rules = (step as { rules?: unknown[] }).rules;
      if (!Array.isArray(rules)) {
        return false;
      }
      const rule = rules[ruleIndex];
      if (!rule || typeof rule !== "object") {
        return false;
      }
      const typedRule = rule as Record<string, unknown>;
      if (nextValue === "") {
        delete typedRule.targetMatchId;
      } else {
        typedRule.targetMatchId = nextValue;
      }
      return true;
    }, "Rule target match updated.");
  }

  function updateStepRuleTargetPhaseId(
    stepIndex: number,
    ruleIndex: number,
    nextValue: number | "",
  ) {
    updateRoutingConfig((config) => {
      const steps = config.steps;
      if (!Array.isArray(steps)) {
        return false;
      }
      const step = steps[stepIndex];
      if (!step || typeof step !== "object") {
        return false;
      }
      const rules = (step as { rules?: unknown[] }).rules;
      if (!Array.isArray(rules)) {
        return false;
      }
      const rule = rules[ruleIndex];
      if (!rule || typeof rule !== "object") {
        return false;
      }
      const typedRule = rule as Record<string, unknown>;
      if (nextValue === "") {
        delete typedRule.targetPhaseId;
      } else {
        typedRule.targetPhaseId = nextValue;
      }
      return true;
    }, "Rule target phase updated.");
  }

  async function previewProgression() {
    setError(null);
    setMessage(null);
    setCommitResult(null);
    if (!selectedMatchId) {
      setError("Select a match to preview progression.");
      return;
    }

    try {
      const response = await axios.post<PreviewResponse>(
        `matches/${selectedMatchId}/progression/preview`,
        stepOptions.length > 0 ? { stepIndex: selectedStepIndex } : {},
      );
      setPreview(response.data);
      setMessage("Preview generated.");
    } catch {
      setError("Failed to preview progression. Check that the phase has a valid ruleset.");
    }
  }

  async function loadCompletionStatus(matchId: number) {
    setCompletionStatusLoading(true);
    setCompletionStatusError(null);
    try {
      const response = await axios.get<MatchCompletionStatus>(
        `matches/${matchId}/completion-status`,
      );
      setCompletionStatus(response.data);
    } catch {
      setCompletionStatus(null);
      setCompletionStatusError("Failed to load match completion status.");
    } finally {
      setCompletionStatusLoading(false);
    }
  }

  async function commitProgression() {
    setError(null);
    setMessage(null);
    if (!selectedMatchId) {
      setError("Select a match before commit.");
      return;
    }
    if (!completionStatus) {
      setError("Completion status is unavailable. Refresh status before commit.");
      return;
    }
    if (completionStatus && !completionStatus.ready && !allowCommitWhenNotReady) {
      setError("Match is not complete yet. Use override to commit anyway.");
      return;
    }
    if (completionStatus && !completionStatus.ready && allowCommitWhenNotReady) {
      const accepted = window.confirm(
        "This match is not complete. Commit progression anyway?",
      );
      if (!accepted) {
        return;
      }
    }

    try {
      const response = await axios.post<{
        runId: string;
        saved: number;
        autoAssignedPlayers: number;
        preview: PreviewResponse;
      }>(`matches/${selectedMatchId}/progression/commit`, {
        autoAssignPlayersToTargetMatches: autoAssignOnCommit,
        stepIndex: stepOptions.length > 0 ? selectedStepIndex : undefined,
      });
      setCommitResult({
        runId: response.data.runId,
        saved: response.data.saved,
        autoAssignedPlayers: response.data.autoAssignedPlayers,
      });
      setPreview(response.data.preview);
      setMessage("Progression committed.");
      await loadCompletionStatus(selectedMatchId);
    } catch {
      setError("Failed to commit progression.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold theme-text">Rulesets & Progression</h2>
        <button
          onClick={loadData}
          className="rounded-md bg-lighter px-3 py-2 text-sm text-white"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold theme-text">Seeding phases</h3>
          <p className="text-xs text-gray-300">Select a ruleset per phase.</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {divisions.map((division) => (
            <div
              key={division.id}
              className="rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="text-sm font-semibold text-gray-100">
                {division.name}
              </div>
              <div className="mt-2 space-y-2">
                {(division.phases || []).map((phase) => (
                  <div
                    key={phase.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-gray-200">
                      {phase.name}
                    </span>
                    <select
                      value={phase.ruleset?.id ?? ""}
                      onChange={(event) =>
                        setPhaseRuleset(
                          phase,
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className="ml-auto w-32 shrink-0 rounded-md border border-gray-500 bg-transparent px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="">No ruleset</option>
                      {phaseRulesets.map((ruleset) => (
                        <option key={ruleset.id} value={ruleset.id}>
                          {ruleset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold theme-text">Create reusable ruleset</h3>
        <p className="mb-4 text-xs text-gray-300">
          Choose an existing ruleset to edit/delete, or keep <span className="font-semibold">New ruleset</span> selected to create one.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                Mode
              </label>
              <select
                value={editingRulesetId ?? ""}
                onChange={(event) =>
                  selectRulesetForEdit(event.target.value ? Number(event.target.value) : null)
                }
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
              >
                <option value="">New ruleset</option>
                {rulesets.map((ruleset) => (
                  <option key={ruleset.id} value={ruleset.id}>
                    Edit: {ruleset.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                Editing mode enables save and delete for that ruleset.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={rulesetName}
                  onChange={(event) => setRulesetName(event.target.value)}
                  placeholder="Ruleset name"
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                  State
                </label>
                <label className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={rulesetIsActive}
                    onChange={(event) => setRulesetIsActive(event.target.checked)}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                Description
              </label>
              <input
                type="text"
                value={rulesetDescription}
                onChange={(event) => setRulesetDescription(event.target.value)}
                placeholder="Optional description"
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                Templates
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRulesetConfigText(JSON.stringify(qualifiersTemplate, null, 2))}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Qualifiers
                </button>
                <button
                  onClick={() => setRulesetConfigText(JSON.stringify(seedingRoundTemplate, null, 2))}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Seeding (ranking only)
                </button>
                <button
                  onClick={() =>
                    setRulesetConfigText(JSON.stringify(doubleWaterfallTemplate, null, 2))
                  }
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Double Waterfall
                </button>
                <button
                  onClick={() =>
                    setRulesetConfigText(JSON.stringify(adaptiveWaterfall10To5Template, null, 2))
                  }
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Adaptive Waterfall (10 to 5)
                </button>
                <button
                  onClick={() => setRulesetConfigText(JSON.stringify(laderTemplate, null, 2))}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Lader
                </button>
                <button
                  onClick={() => setRulesetConfigText(JSON.stringify(finalsTemplate, null, 2))}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs text-white"
                >
                  Finals
                </button>
              </div>
            </div>
            <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
              Config (JSON)
            </label>
            <textarea
              value={rulesetConfigText}
              onChange={(event) => setRulesetConfigText(event.target.value)}
              rows={16}
              className="w-full rounded-md border border-white/15 bg-[#0f1720] px-3 py-2 font-mono text-xs text-white"
            />
            <p className="text-xs text-gray-400">
              Use a template, then adjust config for your phase. Progression templates usually need
              real <code>sourceMatchId</code> values and target routing (<code>targetMatchId</code> or <code>targetPhaseId</code>);
              qualifier/seeding templates may only need thresholds/sorting.
            </p>
            <div className="mt-3 rounded-md border border-white/15 bg-white/5 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                Routing helper
              </div>
              <p className="mb-2 text-xs text-gray-400">
                Fill IDs from dropdowns and apply to the selected step (or root rules if no steps exist).
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select
                  value={helperSourceMatchId}
                  onChange={(event) =>
                    setHelperSourceMatchId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="rounded-md border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                >
                  <option value="">Source match (optional)</option>
                  {allMatches.map((match) => (
                    <option key={`helper-source-${match.id}`} value={match.id}>
                      {match.divisionName} / {match.phaseName} / {match.name} ({match.id})
                    </option>
                  ))}
                </select>
                <select
                  value={helperTargetMatchId}
                  onChange={(event) =>
                    setHelperTargetMatchId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="rounded-md border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                >
                  <option value="">Target match (optional)</option>
                  {allMatches.map((match) => (
                    <option key={`helper-target-match-${match.id}`} value={match.id}>
                      {match.divisionName} / {match.phaseName} / {match.name} ({match.id})
                    </option>
                  ))}
                </select>
                <select
                  value={helperTargetPhaseId}
                  onChange={(event) =>
                    setHelperTargetPhaseId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="rounded-md border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                >
                  <option value="">Target phase (optional)</option>
                  {allPhases.map((phase) => (
                    <option key={`helper-target-phase-${phase.id}`} value={phase.id}>
                      {phase.divisionName} / {phase.name} ({phase.id})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={applyRoutingHelper}
                className="mt-2 rounded-md border border-amber-400/60 px-3 py-1 text-xs text-amber-100"
              >
                Apply helper to config
              </button>
            </div>
            <div className="mt-3 rounded-md border border-white/15 bg-white/5 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                Step routing editor
              </div>
              <p className="mb-2 text-xs text-gray-400">
                Configure <code>sourceMatchId</code>, <code>targetMatchId</code>, and{" "}
                <code>targetPhaseId</code> with pickers. Changes update JSON immediately.
              </p>
              {parsedRulesetConfig.error ? (
                <div className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                  {parsedRulesetConfig.error}
                </div>
              ) : null}
              {!parsedRulesetConfig.error && routingStepRows.length === 0 ? (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
                  No <code>steps[]</code> found in this config. Use a Waterfall template or add steps first.
                </div>
              ) : null}
              {routingReferenceWarnings.length > 0 ? (
                <div className="mt-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-xs text-amber-100">
                  <div className="font-semibold">Routing warnings</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {routingReferenceWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-2 space-y-2">
                {routingStepRows.map((stepRow) => (
                  <div
                    key={`routing-step-${stepRow.stepIndex}`}
                    className="rounded border border-white/10 bg-black/20 p-2"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-100">
                        {stepRow.stepName} (step {stepRow.stepIndex + 1})
                      </span>
                      <select
                        value={stepRow.sourceMatchId}
                        onChange={(event) =>
                          updateStepSourceMatchId(
                            stepRow.stepIndex,
                            event.target.value ? Number(event.target.value) : "",
                          )
                        }
                        className="rounded border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                      >
                        <option value="">Source match</option>
                        {allMatches.map((match) => (
                          <option key={`routing-source-${stepRow.stepIndex}-${match.id}`} value={match.id}>
                            {match.divisionName} / {match.phaseName} / {match.name} ({match.id})
                          </option>
                        ))}
                      </select>
                      {stepRow.sourceMatchId !== "" ? (
                        <span className="text-[11px] text-gray-400">
                          Current:{" "}
                          {allMatchesById.get(stepRow.sourceMatchId)?.name
                            ? `${allMatchesById.get(stepRow.sourceMatchId)?.name} (#${stepRow.sourceMatchId})`
                            : `#${stepRow.sourceMatchId}`}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {stepRow.routingRules.length === 0 ? (
                        <div className="text-xs text-gray-400">
                          No routing rules in this step.
                        </div>
                      ) : (
                        stepRow.routingRules.map((ruleRow) => (
                          <div
                            key={`routing-step-${stepRow.stepIndex}-rule-${ruleRow.ruleIndex}`}
                            className="grid grid-cols-1 gap-2 rounded border border-white/10 bg-white/5 p-2 md:grid-cols-3"
                          >
                            <div className="text-xs text-gray-200">
                              Rule {ruleRow.ruleIndex + 1}: {ruleRow.type}
                              {ruleRow.lane ? ` (${ruleRow.lane})` : ""}
                            </div>
                            <select
                              value={ruleRow.targetMatchId}
                              onChange={(event) =>
                                updateStepRuleTargetMatchId(
                                  stepRow.stepIndex,
                                  ruleRow.ruleIndex,
                                  event.target.value ? Number(event.target.value) : "",
                                )
                              }
                              className="rounded border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                            >
                              <option value="">Target match (optional)</option>
                              {allMatches.map((match) => (
                                <option
                                  key={`routing-target-match-${stepRow.stepIndex}-${ruleRow.ruleIndex}-${match.id}`}
                                  value={match.id}
                                >
                                  {match.divisionName} / {match.phaseName} / {match.name} ({match.id})
                                </option>
                              ))}
                            </select>
                            <select
                              value={ruleRow.targetPhaseId}
                              onChange={(event) =>
                                updateStepRuleTargetPhaseId(
                                  stepRow.stepIndex,
                                  ruleRow.ruleIndex,
                                  event.target.value ? Number(event.target.value) : "",
                                )
                              }
                              className="rounded border border-white/20 bg-transparent px-2 py-1 text-xs text-white"
                            >
                              <option value="">Target phase (optional)</option>
                              {allPhases.map((phase) => (
                                <option
                                  key={`routing-target-phase-${stepRow.stepIndex}-${ruleRow.ruleIndex}-${phase.id}`}
                                  value={phase.id}
                                >
                                  {phase.divisionName} / {phase.name} ({phase.id})
                                </option>
                              ))}
                            </select>
                            <div className="md:col-span-3 text-[11px] text-gray-400">
                              Target match:{" "}
                              {ruleRow.targetMatchId !== ""
                                ? allMatchesById.get(ruleRow.targetMatchId)?.name
                                  ? `${allMatchesById.get(ruleRow.targetMatchId)?.name} (#${ruleRow.targetMatchId})`
                                  : `#${ruleRow.targetMatchId}`
                                : "none"}{" "}
                              | Target phase:{" "}
                              {ruleRow.targetPhaseId !== ""
                                ? allPhasesById.get(ruleRow.targetPhaseId)?.name
                                  ? `${allPhasesById.get(ruleRow.targetPhaseId)?.name} (#${ruleRow.targetPhaseId})`
                                  : `#${ruleRow.targetPhaseId}`
                                : "none"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={saveRuleset}
            className="rounded-md bg-lighter px-3 py-2 text-sm text-white"
          >
            {editingRulesetId ? "Save ruleset" : "Create ruleset"}
          </button>
          {editingRulesetId ? (
            <>
              <button
                onClick={resetRulesetForm}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
              >
                New mode
              </button>
              <button
                onClick={deleteRuleset}
                className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20"
              >
                Delete ruleset
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold theme-text">Match progression test</h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={selectedMatchId ?? ""}
            onChange={(event) =>
              setSelectedMatchId(event.target.value ? Number(event.target.value) : null)
            }
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
          >
            <option value="">Select match</option>
            {allMatches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.divisionName} - {match.phaseName} - {match.name} (id: {match.id})
              </option>
            ))}
          </select>
          {stepOptions.length > 0 ? (
            <select
              value={selectedStepIndex}
              onChange={(event) => setSelectedStepIndex(Number(event.target.value))}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
            >
              {stepOptions.map((step) => (
                <option key={step.index} value={step.index}>
                  {step.name}
                  {step.sourceMatchId !== undefined ? ` (match ${step.sourceMatchId})` : ""}
                </option>
              ))}
            </select>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={autoAssignOnCommit}
              onChange={(event) => setAutoAssignOnCommit(event.target.checked)}
            />
            Auto-assign players to target matches on commit
          </label>
          <button
            onClick={previewProgression}
            className="rounded-md bg-slate-600 px-3 py-2 text-sm text-white"
          >
            Preview
          </button>
          <button
            onClick={commitProgression}
            disabled={
              !selectedMatchId ||
              completionStatusLoading ||
              !completionStatus ||
              (completionStatus?.ready === false && !allowCommitWhenNotReady)
            }
            className="rounded-md bg-amber-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Commit
          </button>
        </div>
        {selectedMatchId ? (
          <div className="mt-3 rounded border border-white/10 bg-white/5 p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-medium text-white">Completion status</span>
              {completionStatusLoading ? (
                <span className="text-gray-300">Checking...</span>
              ) : completionStatus ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    completionStatus.ready
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {completionStatus.ready ? "Ready" : "Not ready"}
                </span>
              ) : null}
              <button
                onClick={() => void loadCompletionStatus(selectedMatchId)}
                className="rounded border border-white/20 px-2 py-0.5 text-xs text-white"
              >
                Refresh status
              </button>
            </div>
            {completionStatusError ? (
              <div className="text-red-300">{completionStatusError}</div>
            ) : null}
            {completionStatus ? (
              <div className="space-y-2 text-gray-200">
                <div>
                  rounds complete: {completionStatus.completedRounds}/{completionStatus.totalRounds}
                </div>
                {completionStatus.ready ? (
                  <div className="text-emerald-200">
                    All required players submitted for all rounds.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {completionStatus.missingRounds.map((round) => (
                      <div key={round.roundId} className="rounded border border-white/10 px-2 py-1">
                        round {round.roundId} - {round.songTitle || `song ${round.songId}`} | submitted{" "}
                        {round.submittedPlayers}/{round.requiredPlayers} | missing:{" "}
                        {round.missingPlayers.map((player) => player.playerName || `#${player.id}`).join(", ")}
                      </div>
                    ))}
                  </div>
                )}
                {!completionStatus.ready ? (
                  <label className="flex items-center gap-2 text-amber-100">
                    <input
                      type="checkbox"
                      checked={allowCommitWhenNotReady}
                      onChange={(event) => setAllowCommitWhenNotReady(event.target.checked)}
                    />
                    Allow commit even when match is not ready
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {commitResult ? (
          <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-100">
            runId: {commitResult.runId} | saved: {commitResult.saved} | autoAssigned:{" "}
            {commitResult.autoAssignedPlayers}
          </div>
        ) : null}

        {preview ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 rounded border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
              ruleset: {preview.rulesetId}
              {preview.stepIndex !== undefined ? ` | step ${preview.stepIndex + 1}` : ""}
              {preview.stepName ? ` (${preview.stepName})` : ""}
              {preview.matchId ? ` | source match: ${preview.matchId}` : ""}
            </div>
            <div>
              <h4 className="mb-2 font-medium text-white">Ranking</h4>
              <div className="max-h-72 overflow-auto rounded border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left">
                    <tr>
                      <th className="px-2 py-1">Rank</th>
                      <th className="px-2 py-1">Player</th>
                      <th className="px-2 py-1">Points</th>
                      <th className="px-2 py-1">Avg %</th>
                      <th className="px-2 py-1">Fails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.ranking.map((row) => (
                      <tr key={row.player.id} className="border-t border-white/10">
                        <td className="px-2 py-1">{row.rank}</td>
                        <td className="px-2 py-1">{row.player.playerName}</td>
                        <td className="px-2 py-1">{row.totalPoints}</td>
                        <td className="px-2 py-1">{row.averagePercentage.toFixed(2)}</td>
                        <td className="px-2 py-1">{row.failCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium text-white">Actions</h4>
              <div className="max-h-72 overflow-auto rounded border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left">
                    <tr>
                      <th className="px-2 py-1">Player</th>
                      <th className="px-2 py-1">Action</th>
                      <th className="px-2 py-1">Target Phase</th>
                      <th className="px-2 py-1">Target Match</th>
                      <th className="px-2 py-1">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.actions.map((row) => (
                      <tr key={row.player.id} className="border-t border-white/10">
                        <td className="px-2 py-1">{row.player.playerName}</td>
                        <td className="px-2 py-1">{row.action}</td>
                        <td className="px-2 py-1">{row.targetPhaseId ?? "-"}</td>
                        <td className="px-2 py-1">{row.targetMatchId ?? "-"}</td>
                        <td className="px-2 py-1">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="mb-2 font-medium text-white">Unresolved ties</h4>
              {preview.unresolvedTies.length === 0 ? (
                <div className="rounded border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                  None
                </div>
              ) : (
                <div className="space-y-2">
                  {preview.unresolvedTies.map((tie, index) => (
                    <div
                      key={`${tie.reason}-${index}`}
                      className="rounded border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-100"
                    >
                      {tie.reason} | players: {tie.playerIds.join(", ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
