export const qualifiersTemplate = {
  sortBy: "AVERAGE_PERCENTAGE",
  approvedOnly: false,
  minimumSubmissions: 0,
  advanceTopN: 0,
  advanceMinPercentage: 90,
};

export const seedingRoundTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Ranking-only seeding. No placement actions here; use Waterfall ruleset to place seeds into rounds.",
  rules: [],
};

export const doubleWaterfallTemplate = {
  tiePolicy: "MANUAL_EXTRA_SONG",
  notes:
    "Default Waterfall + Loser Bracket re-entry. Configure sourceMatchId/targetMatchId values to your actual matches.",
  steps: [
    {
      name: "Round 1 (winner pool)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        {
          type: "SEND_REMAINING_TO_PHASE",
          targetPhaseId: 0,
          targetMatchId: 0,
          lane: "LOSERS",
        },
      ],
    },
    {
      name: "Loser 1",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 2 (winner pool)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        {
          type: "SEND_REMAINING_TO_PHASE",
          targetPhaseId: 0,
          targetMatchId: 0,
          lane: "LOSERS",
        },
      ],
    },
    {
      name: "Loser 2",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 3 (winner pool)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        {
          type: "SEND_REMAINING_TO_PHASE",
          targetPhaseId: 0,
          targetMatchId: 0,
          lane: "LOSERS",
        },
      ],
    },
    {
      name: "Loser 3",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
    {
      name: "Round 4 (winner pool)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        {
          type: "SEND_REMAINING_TO_PHASE",
          targetPhaseId: 0,
          targetMatchId: 0,
          lane: "LOSERS",
        },
      ],
    },
    {
      name: "Round 5 (merge seeds + unbeaten winners)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        {
          type: "SEND_REMAINING_TO_PHASE",
          targetPhaseId: 0,
          targetMatchId: 0,
          lane: "LOSERS",
        },
      ],
    },
    {
      name: "Loser 4 (Round5 losers + climbers)",
      sourceMatchId: 0,
      rules: [
        {
          type: "ADVANCE_TOP_PERCENT",
          percent: 50,
          rounding: "UP",
          targetMatchId: 0,
        },
        { type: "ELIMINATE_BOTTOM_PERCENT", percent: 50, rounding: "DOWN" },
      ],
    },
  ],
};

export const adaptiveWaterfall10To5Template = {
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

export const laderTemplate = {
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

export const finalsTemplate = {
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
