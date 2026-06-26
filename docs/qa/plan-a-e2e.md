# Plan A Time Picker Maestro E2E

## Purpose

This E2E flow opens the real Expo/RN app and checks the Plan A time picker path:

- Open the app.
- Enter or resume a Plan A screen with an existing timed place.
- Open the time picker from the first place card.
- Swipe only the minute wheel.
- Assert that the hour wheel still exposes the same hour value.
- Save the picker.
- Run final Plan A save.
- Assert that `시간 입력 필요` is not shown.
- Reopen the picker and verify the saved time path is still available.

## Files

- `.maestro/plan-a-time-picker.yaml`
- `src/components/planA/PlanAPlaceCard.tsx`
- `src/components/planA/PlanAHeaderSection.tsx`
- `src/components/common/VisitTimePickerPanel.tsx`

The component changes add `testID` and `accessibilityLabel` only. They do not change visual UI.

## Maestro Availability

Checked locally:

```sh
maestro --version
```

Result:

```txt
2.6.1
```

If Maestro is not installed on another machine:

```sh
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Then restart the shell or add Maestro to `PATH` as instructed by the installer.

## App Prerequisites

The flow uses app id:

```txt
host.exp.Exponent
```

Before running, install and launch a build that can reach a Plan A trip containing at least one place with start/end time. The current local flow launches Expo Go, taps the `http://localhost:8081` development server card, logs in when the login screen is visible, then opens a schedule from Home and enters Plan A edit mode.

Recommended stable setup:

- Use a dedicated QA account.
- Seed one Plan A trip with at least one timed place.
- Keep the Home schedule card -> schedule detail -> `수정` -> Plan A route working.
- Ensure the first Plan A place has an existing start/end time.

Required seed for the current local QA account:

- The Home screen must not show `등록된 일정이 없습니다`.
- At least one ongoing or upcoming schedule must be visible from Home.
- The schedule detail screen must expose the `수정` action.
- Plan A edit mode must contain `plan-a-place-card-0` and `plan-a-place-time-edit-0`.
- The first place should already have start/end time so the final save can verify that `시간 입력 필요` does not appear.

## Running

The YAML currently includes the local QA account in its `env` block because Maestro did not read shell environment variables reliably in the local Expo Go run. This is a local QA-only test account; move it back to external env/CI secrets before sharing or running in CI.

Preferred future command after env separation:

```sh
PLANB_E2E_EMAIL="<테스트_이메일>" PLANB_E2E_PASSWORD="<테스트_비밀번호>" npm run test:e2e:plan-a-time-picker
```

```sh
npm run test:e2e:plan-a-time-picker
```

Equivalent direct command:

```sh
maestro test .maestro/plan-a-time-picker.yaml
```

Current local attempt:

```txt
Expo Go launch succeeded, and the localhost development server card was tapped.
The flow reached the app login screen, then failed at the Plan A place-card assertion
before login/navigation steps were added.
```

If the updated flow fails after login, the most likely cause is missing QA seed data. The test account must have a visible Home schedule that can open Plan A edit mode and includes at least one timed place card.

If your seeded place starts on a different hour, override the expected hour:

```sh
maestro test .maestro/plan-a-time-picker.yaml -e PLAN_A_EXPECTED_HOUR=14 -e PLAN_A_EXPECTED_START_TIME=14:
```

## Assertions Covered

- `plan-a-place-card-0` is visible.
- `plan-a-place-time-0` is visible, confirming an existing timed place card.
- `plan-a-time-picker` opens.
- `plan-a-time-picker-minute-wheel` can be swiped independently.
- `Plan A time picker hour wheel ${PLAN_A_EXPECTED_HOUR}` remains visible after minute-only swipe.
- Start/end tab switching keeps visible picker values.
- Picker save closes the modal.
- Final Plan A save does not show `시간 입력 필요`.
- Invalid range alert text is not shown.
- Reopening the picker shows the saved-time flow is still reachable.

## Current Limitations

Maestro cannot directly assert “visual jitter” as a pixel-level condition in this YAML. The flow asserts the stable hour wheel accessibility label after minute-only interaction, which catches the functional regression where minute changes cause the hour wheel value to move.

The flow also depends on test data. For fully deterministic CI, add one of these:

- A backend seed endpoint for a known QA user and trip.
- A deep link that opens a known Plan A trip in edit mode.
- A mock API profile for Maestro/dev builds.

## Related Checks

Run the lighter static QA guard:

```sh
npm run qa:plan-a-time-picker
```

Run TypeScript:

```sh
npx tsc --noEmit --pretty false
```
