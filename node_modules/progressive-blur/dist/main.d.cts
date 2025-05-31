import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

interface RadialBlurProps extends React.HTMLAttributes<HTMLDivElement> {
    strength?: number;
    steps?: number;
    falloffPercentage?: number;
    tint?: string;
}
declare function RadialBlur({ strength, steps, falloffPercentage, tint, ...props }: RadialBlurProps): react_jsx_runtime.JSX.Element;

interface LinearBlurProps extends React.HTMLAttributes<HTMLDivElement> {
    strength?: number;
    steps?: number;
    falloffPercentage?: number;
    tint?: string;
    side?: "left" | "right" | "top" | "bottom";
}
declare function LinearBlur({ strength, steps, falloffPercentage, tint, side, ...props }: LinearBlurProps): react_jsx_runtime.JSX.Element;

export { LinearBlur, RadialBlur };
