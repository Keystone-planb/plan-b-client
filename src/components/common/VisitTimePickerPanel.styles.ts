import { StyleSheet } from "react-native";

import {
  ITEM_HEIGHT,
  WHEEL_PADDING,
} from "./visitTimePickerUtils";

export const styles = StyleSheet.create({
  timeModalCard: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
  },

  timeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timeModalTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  timeModalCloseButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  timeModalPlaceName: {
    marginTop: 10,
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  timeModalGuide: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  timePickerPreview: {
    marginTop: 24,
    flexDirection: "row",
    gap: 10,
  },

  timePickerSummaryCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: "#F4F7FD",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  timePickerSummaryCardActive: {
    backgroundColor: "#2859E8",
  },

  timePickerSummaryLabel: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  timePickerSummaryLabelActive: {
    color: "#FFFFFF",
  },

  timePickerSummaryValue: {
    marginTop: 4,
    color: "#2563EB",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    letterSpacing: -0.4,
    textAlign: "center",
  },

  timePickerSummaryValueActive: {
    color: "#FFFFFF",
  },

  timeErrorArea: {
    marginTop: 10,
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
  },

  timeErrorText: {
    maxWidth: 280,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },

  wheelPickerArea: {
    width: 230,
    height: ITEM_HEIGHT * 5,
    marginTop: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    overflow: "hidden",
  },

  wheelColumn: {
    width: 64,
    height: ITEM_HEIGHT * 5,
  },

  wheelContent: {
    paddingVertical: WHEEL_PADDING,
  },

  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  wheelItemText: {
    color: "#94A3B8",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },

  wheelItemTextActive: {
    color: "#0F2A5F",
    fontSize: 23,
    fontWeight: "900",
  },

  timePickerColon: {
    width: 10,
    color: "#0F2A5F",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
    textAlign: "center",
  },

  timeModalSaveButton: {
    width: 220,
    height: 50,
    marginTop: 18,
    alignSelf: "center",
    borderRadius: 16,
    backgroundColor: "#2859E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2859E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  timeModalSaveButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },

  timeModalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
