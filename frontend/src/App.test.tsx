import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  test("renders IHatePDF header", () => {
    render(<App />);
    const headerElement = screen.getByText(/IHatePDF/i);
    expect(headerElement).toBeInTheDocument();
  });

  test("renders tool selector on home page", () => {
    render(<App />);
    const toolSelectorHeading = screen.getByText(/Choose a Tool/i);
    expect(toolSelectorHeading).toBeInTheDocument();
  });

  test("renders all tool options", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /Merge PDFs/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Split PDF/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Compress PDF/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Convert PDF/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit PDF/i })).toBeInTheDocument();
  });
});
