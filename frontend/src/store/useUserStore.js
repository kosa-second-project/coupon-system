import { create } from 'zustand';

/**
 * [Zustand 전역 상태 관리 스토어 - useUserStore]
 * 
 * - 현재 로그인한 사용자 정보(user)와 로그인/로그아웃 액션을 전역에서 관리합니다.
 */
export const useUserStore = create((set) => ({
  user: null,
  
  // 로그인 성공 시 사용자 정보 설정
  login: (userData) => set({ user: userData }),
  
  // 로그아웃 시 사용자 정보 초기화 (null 설정)
  logout: () => set({ user: null }),
}));
