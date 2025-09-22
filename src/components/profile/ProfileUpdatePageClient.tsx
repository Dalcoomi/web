// components/profile/ProfileUpdatePageClient.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import {
  updateProfile,
  updateAvatar,
  checkNicknameAvailability,
  SocialType,
  disconnectSocial,
  integrateSocial,
} from "@/services/memberService";
import { isPWA, isMobile } from "@/utils/deviceDetection";
import { useMemberStore } from "@/stores/useMemberStore";
import { validateNickname, validateName } from "@/utils/validation";

export default function ProfileUpdatePageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand 스토어에서 상태와 액션 가져오기
  const { member, fetchMember, updateMember } = useMemberStore();

  // 수정할 정보 상태 (로컬에서 관리)
  const [profileImage, setProfileImage] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [birthday, setBirthday] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [nicknameCheckResult, setNicknameCheckResult] = useState<
    "none" | "available" | "unavailable"
  >("none");
  const [nicknameError, setNicknameError] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");

  // UI 상태
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 소셜 연동 상태
  const [isUpdatingSocial, setIsUpdatingSocial] = useState(false);
  const [pendingSocialData, setPendingSocialData] = useState<{
    socialEmail: string;
    socialId: string;
    socialType: string;
    socialAccessToken: string;
  } | null>(null);

  // 기본 프로필 사진 URL들
  const defaultAvatars = [
    process.env.NEXT_PUBLIC_DEFAULT_AVATAR_1,
    process.env.NEXT_PUBLIC_DEFAULT_AVATAR_2,
    process.env.NEXT_PUBLIC_DEFAULT_AVATAR_3,
    process.env.NEXT_PUBLIC_DEFAULT_AVATAR_4,
  ].filter(Boolean);

  // 현재 프로필 사진이 기본 사진인지 확인
  const isDefaultAvatar = profileImage && defaultAvatars.includes(profileImage);

  // 브라우저 및 환경 감지 함수들
  const isKakaoTalkBrowser = () => {
    return /KAKAOTALK/i.test(navigator.userAgent);
  };

  const isEdge = () => {
    return /Edg\//.test(navigator.userAgent);
  };

  // 리다이렉트를 사용해야 하는 경우 판단
  const shouldUseRedirect = () => {
    return isKakaoTalkBrowser() || isPWA() || isMobile();
  };

  // 초기 데이터 로드 (Zustand 스토어를 통해 처리)
  useEffect(() => {
    // 페이지 로드 시 회원 정보가 없으면 fetchMember 호출
    if (!member) {
      fetchMember();
    }
  }, [member, fetchMember]);

  // Zustand 스토어의 member가 업데이트되면 로컬 상태 업데이트
  useEffect(() => {
    if (member) {
      setProfileImage(member.profileImageUrl || "");
      setNickname(member.nickname || "");
      setName(member.name || "");
      setBirthday(member.birthday || "");
      setGender(member.gender || "");
    }
  }, [member]);

  // 프로필 사진 변경
  const handleImageClick = () => {
    setShowAvatarModal(true);
  };

  // 프로필 사진 수정 선택
  const handleEditAvatar = () => {
    setShowAvatarModal(false);
    fileInputRef.current?.click();
  };

  // 프로필 사진 수정
  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      alert(err.message || "이미지 파일만 업로드 가능합니다.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(err.message || "파일 크기는 10MB 이하여야 합니다.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // 이미 제출 중이면 무시
    if (isSubmitting) {
      return;
    }

    // 제출 시작
    setIsSubmitting(true);

    try {
      const newAvatarUrl = await updateAvatar(file, false);

      // Zustand 스토어 업데이트
      updateMember({ profileImageUrl: newAvatarUrl });

      setProfileImage(newAvatarUrl);
    } catch (err) {
      console.error("Profile image update failed:", err);
      alert(err.message || "프로필 사진 변경에 실패했습니다.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsSubmitting(false);
    }
  };

  // 프로필 사진 기본 이미지로 변경
  const handleChangeDefaultAvatar = async () => {
    setShowAvatarModal(false);

    try {
      const newAvatarUrl = await updateAvatar(null, true);

      // Zustand 스토어 업데이트
      updateMember({ profileImageUrl: newAvatarUrl });

      setProfileImage(newAvatarUrl);
    } catch (err) {
      console.error("Profile image change failed:", err);
      alert(err.message || "프로필 사진 변경에 실패했습니다.");
    }
  };

  // 닉네임 중복 확인 핸들러
  const handleCheckNickname = async () => {
    // 현재 닉네임과 같으면 확인할 필요 없음
    if (member?.nickname === nickname.trim()) {
      setNicknameCheckResult("available");
      setNicknameError("");
      return;
    } else {
      const nicknameValidationError = validateNickname(nickname);
      if (nicknameValidationError) {
        setNicknameError(nicknameValidationError);
        return;
      }
    }

    try {
      const isAvailable = await checkNicknameAvailability(nickname.trim());
      setNicknameCheckResult(isAvailable ? "available" : "unavailable");
      setNicknameError("");
    } catch (error) {
      console.error("Nickname check failed:", error);
      alert(error.message || "닉네임 확인에 실패했습니다.");
      setNicknameCheckResult("none");
    }
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value;
    setNickname(newNickname);
    setNicknameCheckResult("none");

    // 실시간 검증
    if (member?.nickname === newNickname.trim()) {
      setNicknameError("");
      return;
    } else {
      const error = validateNickname(newNickname);
      setNicknameError(error || "");
    }
  };

  // 이름 변경 핸들러
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // 실시간 검증
    const error = validateName(newName);
    setNameError(error || "");
  };

  // 회원 정보 수정
  const handleUpdateProfile = async () => {
    // 현재 닉네임과 같으면 확인할 필요 없음
    if (member?.nickname === nickname.trim()) {
      setNicknameError("");
    } else {
      const nicknameValidationError = validateNickname(nickname);
      if (nicknameValidationError) {
        setNicknameError(nicknameValidationError);
        return;
      }
    }

    const nameValidationError = validateName(name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    // 버튼이 비활성화되어 있으면 실행되지 않아야 함
    if (isUpdateButtonDisabled()) {
      return;
    }

    // 제출 시작
    setIsSubmitting(true);

    try {
      const updateData = {
        nickname: nickname.trim(),
        name: name.trim(),
        birthday: birthday || undefined,
        gender: gender || undefined,
      };

      const updatedProfile = await updateProfile(updateData);

      // Zustand 스토어 업데이트
      updateMember({
        nickname: updatedProfile.nickname,
        name: updatedProfile.name,
        birthday: updatedProfile.birthday,
        gender: updatedProfile.gender,
      });

      router.back();
    } catch (err) {
      console.error("Profile update failed:", err);
      alert(err.message || "프로필 수정에 실패했습니다. ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 완료 버튼 활성화 조건 계산
  const isUpdateButtonDisabled = () => {
    // 기본 검증 실패
    if (nicknameError || nameError) return true;

    // 필수 필드 비어있음
    if (!nickname.trim() || !name.trim()) return true;

    // 제출 중
    if (isSubmitting) return true;

    // 닉네임이 변경되었는데 중복 확인 안함
    if (
      member?.nickname !== nickname.trim() &&
      nicknameCheckResult !== "available"
    ) {
      return true;
    }

    return false;
  };

  // 소셜 타입 변환 함수
  const getSocialDisplayName = (socialType: SocialType) => {
    switch (socialType) {
      case SocialType.KAKAO:
        return "카카오";
      case SocialType.NAVER:
        return "네이버";
      default:
        return socialType;
    }
  };

  // 소셜 타입별 스타일 클래스
  const getSocialStyleClass = (socialType: SocialType) => {
    switch (socialType) {
      case SocialType.KAKAO:
        return "bg-[#fae100] text-[#3f211e]";
      case SocialType.NAVER:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // 카카오 연동을 위한 로그인 함수
  const handleKakaoIntegration = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // PWA, 모바일, 카카오톡 브라우저는 리다이렉트
    if (shouldUseRedirect()) {
      window.location.href = kakaoAuthUrl;
      return;
    }

    // PC 웹은 팝업
    handleKakaoPopupIntegration();
  };

  // 카카오 팝업 연동
  const handleKakaoPopupIntegration = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    let popupOptions = `width=${width},height=${height},left=${left},top=${top}`;

    if (isEdge()) {
      popupOptions +=
        ",scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no";
    }

    const popup = window.open(kakaoAuthUrl, "kakaoIntegration", popupOptions);

    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      setIsUpdatingSocial(false);
      return;
    }

    if (isEdge()) {
      popup.focus();
      setTimeout(() => {
        if (popup && (popup.closed || !popup.location)) {
          popup.close();
          window.location.href = kakaoAuthUrl;
          return;
        }
      }, 1000);
    }

    const checkInterval = isEdge() ? 300 : 500;
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener(
          "message",
          receiveKakaoIntegrationMessage,
          false
        );
        setIsUpdatingSocial(false);
      }
    }, checkInterval);

    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener(
        "message",
        receiveKakaoIntegrationMessage,
        false
      );
      setIsUpdatingSocial(false);
    }, 30000);

    window.addEventListener("message", receiveKakaoIntegrationMessage, false);

    function receiveKakaoIntegrationMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kakaoLogin") {
        if (event.data.success) {
          // pendingSocialData에 저장 후 연동 처리
          const socialData = {
            socialEmail: event.data.userData.email,
            socialId: event.data.userData.kakaoId,
            socialType: "KAKAO",
            socialAccessToken: event.data.userData.access_token || "",
          };
          setPendingSocialData(socialData);
          handleSocialIntegration(socialData);
        } else {
          if (!event.data.cancelled) {
            alert(`카카오 연동 실패: ${event.data.error}`);
          }
          setIsUpdatingSocial(false);
        }

        if (popup && !popup.closed) {
          popup.close();
        }

        window.removeEventListener(
          "message",
          receiveKakaoIntegrationMessage,
          false
        );
        clearInterval(checkPopup);
      }
    }
  };

  // 네이버 연동을 위한 로그인 함수
  const handleNaverIntegration = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const STATE = Math.random().toString(36).substring(2, 15);

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

    // PWA, 모바일, 카카오톡 브라우저는 리다이렉트
    if (shouldUseRedirect()) {
      try {
        localStorage.setItem("naverIntegrationState", STATE);
      } catch (error) {
        sessionStorage.setItem("naverIntegrationState", STATE);
      }
      window.location.href = naverAuthUrl;
      return;
    }

    // PC 웹은 팝업
    handleNaverPopupIntegration();
  };

  // 네이버 팝업 연동
  const handleNaverPopupIntegration = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const STATE = Math.random().toString(36).substring(2, 15);

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

    const popup = window.open(
      naverAuthUrl,
      "naverIntegration",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      setIsUpdatingSocial(false);
      return;
    }

    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener(
          "message",
          receiveNaverIntegrationMessage,
          false
        );
        setIsUpdatingSocial(false);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener(
        "message",
        receiveNaverIntegrationMessage,
        false
      );
      setIsUpdatingSocial(false);
    }, 30000);

    window.addEventListener("message", receiveNaverIntegrationMessage, false);

    function receiveNaverIntegrationMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "naverLogin") {
        if (event.data.success) {
          // pendingSocialData에 저장 후 연동 처리
          const socialData = {
            socialEmail: event.data.userData.email,
            socialId: event.data.userData.naverId,
            socialType: "NAVER",
            socialAccessToken: event.data.userData.access_token || "",
          };
          setPendingSocialData(socialData);
          handleSocialIntegration(socialData);
        } else {
          if (!event.data.cancelled) {
            alert(`네이버 연동 실패: ${event.data.error}`);
          }
          setIsUpdatingSocial(false);
        }

        if (popup && !popup.closed) {
          popup.close();
        }

        window.removeEventListener(
          "message",
          receiveNaverIntegrationMessage,
          false
        );
        clearInterval(checkPopup);
      }
    }
  };

  // 카카오 연결 해제 (프로필 수정용)
  const disconnectKakaoProfile = async () => {
    try {
      // pendingSocialData에 카카오 토큰이 있으면 그것을 사용
      if (
        pendingSocialData?.socialType === "KAKAO" &&
        pendingSocialData.socialAccessToken
      ) {
        await fetch("https://kapi.kakao.com/v1/user/unlink", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${pendingSocialData.socialAccessToken}`,
          },
        });
        console.log("카카오 연결 해제 성공 (토큰 사용)");
        return;
      }

      // pendingSocialData가 없으면 기존 방식 (카카오 SDK 사용)
      if ((window as any).Kakao && (window as any).Kakao.Auth) {
        // 현재 카카오 로그인 상태 확인
        (window as any).Kakao.Auth.getStatusInfo()
          .then((statusInfo: any) => {
            if (statusInfo.status === "connected") {
              // 카카오 앱과의 연결 해제
              (window as any).Kakao.API.request({
                url: "/v1/user/unlink",
                success: (response: any) => {
                  console.log("카카오 연결 해제 성공 (SDK 사용)");
                },
                fail: (error: any) => {
                  console.warn("카카오 연결 해제 실패:", error);
                },
              });
            }
          })
          .catch((error: any) => {
            console.warn("카카오 상태 확인 실패:", error);
          });
      }
    } catch (error) {
      console.warn("카카오 연결 해제 실패:", error);
    }
  };

  // 네이버 연결 해제 (프로필 수정용)
  const disconnectNaverProfile = async () => {
    try {
      // pendingSocialData에 네이버 토큰이 있으면 그것을 사용
      if (
        pendingSocialData?.socialType === "NAVER" &&
        pendingSocialData.socialAccessToken
      ) {
        const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
        const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

        const naverRevokeUrl = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&access_token=${pendingSocialData.socialAccessToken}`;

        // 네이버는 CORS 제한으로 팝업으로 처리
        const popup = window.open(
          naverRevokeUrl,
          "naverRevoke",
          "width=400,height=300"
        );

        // 팝업이 닫히면 완료로 간주
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            console.log("네이버 연결 해제 완료 (토큰 사용)");
          }
        }, 1000);

        return;
      }

      // pendingSocialData가 없으면 백엔드에서만 처리
      console.log("네이버 연동 해제는 백엔드에서만 처리됩니다.");
    } catch (error) {
      console.warn("네이버 연결 해제 실패:", error);
    }
  };

  // 소셜 연동 처리
  const handleSocialIntegration = async (socialData: {
    socialEmail: string;
    socialId: string;
    socialType: string;
    socialAccessToken: string;
  }) => {
    try {
      await integrateSocial({
        socialEmail: socialData.socialEmail,
        socialId: socialData.socialId,
        socialType: socialData.socialType,
      });

      // 로컬 상태 업데이트
      if (member?.socialTypes) {
        const updatedSocialTypes = [
          ...member.socialTypes,
          socialData.socialType as SocialType,
        ];
        updateMember({ socialTypes: updatedSocialTypes });
      }

      alert(
        `${getSocialDisplayName(
          socialData.socialType as SocialType
        )} 연동이 완료되었습니다.`
      );

      // 연동 완료 후 pendingSocialData 초기화
      setPendingSocialData(null);
    } catch (error) {
      alert(
        error ||
          `${getSocialDisplayName(
            socialData.socialType as SocialType
          )} 연동 중 오류가 발생했습니다.`
      );
    } finally {
      setIsUpdatingSocial(false);
    }
  };

  // 소셜 연동 토글 핸들러
  const handleSocialToggle = async (
    socialType: SocialType,
    checked: boolean
  ) => {
    if (isUpdatingSocial) return;

    setIsUpdatingSocial(true);
    try {
      if (!checked) {
        // 토글을 끄는 경우 = 연동 해제
        if (member?.socialTypes && member.socialTypes.length <= 1) {
          alert("마지막 연동 계정은 해제할 수 없습니다.");
          setIsUpdatingSocial(false);
          return;
        }

        const confirmed = confirm(
          `${getSocialDisplayName(socialType)} 연동을 해제하시겠습니까?`
        );
        if (!confirmed) {
          setIsUpdatingSocial(false);
          return;
        }

        // 1. 백엔드에서 연동 해제
        await disconnectSocial(socialType);

        // 2. 프론트에서 소셜 언링크 (실패해도 계속 진행)
        try {
          if (socialType === SocialType.KAKAO) {
            await disconnectKakaoProfile();
          } else if (socialType === SocialType.NAVER) {
            await disconnectNaverProfile();
          }
        } catch (unlinkError) {
          console.warn("소셜 언링크 실패:", unlinkError);
        }

        // 3. 로컬 상태 업데이트
        if (member?.socialTypes) {
          const updatedSocialTypes = member.socialTypes.filter(
            (type) => type !== socialType
          );
          updateMember({ socialTypes: updatedSocialTypes });
        }

        alert(`${getSocialDisplayName(socialType)} 연동이 해제되었습니다.`);
        setIsUpdatingSocial(false);
      } else {
        // 토글을 켜는 경우 = 연동 추가
        if (socialType === SocialType.KAKAO) {
          handleKakaoIntegration();
        } else if (socialType === SocialType.NAVER) {
          handleNaverIntegration();
        }
        // setIsUpdatingSocial(false)는 각 연동 함수에서 처리
        return;
      }
    } catch (error) {
      alert(
        error ||
          `${getSocialDisplayName(
            socialType
          )} 연동 설정 중 오류가 발생했습니다.`
      );
      setIsUpdatingSocial(false);
    }
  };

  if (!member) {
    return <div className="h-screen bg-white flex flex-col"></div>;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar />

      <div className="bg-[#11ABFF] text-white px-4 py-2 flex items-center">
        <h1 className="text-xl font-light">프로필 수정</h1>
      </div>

      <main className="flex-1 px-4 py-5 overflow-y-auto max-w-sm mx-auto w-full">
        {/* 프로필 사진 섹션 */}
        <div className="text-center mb-5">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="프로필 사진"
                width={96}
                height={96}
                quality={100}
                unoptimized={true}
                className="w-24 h-24 rounded-full object-cover cursor-pointer"
                onClick={handleImageClick}
              />
            ) : (
              <div
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center cursor-pointer"
                onClick={handleImageClick}
              ></div>
            )}
          </div>

          <button
            onClick={handleImageClick}
            className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            프로필 사진 변경
          </button>

          {/* 프로필 사진 수정/기본 이미지로 변경 모달 */}
          {showAvatarModal && (
            <>
              {/* 배경 오버레이 */}
              <div
                className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
                onClick={() => setShowAvatarModal(false)}
              ></div>

              {/* 모달 컨텐츠 */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] p-2 w-[80%] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 버튼들 */}
                <div className="flex">
                  <button
                    onClick={handleEditAvatar}
                    className="flex-1 mx-10 mb-4 mt-2 py-2 text-[#0EABFF] font-light border-3 rounded-[10px] hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    사진 선택
                  </button>
                </div>

                {/* 기본 프사가 아닐 때만 기본 이미지로 변경 버튼 표시 */}
                {profileImage && !isDefaultAvatar && (
                  <div className="flex">
                    <button
                      onClick={handleChangeDefaultAvatar}
                      className="flex-1 mx-10 mb-4 py-2 text-gray-600 font-light border-3 rounded-[10px] hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                      기본 이미지로 변경
                    </button>
                  </div>
                )}

                <div className="flex">
                  <button
                    onClick={() => setShowAvatarModal(false)}
                    className="flex-1 mx-10 mb-2 py-2 text-gray-600 font-light border-3 rounded-[10px] hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* 폼 섹션 */}
        <div className="space-y-3">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={handleNicknameChange}
                className="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                placeholder="닉네임을 입력하세요"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer text-sm whitespace-nowrap flex-shrink-0"
              >
                중복 확인
              </button>
            </div>

            {/* 에러 메시지 */}
            {nicknameError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{nicknameError}</p>
            )}

            {/* 확인 결과 메시지 */}
            {nicknameCheckResult === "available" && (
              <p className="text-xs text-green-500 mt-1 ml-1">
                사용 가능한 닉네임입니다.
              </p>
            )}

            {nicknameCheckResult === "unavailable" && (
              <p className="text-xs text-red-500 mt-1 ml-1">
                이미 사용 중인 닉네임입니다.
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={member.email}
              disabled
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              placeholder="이름을 입력하세요"
              maxLength={30}
            />

            {nameError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{nameError}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">생년월일</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-30 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">성별</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setGender(gender === "남성" ? "" : "남성")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  gender === "남성"
                    ? "border-[#2FA5FF] text-[#2FA5FF] bg-[#DDECFF]"
                    : "border-[#808080] bg-white text-[#808080]"
                }`}
              >
                남
              </button>
              <button
                type="button"
                onClick={() => setGender(gender === "여성" ? "" : "여성")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  gender === "여성"
                    ? "border-[#2FA5FF] text-[#2FA5FF] bg-[#DDECFF]"
                    : "border-[#808080] bg-white text-[#808080]"
                }`}
              >
                여
              </button>
            </div>
          </div>

          {/* 소셜 계정 연동 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              소셜 계정 연동 설정
            </label>
            <div className="space-y-3">
              {/* 카카오 연동 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-[#fae100] text-[#3f211e]">
                    카카오
                  </span>
                  <span className="text-sm text-gray-600">카카오</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      member.socialTypes?.includes(SocialType.KAKAO) || false
                    }
                    onChange={(e) =>
                      handleSocialToggle(SocialType.KAKAO, e.target.checked)
                    }
                    disabled={isUpdatingSocial}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0EABFF]"></div>
                </label>
              </div>

              {/* 네이버 연동 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-green-500 text-white">
                    네이버
                  </span>
                  <span className="text-sm text-gray-600">네이버</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      member.socialTypes?.includes(SocialType.NAVER) || false
                    }
                    onChange={(e) =>
                      handleSocialToggle(SocialType.NAVER, e.target.checked)
                    }
                    disabled={isUpdatingSocial}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0EABFF]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 수정 완료 버튼 */}
        <div className="px-10 mt-7 mb-6">
          <button
            onClick={handleUpdateProfile}
            disabled={isUpdateButtonDisabled()}
            className={`w-full py-3 rounded-md font-medium transition-colors ${
              isUpdateButtonDisabled()
                ? "bg-[#0EABFF] opacity-50 cursor-not-allowed text-white"
                : "bg-[#0EABFF] hover:bg-blue-500 cursor-pointer text-white"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center cursor-not-allowed">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                처리 중...
              </span>
            ) : (
              "수정 완료"
            )}
          </button>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
