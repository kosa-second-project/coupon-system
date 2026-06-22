import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CouponList from './pages/CouponList';
import AdminCoupon from './pages/AdminCoupon';
import ConcurrencyTest from './pages/ConcurrencyTest';
import { useUserStore } from './store/useUserStore';

/**
 * [React Main Entry Component - App]
 * 
 * - 애플리케이션의 최상위(Root) 레이아웃 컴포넌트입니다.
 * - [Zustand 전역 상태 도입]: 
 *   기존의 로컬 useState(user)를 제거하고 Zustand 전역 스토어인 useUserStore에서 user 상태를 읽어옵니다.
 * - [URL 라우팅 구조]: 
 *   React Router의 `<Routes>`와 `<Route>`를 사용해 브라우저 주소창(URL)의 변화에 따라 적절한 화면 컴포넌트를 렌더링합니다.
 */
function App() {
  // Zustand 스토어에서 전역 user 상태를 구독합니다.
  const user = useUserStore((state) => state.user);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 
        [상단 내비게이션 바 컴포넌트]
        - 이제 props로 user나 onLogout을 내려줄 필요 없이, Navbar 내부에서 Zustand를 직접 사용합니다.
      */}
      <Navbar />

      {/* 
        [본문 콘텐츠 라우팅 영역]
        - <Routes>: 여러 개의 <Route> 중 현재 주소창의 URL 경로(path)와 일치하는 단 하나의 컴포넌트만 찾아 화면에 그립니다.
        - <Navigate>: 다른 주소로 즉시 이동(Redirect)시킵니다.
      */}
      <main style={{ flex: 1, padding: '1rem 0' }}>
        <Routes>
          
          {/* ==========================================
              비로그인 전용 경로 (로그인 / 회원가입)
              ========================================== */}
          {/* 
            로그인한 사용자가 주소창에 직접 `/login`이나 `/signup`을 쳐서 들어오려 하면 
            사용자 화면(Coupons)으로 자동 리다이렉트(Navigate)하고, 비로그인 상태일 때만 해당 폼을 보여줍니다.
          */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/coupons" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/coupons" replace /> : <Signup />} 
          />

          {/* ==========================================
              로그인 상태 전용 경로 (쿠폰 신청 / 어드민 / 동시성 테스트)
              ========================================== */}
          {/* 
            - 쿠폰 발급 목록: 로그인하지 않은 유저가 접근하면 로그인 창(`/login`)으로 돌려보냅니다.
            - 동시성 테스트: 로그인한 사용자만 모의 동시 요청 테스트를 수행할 수 있게 허용합니다.
            - 쿠폰 관리자: 로그인 검사와 동시에, 사용자의 권한(`role === 'ADMIN'`)을 한 번 더 검사합니다.
          */}
          <Route 
            path="/coupons" 
            element={user ? <CouponList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/concurrency" 
            element={user ? <ConcurrencyTest /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/admin" 
            element={
              user ? (
                user.role === 'ADMIN' ? (
                  <AdminCoupon />
                ) : (
                  <Navigate to="/coupons" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* ==========================================
              기타 예외 경로 처리
              ========================================== */}
          {/* 
            정의되지 않은 모든 잘못된 경로(`path="*"`)로 접속했을 때는
            현재 로그인 상태 여부에 따라 자동으로 메인 페이지 또는 로그인 화면으로 튕겨냅니다.
          */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/coupons" : "/login"} replace />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
