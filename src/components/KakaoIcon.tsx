import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export default function KakaoIcon({ size = 18, color = "#3C1E1E" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C6.477 3 2 6.582 2 11C2 13.79 3.79 16.253 6.5 17.67L5.62 21.02C5.55 21.29 5.86 21.5 6.1 21.35L10.11 18.82C10.73 18.93 11.36 19 12 19C17.523 19 22 15.418 22 11C22 6.582 17.523 3 12 3Z"
        fill={color}
      />
    </Svg>
  );
}
