'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminModeContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

interface AdminModeProviderProps {
  children: ReactNode;
  isAdmin: boolean; // 사용자가 관리자인지 여부 (서버에서 전달)
}

export function AdminModeProvider({ children, isAdmin }: AdminModeProviderProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 관리자 모드 상태 로컬 스토리지에서 복원
  useEffect(() => {
    if (isAdmin) {
      const saved = localStorage.getItem('adminMode');
      if (saved === 'true') {
        setIsAdminMode(true);
      }
    }
  }, [isAdmin]);

  // 관리자 모드 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('adminMode', isAdminMode.toString());
    }
  }, [isAdminMode, isAdmin]);

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdminMode((prev) => !prev);
    }
  };

  const setAdminMode = (value: boolean) => {
    if (isAdmin) {
      setIsAdminMode(value);
    }
  };

  return (
    <AdminModeContext.Provider value={{ isAdminMode: isAdmin && isAdminMode, toggleAdminMode, setAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider');
  }
  return context;
}
