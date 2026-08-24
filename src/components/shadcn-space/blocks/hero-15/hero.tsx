"use client";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import { Marquee } from "@/components/shadcn-space/animations/marquee";
import ParticleSphereAnimation from "@/components/shadcn-space/blocks/hero-15/particalsphear";

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    style: ["italic"],
});

export interface BrandList {
    image: string;
    name: string;
}

const HeroSection = ({ brandList }: { brandList: BrandList[] }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98] as const,
            },
        },
    };

    const h1Variants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.02,
            },
        },
    };

    const charVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
            },
        },
    };

    return (
        <section ref={sectionRef}>
            <motion.div
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={containerVariants}
                className="relative max-w-7xl overflow-hidden mx-auto px-4 lg:px-8 xl:px-16 py-7 md:py-24 md:min-h-196 flex flex-col gap-8 md:gap-24 items-center text-center justify-center"
            >
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-6">
                    <motion.div variants={itemVariants} className="w-fit bg-background flex items-center gap-1.5 border border-border py-1 px-3 rounded-full">
                        <div className="w-1 h-1 rounded-full bg-teal-400" />
                        <p className="text-sm font-normal text-foreground">Announcing API 1.0</p>
                        <ArrowRight size={16} className="text-foreground" />
                    </motion.div>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <motion.h1
                            variants={h1Variants}
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-foreground text-center"
                        >
                            {"Connect with ".split("").map((char, i) => (
                                <motion.span key={i} variants={charVariants}>{char}</motion.span>
                            ))}
                            <span className={`${instrumentSerif.className}`}>
                                {"real agents".split("").map((char, i) => (
                                    <motion.span key={i} variants={charVariants}>{char}</motion.span>
                                ))}
                            </span>
                            {" that bring clarity".split("").map((char, i) => (
                                <motion.span key={i} variants={charVariants}>{char}</motion.span>
                            ))}
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-base font-normal text-muted-foreground max-w-md">
                            Through partnerships with firms like QuantumLeap Tech and Stellaris Systems, we provide state
                        </motion.p>
                    </div>
                    <motion.div variants={itemVariants} className="flex flex-wrap gap-2 justify-center">
                        <Button className="relative overflow-hidden group h-auto px-5 md:px-6 py-2.5 md:py-3.5 cursor-pointer rounded-full border border-primary bg-primary text-primary-foreground shadow-none transition-all duration-300">
                            <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-background rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[18]" />
                            <span className="relative z-10 group-hover:text-primary transition-colors duration-300">
                                Start Building
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            className="relative overflow-hidden group h-auto px-5 md:px-6 py-2.5 md:py-3.5 cursor-pointer rounded-full text-foreground transition-all duration-300"
                        >
                            <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-foreground rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[20]" />
                            <span className="relative z-10 flex items-center gap-2 group-hover:text-background transition-colors duration-300">
                                Book a Demo
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                        </Button>
                    </motion.div>
                </div>
                <motion.div variants={itemVariants} className="relative z-10 flex flex-col items-center justify-center text-center gap-2 md:gap-4 md:max-w-2xl md:mx-auto overflow-hidden">
                    <p className="text-sm font-normal text-muted-foreground">Trusted by top teams at:</p>
                    {brandList && brandList.length > 0 && (
                        <div className="py-4">
                            <Marquee pauseOnHover className="[--duration:20s] p-0">
                                {brandList.map((brand, index) => (
                                    <div key={index}>
                                        <img
                                            src={brand.image}
                                            alt={brand.name}
                                            className="w-36 h-8 mr-6"
                                        />
                                    </div>
                                ))}
                            </Marquee>
                        </div>
                    )}
                </motion.div>
                <div className="absolute z-0 flex justify-center">
                    <ParticleSphereAnimation />
                    <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-background/50 via-transparent to-background" />
                </div>
            </motion.div>
        </section>
    )
}

export default HeroSection