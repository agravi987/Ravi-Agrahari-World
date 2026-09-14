"use client";

/**
 * GalaxyErrorBoundary (CLIENT) — insurance for the WebGL surface.
 * WebGL-availability checks cover missing hardware, but a render-phase
 * crash (context creation, shader compile, bad prop) would otherwise
 * blank the whole page. On error we swap in a provided fallback
 * (the 2D stage / a notice card) instead of failing the route.
 */
import { Component, type ReactNode } from "react";

interface GalaxyErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface GalaxyErrorBoundaryState {
  hasError: boolean;
}

export default class GalaxyErrorBoundary extends Component<
  GalaxyErrorBoundaryProps,
  GalaxyErrorBoundaryState
> {
  state: GalaxyErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GalaxyErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Galaxy] rendering crashed — using fallback:", error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}