import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 34,
  },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "web" ? 54 : 62,
  },
  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  centerContent: {
    alignItems: "center",
    marginTop: 48,
  },

  emptyResultContent: {
    alignItems: "center",
    marginTop: 46,
  },

  emptyResultImage: {
    width: 210,
    height: 190,
    marginBottom: 20,
  },

  emptyResultTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },

  emptyResultDescription: {
    marginTop: 11,
    color: "#8A9BB2",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },

  resetConditionButton: {
    minWidth: 220,
    minHeight: 50,
    marginTop: 25,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  resetConditionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  progressBox: {
    width: "100%",
    marginBottom: 54,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E8EFFB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },
  progressText: {
    marginTop: 10,
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  iconWrapper: {
    width: 216,
    height: 216,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },

  stepIcon: {
    width: 178,
    height: 178,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.45,
    textAlign: "center",
    marginBottom: 13,
  },
  placeCountText: {
    marginTop: 8,
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: "#8A9BB2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 19,
  },
  errorDescription: {
    color: "#EF4444",
    lineHeight: 19,
  },
  tipPill: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F2F7FF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tipPillEmoji: {
    fontSize: 11,
  },
  tipPillText: {
    color: "#2F6BFF",
    fontSize: 10,
    fontWeight: "900",
  },
  dotsArea: {
    marginTop: 55,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E0E8F2",
  },
  activeDot: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },
  emptyTipCard: {
    marginTop: 48,
    minHeight: 152,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8E5FF",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 22,
    paddingVertical: 24,
    justifyContent: "center",
  },

  emptyTipLabel: {
    color: "#2158E8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginBottom: 12,
  },

  emptyTipTitle: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 14,
  },

  emptyTipDescription: {
    color: "#8A9BB2",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },

  tipCard: {
    marginTop: 48,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 24,
    minHeight: 150,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  errorCard: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },
  tipCardHeader: {
    marginBottom: 9,
  },
  tipCardLabel: {
    color: "#2158E8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  errorTipCardLabel: {
    color: "#EF4444",
  },
  tipCardTitle: {
    color: "#1C2534",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 11,
    letterSpacing: -0.2,
  },
  tipCardDescription: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  errorButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    height: 38,
    minWidth: 92,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2158E8",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryText: {
    color: "#64748B",
  },
});
