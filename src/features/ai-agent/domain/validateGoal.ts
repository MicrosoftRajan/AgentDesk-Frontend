import { GOAL_MAX_LENGTH, GOAL_MIN_LENGTH } from "../constants";

export type GoalValidation =
  | { ok: true; goal: string }
  | { ok: false; goal: string; message: string };

export function validateGoal(raw: string): GoalValidation {
  const goal = raw.trim();

  if (goal.length === 0) {
    return {
      ok: false,
      goal,
      message: "Enter a goal to run the agent.",
    };
  }

  if (goal.length < GOAL_MIN_LENGTH) {
    return {
      ok: false,
      goal,
      message: `Use at least ${GOAL_MIN_LENGTH} characters.`,
    };
  }

  if (goal.length > GOAL_MAX_LENGTH) {
    return {
      ok: false,
      goal,
      message: `Keep the goal under ${GOAL_MAX_LENGTH} characters.`,
    };
  }

  return { ok: true, goal };
}
