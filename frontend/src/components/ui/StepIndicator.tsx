import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-transparent border-emerald-400 text-emerald-400'
                    : 'bg-transparent border-slate-700 text-slate-600'}
                `}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-xs font-semibold leading-none ${
                    active ? 'text-emerald-300' : done ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-slate-600 mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 transition-colors ${
                  i < currentStep ? 'bg-emerald-500/50' : 'bg-slate-800'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
