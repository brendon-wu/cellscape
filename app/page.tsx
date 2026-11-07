import Hero from "@/components/Hero";
import Simulator from "@/components/Simulator";
import { Difference, Footer, Method, Nav, Problem, Scale } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Problem />
      <Scale />
      <Simulator />
      <Difference />
      <Method />
      <Footer />
    </main>
  );
}
