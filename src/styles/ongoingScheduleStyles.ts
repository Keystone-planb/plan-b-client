import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 36,
  },

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 0,
    marginBottom: 0,
  },

  dayTab: {
    height: 48,
    minWidth: 82,
    borderRadius: 24,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  dayTabActive: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  dayTabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  dayTabTextActive: {
    color: "#FFFFFF",
  },

  mapSection: {
    height: 220,
    backgroundColor: "#EDF3F9",
    overflow: "hidden",
  },

  mapFake: {
    flex: 1,
    backgroundColor: "#F5F6F7",
    position: "relative",
  },

  mapRoadDiagonalOne: {
    position: "absolute",
    width: 380,
    height: 26,
    left: 38,
    top: 104,
    backgroundColor: "#DEE3EA",
    transform: [{ rotate: "-31deg" }],
    borderRadius: 20,
  },

  mapRoadDiagonalTwo: {
    position: "absolute",
    width: 370,
    height: 20,
    left: 6,
    top: 154,
    backgroundColor: "#E7EBF0",
    transform: [{ rotate: "-18deg" }],
    borderRadius: 20,
  },

  mapRoadHorizontalOne: {
    position: "absolute",
    width: 520,
    height: 16,
    left: -20,
    top: 58,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapRoadHorizontalTwo: {
    position: "absolute",
    width: 520,
    height: 15,
    left: -40,
    top: 190,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapLabel: {
    position: "absolute",
    color: "#667085",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },

  mapLabelOne: {
    left: 36,
    top: 126,
  },

  mapLabelTwo: {
    right: 120,
    top: 26,
  },

  mapLabelThree: {
    right: 18,
    top: 86,
    width: 118,
  },

  mapLabelFour: {
    left: 184,
    top: 58,
    width: 110,
    textAlign: "center",
  },

  mapMarkerMain: {
    position: "absolute",
    left: 218,
    top: 158,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7D92BD",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapMarkerSmallOne: {
    position: "absolute",
    right: 98,
    top: 122,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#91A4CC",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapExpandButton: {
    position: "absolute",
    right: 16,
    top: 14,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  todayHeader: {
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  todayTitle: {
    color: "#000000",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  editText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "800",
  },

  disabledEditText: {
    color: "#94A3B8",
  },

  timelineList: {
    position: "relative",
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 14,
  },

  futureTimelineList: {
    gap: 28,
  },

  timelineLine: {
    position: "absolute",
    left: 61,
    top: 38,
    bottom: 68,
    width: 3,
    backgroundColor: "#2158E8",
    borderRadius: 999,
  },

  futureTimelineLine: {
    backgroundColor: "#cedcff",
  },

  editTimelineLine: {
    backgroundColor: "#DDE5F0",
  },

  todayCard: {
    minHeight: 98,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "column",
    alignItems: "stretch",
  },

  futureTodayCard: {
    minHeight: 82,
    backgroundColor: "transparent",
    paddingVertical: 0,
    paddingHorizontal: 18,
  },

  todayCardActive: {
    borderWidth: 1.5,
    borderColor: "#2158E8",
    backgroundColor: "#FFFFFF",
  },

  editTodayCard: {
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#FFFFFF",
  },

  numberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  numberText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "900",
  },

  placeInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
    marginRight: 12,
  },

  placeName: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  placeAddress: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 7,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 5,
  },

  alternativeButton: {
    minWidth: 118,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#2158E8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  disabledAlternativeButton: {
    opacity: 0.55,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 3,
  },

  deleteMemoButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  memoList: {
    marginTop: -6,
    paddingLeft: 92,
    gap: 9,
  },

  memoCard: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  memoText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  timeTargetTabs: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    padding: 4,
    flexDirection: "row",
    marginBottom: 14,
  },

  timeTargetTab: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  timeTargetTabActive: {
    backgroundColor: "#2158E8",
  },

  timeTargetTabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },

  timeTargetTabTextActive: {
    color: "#FFFFFF",
  },

  emptyDayCard: {
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  emptyDayTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 7,
    textAlign: "center",
  },

  gapRecommendationSection: {
    marginTop: -4,
    marginBottom: 18,
  },

  addPlaceButton: {
    marginTop: 18,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  addPlaceButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2158E8",
  },

  emptyDayDescription: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default styles;
