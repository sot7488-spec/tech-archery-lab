import SupportStaffPage from "../sports-support/SupportStaffPage";

export const dynamic = "force-dynamic";

export default function ConditioningPage() {
  return (
    <SupportStaffPage
      staffType="physical_trainer"
      eyebrow="TAL Physical Performance"
      title="Acondicionamiento fisico"
      description="Directorio y registro de preparadores fisicos por club para dar seguimiento al trabajo de fuerza, movilidad, resistencia y prevencion de lesiones."
      registerTitle="Registrar preparador fisico"
    />
  );
}
