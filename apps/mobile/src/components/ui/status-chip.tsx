import { Chip } from '@/components/ui/chip';
import { Tokens } from '@/constants/theme';

export type StatusTone = 'neutral' | 'primary' | 'success' | 'steel' | 'danger';

const TONE_STYLES: Record<StatusTone, { color: string; backgroundColor: string }> = {
  neutral: { color: Tokens.foregroundSecondary, backgroundColor: '#ece9e2' },
  primary: { color: Tokens.primary, backgroundColor: '#f6e5cf' },
  success: { color: Tokens.success, backgroundColor: '#e3f2e6' },
  steel: { color: Tokens.steel, backgroundColor: '#e2edf4' },
  danger: { color: Tokens.danger, backgroundColor: '#fbe4e4' },
};

type StatusChipProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const style = TONE_STYLES[tone];
  return (
    <Chip color={style.color} backgroundColor={style.backgroundColor} borderColor={style.backgroundColor}>
      {label}
    </Chip>
  );
}
