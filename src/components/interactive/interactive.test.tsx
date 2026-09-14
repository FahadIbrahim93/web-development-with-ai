/**
 * Component tests for the interactive learning widgets.
 *
 * These cover the moments that decide whether a learner actually learns:
 * picking answers, getting honest feedback, and the solved callback that
 * unlocks progress. The lesson steps compose these primitives, so testing
 * them here guards every step at once.
 *
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NbQuiz } from "@/components/nb";
import {
  NbPickBestGame,
  NbPromptBuilderGame,
} from "@/components/interactive/games2";

afterEach(cleanup);

describe("NbQuiz", () => {
  it("fires onSolved only for the correct option", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    render(
      <NbQuiz
        question="Which part stores content that changes?"
        options={[
          { label: "HTML" },
          { label: "Database", correct: true },
          { label: "CSS" },
        ]}
        onSolved={onSolved}
      />,
    );

    await user.click(screen.getByRole("button", { name: /HTML/ }));
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Database/ }));
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });

  it("renders without feedback until the learner answers", () => {
    render(
      <NbQuiz question="Pick one" options={[{ label: "A", correct: true }]} />,
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.queryByText(/Have a go/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Correct!/)).not.toBeInTheDocument();
  });
});

describe("NbPickBestGame", () => {
  const options = [
    { text: "Make it pop", why: "Vague — AI can't act on this." },
    {
      text: "Bold bakery homepage with prices and a contact form",
      why: "Specific: audience, content, and structure.",
      best: true,
    },
  ];

  it("marks a wrong pick and does not solve", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    render(
      <NbPickBestGame
        prompt="Which brief gets the best website from AI?"
        options={options}
        onSolved={onSolved}
        solvedText="Nice — specifics in, great site out."
      />,
    );

    await user.click(screen.getByRole("button", { name: /Make it pop/ }));
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.getByText(/Plausible, but not the strongest/)).toBeInTheDocument();
  });

  it("fires onSolved for the best option", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    render(
      <NbPickBestGame
        prompt="Which brief gets the best website from AI?"
        options={options}
        onSolved={onSolved}
        solvedText="Nice — specifics in, great site out."
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Bold bakery homepage/ }),
    );
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Nice — specifics in/)).toBeInTheDocument();
  });
});

describe("NbPromptBuilderGame", () => {
  const fragments = [
    { text: "for my café", correct: true, why: "Audience first." },
    { text: "wow them", correct: false, why: "Vague ending." },
    { text: "build a warm one-page site", correct: true, why: "Then the what." },
    { text: "in pastel tones", correct: true, why: "Finally the vibe." },
  ];

  function renderGame(onSolved = vi.fn()) {
    return render(
      <NbPromptBuilderGame
        prompt="Assemble a prompt AI understands"
        fragments={fragments}
        onSolved={onSolved}
        solvedText="That's a prompt a builder can run with."
      />,
    );
  }

  it("fires onSolved exactly when the full correct sentence is assembled", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    renderGame(onSolved);

    await user.click(screen.getByRole("button", { name: "for my café" }));
    expect(onSolved).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "build a warm one-page site" }),
    );
    await user.click(screen.getByRole("button", { name: "in pastel tones" }));
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/That's a prompt a builder can run with/),
    ).toBeInTheDocument();
  });

  it("lets the learner remove a fragment and reorder before solving", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    renderGame(onSolved);

    // Wrong first pick, removed again, then the correct order from scratch.
    await user.click(screen.getByRole("button", { name: "wow them" }));
    await user.click(screen.getByRole("button", { name: "wow them" })); // undo

    await user.click(screen.getByRole("button", { name: "for my café" }));
    await user.click(
      screen.getByRole("button", { name: "build a warm one-page site" }),
    );
    await user.click(screen.getByRole("button", { name: "in pastel tones" }));

    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("does not fire onSolved for a full-but-wrong assembly", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    renderGame(onSolved);

    await user.click(screen.getByRole("button", { name: "wow them" }));
    await user.click(screen.getByRole("button", { name: "for my café" }));
    await user.click(
      screen.getByRole("button", { name: "build a warm one-page site" }),
    );
    await user.click(screen.getByRole("button", { name: "in pastel tones" }));

    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.getByText(/the order matters/)).toBeInTheDocument();
  });
});
