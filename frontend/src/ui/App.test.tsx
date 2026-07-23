import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the workspace shell", () => {
    render(<App />);

    expect(screen.getByText("AI Agent Workspace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /toggle dark mode/i })).toBeInTheDocument();
  });
});

