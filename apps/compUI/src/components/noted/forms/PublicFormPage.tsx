import { StandaloneQuestionnairePage } from './StandaloneQuestionnairePage';

export interface PublicFormPageProps {
  shareSlug?: string;
  apiBaseUrl?: string;
}

export function PublicFormPage(props: PublicFormPageProps) {
  return <StandaloneQuestionnairePage {...props} />;
}

export default PublicFormPage;
