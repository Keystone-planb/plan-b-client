import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

type WaveLayerProps = {
  color: string;
  opacity: number;
  duration: number;
  offsetY: number;
  bCurveAmp: number;
};

const WaveLayer = ({
  color,
  opacity,
  duration,
  offsetY,
  bCurveAmp,
}: WaveLayerProps) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, translateX]);

  const waveHeight = 250;

  const d = `
    M 0 ${offsetY}
    C ${width * 0.15} ${offsetY - bCurveAmp}, ${width * 0.35} ${
      offsetY - bCurveAmp * 0.5
    }, ${width * 0.5} ${offsetY}
    C ${width * 0.65} ${offsetY + bCurveAmp * 0.5}, ${width * 0.85} ${
      offsetY + bCurveAmp
    }, ${width} ${offsetY}
    L ${width} ${waveHeight}
    L 0 ${waveHeight}
    Z
  `;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: width * 2,
        flexDirection: "row",
        transform: [{ translateX }],
        bottom: 0,
      }}
    >
      {[0, 1].map((i) => (
        <Svg key={i} width={width} height={waveHeight}>
          <Path d={d} fill={color} opacity={opacity} />
        </Svg>
      ))}
    </Animated.View>
  );
};

export default function OceanWaveFooter() {
  return (
    <View style={{ height: 180, width }} pointerEvents="none">
      <WaveLayer
        color="#93C5FD"
        opacity={0.4}
        duration={12000}
        offsetY={70}
        bCurveAmp={60}
      />
      <WaveLayer
        color="#60A5FA"
        opacity={0.6}
        duration={8500}
        offsetY={100}
        bCurveAmp={45}
      />
      <WaveLayer
        color="#2563EB"
        opacity={1}
        duration={5500}
        offsetY={130}
        bCurveAmp={30}
      />
    </View>
  );
}
