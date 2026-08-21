"use client";

import { BarChart3, Bot, Boxes, CreditCard, HandCoins, LayoutTemplate, Package, ReceiptText, ShoppingBag, ShoppingCart, Users, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/marketing/Reveal";

const features = [[ShoppingCart, "Sales", "Bring selling activity into your shared workspace."], [Boxes, "Inventory", "Keep stock workflows closer to products."], [ShoppingBag, "POS", "Support direct selling from the same platform."], [Package, "Orders", "Organize order workflows with more context."], [Users, "Customers", "Keep customer information connected."], [CreditCard, "CRM", "Coordinate relationship workflows."], [HandCoins, "Udhar", "Bring credit tracking into your operation."], [WalletCards, "Payments", "Keep payment workflows visible."], [ReceiptText, "Expenses", "Organize expense activity in context."], [BarChart3, "Analytics", "Make connected work easier to understand."], [Bot, "AI", "Prepare for intelligent operational assistance."], [LayoutTemplate, "Web Builder", "Create an online home for your business."]] as const;

export function FeaturesGrid() {
  const shouldReduceMotion = useReducedMotion();
  return <section id="features" className="bg-[#f5f7f5] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 lg:px-8"><Reveal className="max-w-2xl"><p className="text-sm font-semibold tracking-[0.16em] text-slate-600">FEATURES</p><h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">The tools your business needs, designed to work together.</h2></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{features.map(([Icon, title, description], index) => <Reveal key={title} delay={index * 0.025}><motion.article whileHover={shouldReduceMotion ? undefined : { y: -3 }} className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="size-5 text-[#6f9f7b]" /><h3 className="mt-6 font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></motion.article></Reveal>)}</div></div></section>;
}
