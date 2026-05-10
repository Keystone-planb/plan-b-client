import apiClient from "../client";

export type UpdateMyProfileRequest = {
  nickname?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type UpdateMyProfileResponse = {
  email: string;
  nickname: string;
  message: string;
};

const getProfileUpdateErrorMessage = (error: unknown) => {
  const responseData = (error as {
    response?: {
      data?: {
        error?: string;
        message?: string;
      };
    };
    message?: string;
  })?.response?.data;

  return (
    responseData?.error ??
    responseData?.message ??
    (error as { message?: string })?.message ??
    "프로필 정보를 수정하지 못했습니다."
  );
};

export const updateMyProfile = async (
  request: UpdateMyProfileRequest,
): Promise<UpdateMyProfileResponse> => {
  try {
    const response = await apiClient.patch<UpdateMyProfileResponse>(
      "/api/users/me",
      request,
    );

    return response.data;
  } catch (error) {
    throw new Error(getProfileUpdateErrorMessage(error));
  }
};
