import React from 'react';

interface StepperProps {
  currentStep: string; // e.g., 'delivery', 'payment', 'confirmation'
  steps: string[];     // e.g., ['Delivery', 'Payment', 'Confirmation']
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  const currentStepIndex = steps.findIndex(step => step.toLowerCase() === currentStep.toLowerCase());

  return (
    <div className="flex items-center justify-center mb-8 w-full px-4 md:px-0">
      {steps.map((step, index) => {
        const stepKey = step.toLowerCase();
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;

        return (
          <React.Fragment key={stepKey}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg
                            ${isActive ? 'bg-[#B2151B] text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`mt-2 text-xs md:text-sm text-center font-medium
                            ${isActive ? 'text-[#B2151B]' : isCompleted ? 'text-green-600' : 'text-gray-700'}`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 
                            ${isCompleted || isActive ? 'bg-[#B2151B]' : 'bg-gray-200'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper; 