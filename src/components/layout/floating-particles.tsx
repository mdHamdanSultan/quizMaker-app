"use client";

import { useEffect, useRef } from "react";

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	phase: number;
	breath: number;
};

export function FloatingParticlesBackground() {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let raf = 0;
		let particles: Particle[] = [];
		const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

		function resize() {
			if (!canvas || !ctx) return;
			const w = window.innerWidth;
			const h = window.innerHeight;
			canvas.width = w * DPR;
			canvas.height = h * DPR;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
			const count = Math.floor((w * h) / 22000);
			particles = Array.from({ length: Math.max(28, count) }, () => ({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * 0.38,
				vy: (Math.random() - 0.5) * 0.38,
				r: 36 + Math.random() * 90,
				phase: Math.random() * Math.PI * 2,
				breath: 0.35 + Math.random() * 0.65,
			}));
		}

		let t0 = performance.now();
		function frame(t: number) {
			if (!canvas || !ctx) return;
			const dt = Math.min(40, t - t0);
			t0 = t;
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;

			const base = ctx.createLinearGradient(0, 0, w, h);
			base.addColorStop(0, "#020617");
			base.addColorStop(0.45, "#0a162e");
			base.addColorStop(1, "#020617");
			ctx.fillStyle = base;
			ctx.fillRect(0, 0, w, h);

			const glow = ctx.createRadialGradient(w * 0.35, h * 0.15, 0, w * 0.35, h * 0.15, w * 0.55);
			glow.addColorStop(0, "rgba(37, 99, 235, 0.22)");
			glow.addColorStop(1, "rgba(2, 6, 23, 0)");
			ctx.fillStyle = glow;
			ctx.fillRect(0, 0, w, h);

			const time = t / 1000;
			for (const p of particles) {
				p.x += p.vx * (dt / 16);
				p.y += p.vy * (dt / 16);
				if (p.x < -p.r) p.x = w + p.r;
				if (p.x > w + p.r) p.x = -p.r;
				if (p.y < -p.r) p.y = h + p.r;
				if (p.y > h + p.r) p.y = -p.r;

				const pulse = p.r * (0.82 + 0.18 * Math.sin(time * p.breath + p.phase));
				const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulse);
				grd.addColorStop(0, "rgba(59, 130, 246, 0.15)");
				grd.addColorStop(0.45, "rgba(30, 64, 175, 0.07)");
				grd.addColorStop(1, "rgba(2, 6, 23, 0)");
				ctx.fillStyle = grd;
				ctx.beginPath();
				ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
				ctx.fill();
			}

			raf = requestAnimationFrame(frame);
		}

		resize();
		window.addEventListener("resize", resize);
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden />;
}
