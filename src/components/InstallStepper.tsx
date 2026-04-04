// src/components/InstallStepper.tsx
// Vertical stepper rendering for install instruction steps.
// Each step shows a numbered badge, connector line, reference icon
// in a dashed non-interactive container, and instruction text.
import type { JSX } from "react";
import type { InstallStep } from "@/lib/installSteps";
import { InstallStepIcon } from "@/components/InstallIcons";

// MARK: - Step card

/** Single instruction step with number badge, reference icon, and text. */
function StepCard({
  step,
  index,
  isLast,
}: {
  step: InstallStep;
  index: number;
  isLast: boolean;
}): JSX.Element {
  return (
    <div className="flex gap-3">
      {/* Stepper column: number badge + connector line */}
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs font-bold"
          style={{
            backgroundColor: "var(--color-brand-green)",
            color: "#fff",
          }}
        >
          {index + 1}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 my-1"
            style={{ backgroundColor: "var(--color-border-subtle)" }}
          />
        )}
      </div>

      {/* Content: icon reference + instruction text */}
      <div className="flex gap-3 items-start pb-4 min-w-0 flex-1">
        {/* Reference icon in dashed container — clearly not a button */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-lg"
            style={{
              border: "1.5px dashed var(--color-brand-teal)",
              backgroundColor: "var(--color-surface-green-tint)",
            }}
          >
            <InstallStepIcon iconKey={step.iconKey} />
          </div>
          <span
            className="text-[10px] font-medium leading-tight text-center"
            style={{ color: "var(--color-text-secondary)", maxWidth: "52px" }}
          >
            {step.iconLabel}
          </span>
        </div>

        {/* Instruction text */}
        <div className="min-w-0 pt-0.5">
          <p
            className="font-semibold text-sm leading-snug"
            style={{ color: "var(--color-text-primary)" }}
          >
            {step.title}
          </p>
          <p
            className="text-xs leading-snug mt-0.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {step.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

// MARK: - Stepper list

/** Renders a vertical stepper list with connector lines between steps. */
export function InstallStepper({
  steps,
  platformKey,
}: {
  steps: InstallStep[];
  platformKey: string;
}): JSX.Element {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <StepCard
          key={`${platformKey}-${i}`}
          step={step}
          index={i}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  );
}
