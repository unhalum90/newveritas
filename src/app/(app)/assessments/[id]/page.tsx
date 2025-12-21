import { AssessmentWizard } from "@/components/assessments/wizard";

export default async function AssessmentWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssessmentWizard assessmentId={id} />;
}

