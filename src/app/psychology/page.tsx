import SupportStaffPage from "../sports-support/SupportStaffPage";

export const dynamic = "force-dynamic";

export default function PsychologyPage() {
  return (
    <SupportStaffPage
      staffType="sports_psychologist"
      eyebrow="TAL Mental Performance"
      title="Psicologia deportiva"
      description="Directorio y registro de psicologos deportivos por club para acompanar foco, confianza, control emocional y preparacion competitiva."
      registerTitle="Registrar psicologo deportivo"
    />
  );
}
