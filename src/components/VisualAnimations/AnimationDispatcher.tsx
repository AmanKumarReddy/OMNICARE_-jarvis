import React from 'react';
import { AnimationType, ToolType } from '../../types';
import { WaterCoolingAnimation } from './WaterCoolingAnimation';
import { PressureBandageAnimation } from './PressureBandageAnimation';
import { CPRMetronomeAnimation } from './CPRMetronomeAnimation';
import { BreathBubbleAnimation } from './BreathBubbleAnimation';
import { LimbElevationAnimation } from './LimbElevationAnimation';
import { RotatingPillAnimation } from './RotatingPillAnimation';

interface Props {
  animationType: AnimationType;
  caption: string;
  toolType?: ToolType;
  timerSeconds?: number;
  bpm?: number;
}

export const AnimationDispatcher: React.FC<Props> = ({
  animationType,
  caption,
  timerSeconds = 600,
  bpm = 110,
}) => {
  switch (animationType) {
    case 'RUNNING_WATER_COOLING':
      return <WaterCoolingAnimation initialSeconds={timerSeconds || 600} caption={caption} />;

    case 'DIRECT_PRESSURE_BANDAGE':
      return <PressureBandageAnimation initialSeconds={timerSeconds || 300} caption={caption} />;

    case 'CPR_CHEST_COMPRESSIONS':
      return <CPRMetronomeAnimation bpm={bpm || 110} caption={caption} />;

    case 'CALMING_BREATH_BUBBLE':
      return <BreathBubbleAnimation caption={caption} />;

    case 'ELEVATE_LIMB':
      return <LimbElevationAnimation caption={caption} />;

    case 'ROTATING_PILL_DOSAGE':
    default:
      return <RotatingPillAnimation caption={caption} />;
  }
};
