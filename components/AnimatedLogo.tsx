"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

export default function AnimatedLogo() {
  // Container variants for staggered child animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  // Vertical brown bar
  const verticalBarVariants: Variants = {
    hidden: { scaleY: 0, originY: 1 },
    visible: {
      scaleY: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Upper diagonal arm (Gold)
  const topArmVariants: Variants = {
    hidden: { opacity: 0, x: -30, y: 30 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Lower diagonal arm (Darker Gold)
  const bottomArmVariants: Variants = {
    hidden: { opacity: 0, x: -30, y: -30 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Text animation (fade & slide up)
  const textVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- LOGO MARK (K SYMBOL) --- */}
      <div className="relative w-64 h-64 mb-4">
        <svg
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Vertical Bar (Brown) */}
          <motion.rect
            x="20"
            y="20"
            width="55"
            height="260"
            fill="#6B3A19"
            variants={verticalBarVariants}
          />

          {/* Top Diagonal Arm (Bright Gold/Yellow) */}
          <motion.path
            d="M75 140 L165 20 L285 220 L200 220 Z"
            fill="#D99B26"
            variants={topArmVariants}
          />

          {/* Bottom Parallel Arm (Darker Gold) */}
          <motion.path
            d="M75 140 L200 220 L285 220 L160 140 Z"
            fill="#B87D1B"
            variants={bottomArmVariants}
          />
        </svg>
      </div>

      {/* --- TYPOGRAPHY --- */}
      <div className="text-center w-full max-w-xs">
        {/* KPANDJI */}
        <motion.h1
          className="text-4xl font-extrabold tracking-wider text-black font-sans uppercase mb-1"
          variants={textVariants}
        >
          KPANDJI
        </motion.h1>

        {/* AUTOMOBILES BOX */}
        <motion.div
          className="bg-[#6B3A19] py-1 px-3 text-center"
          variants={textVariants}
        >
          <span className="text-white text-lg font-medium tracking-[0.25em] uppercase block">
            AUTOMOBILES
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}