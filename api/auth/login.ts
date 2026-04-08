import axios from "axios";

// 1. 서버 주소 설정
const BASE_URL = "http://api.planb-travel.cloud/v1";

/**
 * [POST] 이메일 로그인 API
 * @param email 사용자 아이디(이메일)
 * @param password 사용자 비밀번호
 * @returns { message: string, access_token: string, refresh_token: string }
 */
export const requestLogin = async (email: string, password: string) => {
  try {
    // 2. 명세서에 명시된 Endpoint(/api/auth/login)로 요청을 보냅니다.
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: email,
      password: password,
    });

    // 3. 성공 시 서버에서 받은 데이터를 반환합니다.
    return response.data;
  } catch (error: any) {
    // 4. 에러 발생 시 로그를 찍고 에러를 밖으로 던집니다.
    console.error(
      "로그인 API 상세 에러:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
