import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { FileView } from "../src/file/file-view.js";
import { ImageView } from "../src/image/image-view.js";

describe("ImageView", () => {
  it("renders an authorized image and applies toolbar transformations", async () => {
    const user = userEvent.setup();
    render(<ImageView alt="Diagram" src="https://files.example/diagram.png" />);

    const image = screen.getByRole("img", { name: "Diagram" });
    expect(image).toHaveAttribute("src", "https://files.example/diagram.png");
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Rotate right" }));
    expect(image).toHaveStyle({ transform: "scale(1.25) rotate(90deg)" });
    expect(screen.getByText("125%")).toBeInTheDocument();
  });

  it("supports custom labels, actions, scale limits, and native image properties", async () => {
    const user = userEvent.setup();
    render(
      <ImageView
        actions={<button type="button">Share</button>}
        alt="Map"
        imageProps={{ decoding: "async", className: "consumer-image" }}
        initialScale={2}
        labels={{ zoomOut: "Smaller", rotateLeft: "Turn back" }}
        maxScale={2}
        minScale={1}
        scaleStep={1}
        src="map.png"
      />,
    );

    const image = screen.getByRole("img", { name: "Map" });
    expect(image).toHaveClass("consumer-image");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Smaller" }));
    await user.click(screen.getByRole("button", { name: "Turn back" }));
    expect(image).toHaveStyle({ transform: "scale(1) rotate(-90deg)" });
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("can hide controls and route image requests through FileView", () => {
    render(<FileView alt="Photo" controls={false} kind="image" src="photo.jpg" />);
    expect(screen.getByRole("img", { name: "Photo" })).toBeInTheDocument();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });
});
