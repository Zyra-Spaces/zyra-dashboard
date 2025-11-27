"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Image, Users, Sparkles, Lightbulb } from "lucide-react";
import { Check } from "lucide-react";

const ZyraLogo = () => (
  <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
    <svg width="32" height="31" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.4 0H25.8462V8.32929H25.8797L11.7873 22.6707H32V31H0V22.6707H0.212553L14.3049 8.32929H6.4V0Z" fill="#4780C6"/>
    </svg>
    <span className="text-xl font-semibold text-gray-800">Zyra Spaces</span>
  </Link>
);

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  required: boolean;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Your details",
    description: "Please provide your name and email",
    icon: <User className="w-5 h-5" />,
    route: "/onboarding/details",
    required: true,
  },
  {
    id: 2,
    title: "Profile pictures",
    description: "Add your profile picture and banner",
    icon: <Image className="w-5 h-5" />,
    route: "/onboarding/profile-pictures",
    required: false,
  },
  {
    id: 3,
    title: "Invite your team",
    description: "Start collaborating with your team",
    icon: <Users className="w-5 h-5" />,
    route: "/onboarding/team",
    required: false,
  },
  {
    id: 4,
    title: "Add your socials",
    description: "Share posts to your social accounts",
    icon: <Sparkles className="w-5 h-5" />,
    route: "/onboarding/socials",
    required: false,
  },
  {
    id: 5,
    title: "Create your first idea",
    description: "Start your first project",
    icon: <Lightbulb className="w-5 h-5" />,
    route: "/onboarding/create-idea",
    required: false,
  },
];

function isStepCompleted(stepId: number): boolean {
  if (typeof window === 'undefined') return false;
  
  switch (stepId) {
    case 1:
      return !!localStorage.getItem('onboarding_details');
    case 2:
      return !!(localStorage.getItem('onboarding_profile_pic') || localStorage.getItem('onboarding_banner_pic'));
    case 3:
      return !!localStorage.getItem('onboarding_team');
    case 4:
      return !!localStorage.getItem('onboarding_socials');
    case 5:
      return !!localStorage.getItem('onboarding_first_idea');
    default:
      return false;
  }
}

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
}) => {
  const router = useRouter();

  const handleStepClick = (step: Step) => {
    // Only allow navigation to completed steps or the current step
    // Required step (details) must be completed before moving forward
    if (step.id === 1 || isStepCompleted(step.id - 1) || step.id <= currentStep) {
      router.push(step.route);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Sidebar - Progress Tracker */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="p-8 border-b border-gray-200">
          <ZyraLogo />
        </div>

        {/* Steps */}
        <div className="flex-1 p-8">
          <div className="relative">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = isStepCompleted(step.id);
              const isLast = index === steps.length - 1;
              const canNavigate = step.id === 1 || isStepCompleted(step.id - 1) || step.id <= currentStep;

              return (
                <div key={step.id} className="relative">
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={!canNavigate}
                    className={`w-full flex items-start gap-4 transition-all ${
                      canNavigate
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {/* Step Icon */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-gray-100 border-gray-300"
                            : isCompleted
                            ? "bg-[#4780C6] border-[#4780C6]"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <div
                            className={`transition-colors ${
                              isActive
                                ? "text-gray-700"
                                : isCompleted
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          >
                            {step.icon}
                          </div>
                        )}
                      </div>
                      
                      {/* Connecting Line */}
                      {!isLast && (
                        <div
                          className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-16 transition-colors ${
                            isCompleted || isActive
                              ? "border-l-2 border-dashed border-[#4780C6]"
                              : "border-l-2 border-dashed border-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-medium mb-1 transition-colors ${
                            isActive
                              ? "text-gray-900"
                              : isCompleted
                              ? "text-gray-700"
                              : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </h3>
                        {step.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <p
                        className={`text-xs transition-colors ${
                          isActive
                            ? "text-gray-500"
                            : isCompleted
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-200">
          <div className="text-xs text-gray-400 space-y-1">
            <p>© Zyra Spaces 2025</p>
            <a
              href="mailto:help@zyraspaces.com"
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              help@zyraspaces.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-gray-50 relative overflow-auto">
        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 min-h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 lg:px-16 lg:py-10">
            <div className="w-full max-w-2xl">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
