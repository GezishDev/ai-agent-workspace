import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the NeuralDesk brand name", () => {
    render(<App />);
    expect(screen.getAllByText("NeuralDesk").length).toBeGreaterThan(0);
  });

  it("renders the sign in tab in the auth tab bar", () => {
    render(<App />);
    // Both the tab AND the submit button contain "Sign in" — use getAllBy
    const signInButtons = screen.getAllByRole("button", { name: /sign in/i });
    expect(signInButtons.length).toBeGreaterThanOrEqual(1);
    // The tab should have the active class
    expect(signInButtons.some((b) => b.className.includes("a-tab-on"))).toBe(true);
  });

  it("renders the register tab", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /^register$/i })).toBeInTheDocument();
  });

  it("renders the email input", () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
  });

  it("renders the password input", () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });
});
