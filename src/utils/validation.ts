// utils/validation.ts
export const validateNickname = (nickname: string): string | null => {
  if (!nickname || !nickname.trim()) {
    return "닉네임은 필수입니다.";
  }

  if (nickname.length < 2 || nickname.length > 6) {
    return "닉네임은 2~6자입니다.";
  }

  if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
    return "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.";
  }

  return null; // 검증 통과
};

export const validateName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return "이름은 필수입니다.";
  }

  if (name.length < 2 || name.length > 30) {
    return "이름은 2~30자입니다.";
  }

  if (!/^[가-힣a-zA-Z]+$/.test(name)) {
    return "이름은 한글, 영문만 사용 가능합니다.";
  }

  return null; // 검증 통과
};
