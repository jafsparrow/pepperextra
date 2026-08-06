import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  message?: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <ThemedText type="small" style={emptyStyles.text}>
      {title}
      {message ? `\n${message}` : ''}
    </ThemedText>
  );
}

const emptyStyles = {
  text: {
    textAlign: 'center' as const,
    color: Tokens.muted,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
};
