export type OmnicareMode = "INJURY_FIRST_AID" | "MEDICINE_DECODER";

export type UrgencyLevel = "CRITICAL_EMERGENCY" | "MODERATE_CARE" | "MILD_INFORMATIONAL";

export type AnimationType =
  | "RUNNING_WATER_COOLING"
  | "DIRECT_PRESSURE_BANDAGE"
  | "CPR_CHEST_COMPRESSIONS"
  | "CALMING_BREATH_BUBBLE"
  | "ROTATING_PILL_DOSAGE"
  | "ELEVATE_LIMB";

export type ToolType =
  | "COOLING_TIMER"
  | "PRESSURE_TIMER"
  | "CPR_METRONOME"
  | "DOSAGE_ALARM"
  | "NONE";

export interface EvaluatorAudit {
  problem_alignment_score: string;
  coding_security_score: string;
  efficiency_score: string;
  testing_robustness_score: string;
  accessibility_score: string;
  overall_grade: string;
}

export interface OmnicareResponse {
  mode: OmnicareMode;
  urgency_level: UrgencyLevel;
  emergency_call_required: boolean;
  calming_reassurance: string;
  headline_title: string;
  spoken_response: string;
  visual_detection: string;
  action_steps: string[];
  what_NOT_to_do: string[];
  animated_visual: {
    animation_type: AnimationType;
    animation_caption: string;
  };
  interactive_tool: {
    active: boolean;
    tool_type: ToolType;
    timer_seconds?: number;
    bpm?: number;
  };
  evaluator_audit: EvaluatorAudit;
}

export interface PresetCase {
  id: string;
  title: string;
  mode: OmnicareMode;
  category: string;
  description: string;
  prompt: string;
  sampleImageSvg?: string;
  data: OmnicareResponse;
}
