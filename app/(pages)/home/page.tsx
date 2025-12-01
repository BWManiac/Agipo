import {
  ActivityPanel,
  AgentQuickChat,
  ChatWidget,
  CollaborationBar,
  FooterSection,
  HeroSection,
  KanbanBoard,
  MarketplaceSpotlight,
} from "./components";

export default function HomePage() {
  return (
      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12 md:px-8 lg:px-12 xl:px-24">
      <HeroSection />
        <section className="space-y-6">
        <KanbanBoard />
        <AgentQuickChat />
        </section>
          <ActivityPanel />
      <MarketplaceSpotlight />
      <CollaborationBar />
      <FooterSection />
      </main>
  );
}
