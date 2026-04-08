// src/api/users/signup.ts
import axios from "axios";

const BASE_URL = "http://api.planb-travel.cloud/v1";

export const requestSignup = async (
  email: string,
  password: string,
  nickname: string,
) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/signup`, {
      email,
      password,
      nickname,
    });
    return response.data;
  } catch (error: any) {
    console.error("회원가입 API 에러:", error.response?.data || error.message);
    throw error;
  }
};
