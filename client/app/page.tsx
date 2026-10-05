import { HomeHero, HowItWorks, ModuleGrid } from "@/features/home";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
      <HomeHero />
      <ModuleGrid />
      <HowItWorks />
    </div>
  );
}
