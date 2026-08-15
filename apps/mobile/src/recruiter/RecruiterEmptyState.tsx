import { EmptyState } from '../components/EmptyState';

type RecruiterEmptyStateProps = {
  actionLabel: string;
  body: string;
  onAction: () => void;
  title: string;
};

export function RecruiterEmptyState({ actionLabel, body, onAction, title }: RecruiterEmptyStateProps) {
  return <EmptyState actionLabel={actionLabel} body={body} onAction={onAction} title={title} />;
}
