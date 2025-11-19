import React from "react";
import AboutHero from "../about/AboutHero";
import AboutStats from "../about/AboutStats";
import MissionSection from "../about/MissionSection";
import ValuesSection from "../about/ValuesSection";
import TeamSection from "../about/TeamSection";
import AboutCTA from "../about/AboutCTA";

const AboutPage = () => {
  return (
    <>
      <AboutHero />
      <AboutStats />
      <MissionSection />
      <ValuesSection />
      <TeamSection />
      <AboutCTA />
    </>
  );
};

export default AboutPage;
