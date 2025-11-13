import UploadAssessmentForm from "./_components/UploadAssessmentForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <UploadAssessmentForm />
      </div>
    </div>
  );
}
