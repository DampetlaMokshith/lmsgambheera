"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "motion/react";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [1, 1] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, -100]);

  // Mobile: No scroll animation, show straight
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative px-3 py-4">
        <div className="w-full relative">
          <div className="max-w-5xl mx-auto text-center mb-3">
            {titleComponent}
          </div>
          <MobileCard>{children}</MobileCard>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[70rem] lg:h-[85rem] flex items-center justify-center relative p-4 md:p-10 lg:p-20"
      ref={containerRef}
    >
      <div
        className="py-6 md:py-20 lg:py-32 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: { translate: MotionValue<number>; titleComponent: React.ReactNode }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const MobileCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="max-w-full mx-auto h-[calc(100vh-140px)] min-h-[500px] w-full border-2 border-[#6C6C6C] p-1.5 bg-[#222222] rounded-2xl shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-xl bg-zinc-900">
        {children}
      </div>
    </div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-6 md:-mt-8 lg:-mt-12 mx-auto h-[35rem] md:h-[42rem] lg:h-[50rem] w-full border-4 border-[#6C6C6C] p-2 md:p-4 lg:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-zinc-900 md:rounded-2xl md:p-2 lg:p-4">
        {children}
      </div>
    </motion.div>
  );
};
