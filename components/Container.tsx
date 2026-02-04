import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Container = ({ children, className = '', noPadding = false }: ContainerProps) => {
  const baseClasses = `flex-1 bg-white dark:bg-[#1A1A1A] ${noPadding ? '' : 'px-6'}`;
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return <SafeAreaView className={combinedClasses}>{children}</SafeAreaView>;
};
